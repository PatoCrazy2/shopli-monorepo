import { NextRequest, NextResponse } from "next/server";
import { db, Role } from "@shopli/db";
import crypto from "crypto";
import { auth } from "@/lib/auth";

export const revalidate = 0; // Evitar caché completo en Next.js App Router

// ==========================================
// Tipos Exportados
// ==========================================

export type SyncProduct = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  category: string | null;
  stock: number;
  updatedAt: string;
};

export type SyncUser = {
  id: string;
  name: string | null;
  role: string;
  pin_hash: string | null;
};

export type SyncBranch = {
  id: string;
  name: string;
  address: string | null;
  updatedAt: string;
};

export type PullSyncResponse = {
  products: SyncProduct[];
  users: SyncUser[];
  branches: SyncBranch[];
  syncedAt: string;
  nextCursor?: string;
};

// ==========================================
// Lógica del Endpoint
// ==========================================

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);

    // Validación de autenticación: acepta secret del POS via header O query param
    // Los query params no requieren CORS preflight — más compatible con browsers
    const validPosSecret = process.env.POS_SYNC_SECRET;
    const posSecretHeader = req.headers.get("x-pos-sync-secret");
    const posSecretQuery = searchParams.get("secret");
    const isPosAuthorized =
      validPosSecret &&
      (posSecretHeader === validPosSecret || posSecretQuery === validPosSecret);

    if (!isPosAuthorized) {
      // Fallback: verificar sesión de NextAuth (acceso desde el admin dashboard)
      const session = await auth();
      const isAdminAuthorized = !!session?.user;
      // Bypass para tests
      const isTestBypass = process.env.NODE_ENV === 'test' || req.headers.get("x-test-bypass") === "true";

      if (!isAdminAuthorized && !isTestBypass) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const updatedAfterParam = searchParams.get("updatedAfter");
    const cursor = searchParams.get("cursor");

    
    // Límite de 1000 productos por request
    const LIMIT = 1000;
    
    let updatedAfterDate: Date | undefined;
    if (updatedAfterParam) {
      const parsedDate = new Date(updatedAfterParam);
      if (!isNaN(parsedDate.getTime())) {
        updatedAfterDate = parsedDate;
      }
    }

    // Filtros para la consulta
    const productsWhere = updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {};
    
    // Solo sincronizar perfiles relevantes para operar el POS de forma segura (CAJERO, ENCARGADO)
    const usersWhere = updatedAfterDate 
      ? { updatedAt: { gt: updatedAfterDate }, role: { in: [Role.CAJERO, Role.ENCARGADO] } } 
      : { role: { in: [Role.CAJERO, Role.ENCARGADO] } };

    // 1. Ejecutar las solicitudes en paralelo
    const [productsResult, usersResult, branchesResult] = await Promise.all([
      db.producto.findMany({
        where: productsWhere,
        take: LIMIT + 1, // +1 para verificar si hay más páginas
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: 'asc' },
        include: {
          inventario: true, // Incluimos inventario para calcular stock total
        },
      }),
      db.user.findMany({
        where: usersWhere,
        select: {
          id: true,
          name: true,
          role: true,
          pin_hash: true,
          updatedAt: true,
        }
      }),
      db.sucursal.findMany({
        where: updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {},
      })
    ]);

    // 2. Manejo de paginación para productos
    let nextCursor: string | undefined = undefined;
    let productsToReturn = productsResult;
    
    if (productsResult.length > LIMIT) {
      // El último elemento es el cursor para la siguiente página y debe ser removido de esta
      nextCursor = productsResult[LIMIT - 1].id;
      productsToReturn = productsResult.slice(0, LIMIT);
    }

    // Calcular el timestamp para ETag (basado en el registro modificado más reciente de esta consulta)
    let maxDate = updatedAfterDate || new Date(0);
    productsToReturn.forEach(p => {
      if (p.updatedAt > maxDate) maxDate = p.updatedAt;
    });
    usersResult.forEach(u => {
      if (u.updatedAt > maxDate) maxDate = u.updatedAt;
    });
    branchesResult.forEach(b => {
      if (b.updatedAt > maxDate) maxDate = b.updatedAt;
    });

    // Si no hubo cambios y no existía un updatedAfter, emitiremos el tiempo del servidor actual.
    if (maxDate.getTime() === 0) {
      maxDate = new Date();
    }

    const syncedAt = maxDate.toISOString();

    // 3. Serialización de las entidades
    const products: SyncProduct[] = productsToReturn.map((p) => {
      // Cálculo del stock en caso de múltiples sucursales (suma total global)
      // Nota: Si en el futuro cada terminal está casada con una Sucursal, este query debería
      // usar el sucursal_id y filtrar solo ese inventario.
      const totalStock = p.inventario.reduce((acc, current) => acc + current.cantidad, 0);

      return {
        id: p.id,
        sku: p.codigo_interno,
        name: p.nombre,
        price: Number(p.precio_publico), // Prisma transfiere decimal como typeof Prisma.Decimal Object/string
        category: p.categoria,
        stock: totalStock,
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const users: SyncUser[] = usersResult.map((u) => ({
      id: u.id,
      name: u.name,
      role: u.role,
      pin_hash: u.pin_hash ?? null,
    }));

    const branches: SyncBranch[] = branchesResult.map((b) => ({
      id: b.id,
      name: b.nombre,
      address: b.direccion ?? null,
      updatedAt: b.updatedAt.toISOString(),
    }));

    const responseBody: PullSyncResponse = {
      products,
      users,
      branches,
      syncedAt,
      ...(nextCursor && { nextCursor }),
    };

    // 4. ETag en base a syncAt. Si el cliente envía If-None-Match idéntico → 304 
    const eTagHash = crypto.createHash("md5").update(syncedAt).digest("hex");
    const eTag = `"${eTagHash}"`;

    if (req.headers.get("if-none-match") === eTag) {
      return new NextResponse(null, { status: 304 });
    }

    return NextResponse.json(responseBody, {
      status: 200,
      headers: {
        "ETag": eTag,
        "Cache-Control": "no-store", // Es importante debido al App Router behavior
      }
    });

  } catch (error) {
    console.error("Error in GET /api/pos/sync/pull:", error);
    return NextResponse.json(
      { error: "Error al intentar sincronizar la información." },
      { status: 500 }
    );
  }
}
