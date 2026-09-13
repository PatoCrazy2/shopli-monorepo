import { NextRequest, NextResponse } from "next/server";
import { db, Role, SubscriptionStatus } from "@shopli/db";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { getEffectiveSubscription } from "@/lib/subscription-plans";

export const revalidate = 0; // Evitar caché completo en Next.js App Router

// ==========================================
// Tipos Exportados
// ==========================================

export type SyncProduct = {
  id: string;
  sku: string | null;
  name: string;
  price: number;
  precioMayoreo: number | null;
  minCantidadMayoreo: number | null;
  category: string | null;
  parentId: string | null;
  varianteNombre: string | null;
  updatedAt: string;
};

export type SyncInventory = {
  id: string;
  branchId: string;
  productId: string;
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

export type SyncGasto = {
  id: string;
  branchId: string;
  category: string;
  amount: number;
  description: string;
  date: string;
  providerId: string | null;
  updatedAt: string;
};

export type PullSyncResponse = {
  products: SyncProduct[];
  inventory: SyncInventory[];
  users: SyncUser[];
  branches: SyncBranch[];
  gastos: SyncGasto[];
  deactivatedProductIds: string[];
  deactivatedUserIds: string[];
  syncedAt: string;
  nextCursor?: string;
};

import { getCorsHeaders, handleCorsPreflight } from "@/lib/cors";
import { verifyPosSyncToken } from "@/lib/pos-token";

export async function OPTIONS(req: Request) {
  return handleCorsPreflight(req);
}

export async function GET(req: NextRequest) {
  const corsHeaders = getCorsHeaders(req);
  const responseHeaders = new Headers({
    ...corsHeaders,
    "Cache-Control": "no-store",
  });

  try {
    const { searchParams } = new URL(req.url);
    const updatedAfterParam = searchParams.get("updatedAfter");
    const cursor = searchParams.get("cursor");

    // 1. Extraer y verificar Token de Sincronización Bearer
    const authHeader = req.headers.get("authorization");
    let syncPayload = null;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.substring(7).trim();
      syncPayload = verifyPosSyncToken(token);
    }

    // Compatibilidad Transicional: Soporte temporal para el cliente POS en producción
    // que aún envía x-pos-sync-secret mientras sus cajeros se actualizan a la nueva versión
    const legacySecretHeader = req.headers.get("x-pos-sync-secret");
    const legacySecretQuery = searchParams.get("secret");
    const configuredLegacySecret = process.env.POS_SYNC_SECRET;
    const isLegacySecretValid =
      configuredLegacySecret &&
      (legacySecretHeader === configuredLegacySecret || legacySecretQuery === configuredLegacySecret);

    // Bypass exclusivo para CI en modo test con cabecera de control
    const isTestBypass =
      process.env.NODE_ENV === "test" && req.headers.get("x-test-bypass") === "true";

    // Determinación del tenant empresaId
    let empresaId: string | null = null;

    if (syncPayload) {
      empresaId = syncPayload.empresa_id;
    } else if (isLegacySecretValid || isTestBypass) {
      empresaId = searchParams.get("empresaId");
    } else {
      const session = await auth();
      if (session?.user?.empresa_id) {
        empresaId = session.user.empresa_id;
      }
    }

    if (!empresaId) {
      return NextResponse.json(
        { error: "No autorizado. Token de sincronización inválido o ausente." },
        { status: 401, headers: responseHeaders }
      );
    }

    // 2. Consulta y validación de la Empresa (tokenVersion y Suscripción SaaS)
    const empresa = await db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        id: true,
        tokenVersion: true,
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        gracePeriodEndsAt: true,
        stripeSubscriptionId: true,
      },
    });

    if (!empresa) {
      return NextResponse.json(
        { error: "Empresa no encontrada" },
        { status: 404, headers: responseHeaders }
      );
    }

    // 3. Validar tokenVersion contra la BD si vino por token POS
    if (syncPayload && syncPayload.tokenVersion !== empresa.tokenVersion) {
      return NextResponse.json(
        {
          error: "TOKEN_REVOKED",
          message:
            "El token del dispositivo ha sido revocado o la sesión fue reiniciada. Por favor vuelva a vincular el terminal.",
        },
        { status: 401, headers: responseHeaders }
      );
    }

    // 4. Validación de Suscripción SaaS
    const effectiveSub = getEffectiveSubscription(empresa);
    if (
      effectiveSub.effectiveStatus === SubscriptionStatus.PAST_DUE ||
      effectiveSub.effectiveStatus === SubscriptionStatus.UNPAID
    ) {
      return NextResponse.json(
        {
          error: "SUBSCRIPTION_SUSPENDED",
          message:
            "Tu suscripción ha vencido o se encuentra suspendida. Contacta al dueño de la cuenta para reactivar el servicio.",
        },
        { status: 402, headers: responseHeaders }
      );
    }

    // Límite de 1000 productos por request
    const LIMIT = 1000;
    
    let updatedAfterDate: Date | undefined;
    if (updatedAfterParam) {
      const parsedDate = new Date(updatedAfterParam);
      if (!isNaN(parsedDate.getTime())) {
        updatedAfterDate = parsedDate;
      }
    }

    // Filtros para la consulta por Empresa (Multi-Tenant)
    // Solo productos y usuarios activos para el catálogo descargable
    const productsWhere = {
      empresa_id: empresaId,
      isActive: true,
      ...(updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {})
    };
    
    // Solo sincronizar perfiles relevantes y activos para operar el POS de forma segura (CAJERO, ENCARGADO)
    const usersWhere = {
      empresa_id: empresaId,
      active: true,
      role: { in: [Role.CAJERO, Role.ENCARGADO] },
      ...(updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {})
    };

    // 1. Ejecutar las solicitudes en paralelo con tipado explícito
    const [
      productsResult,
      inventoryResult,
      usersResult,
      branchesResult,
      gastosResult,
      deactivatedProductsResult,
      deactivatedUsersResult
    ] = await Promise.all([
      db.producto.findMany({
        where: productsWhere,
        take: LIMIT + 1,
        ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
        orderBy: { id: "asc" },
      }),
      db.inventario_Sucursal.findMany({
        where: {
          sucursal: { empresa_id: empresaId },
          ...(updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {}),
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
        where: {
          empresa_id: empresaId,
          activo: true,
          ...(updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {})
        },
      }),
      db.gasto.findMany({
        where: {
          sucursal: { empresa_id: empresaId },
          ...(updatedAfterDate ? { updatedAt: { gt: updatedAfterDate } } : {}),
        },
      }),
      // Si es carga incremental, traemos los IDs de productos desactivados para que el POS los purgue
      updatedAfterDate
        ? db.producto.findMany({
            where: {
              empresa_id: empresaId,
              isActive: false,
              updatedAt: { gt: updatedAfterDate },
            },
            select: { id: true, updatedAt: true },
          })
        : Promise.resolve([]),
      // Si es carga incremental, traemos los IDs de usuarios desactivados para revocar y purgar
      updatedAfterDate
        ? db.user.findMany({
            where: {
              empresa_id: empresaId,
              active: false,
              role: { in: [Role.CAJERO, Role.ENCARGADO] },
              updatedAt: { gt: updatedAfterDate },
            },
            select: { id: true, updatedAt: true },
          })
        : Promise.resolve([]),
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
    inventoryResult.forEach(inv => {
      if (inv.updatedAt > maxDate) maxDate = inv.updatedAt;
    });
    usersResult.forEach(u => {
      if (u.updatedAt > maxDate) maxDate = u.updatedAt;
    });
    branchesResult.forEach(b => {
      if (b.updatedAt > maxDate) maxDate = b.updatedAt;
    });
    gastosResult.forEach(g => {
      if (g.updatedAt > maxDate) maxDate = g.updatedAt;
    });
    deactivatedProductsResult.forEach(p => {
      if (p.updatedAt > maxDate) maxDate = p.updatedAt;
    });
    deactivatedUsersResult.forEach(u => {
      if (u.updatedAt > maxDate) maxDate = u.updatedAt;
    });

    // Si no hubo cambios y no existía un updatedAfter, emitiremos el tiempo del servidor actual.
    if (maxDate.getTime() === 0) {
      maxDate = new Date();
    }

    const syncedAt = maxDate.toISOString();

    // 3. Serialización de las entidades
    const products: SyncProduct[] = productsToReturn.map((p) => {
      return {
        id: p.id,
        sku: p.codigo_interno,
        name: p.nombre,
        price: Number(p.precio_publico), // Prisma transfiere decimal como typeof Prisma.Decimal Object/string
        precioMayoreo: p.precio_mayoreo ? Number(p.precio_mayoreo) : null,
        minCantidadMayoreo: p.min_cantidad_mayoreo,
        category: p.categoria,
        parentId: p.parent_id,
        varianteNombre: p.variante_nombre,
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    const inventory: SyncInventory[] = inventoryResult.map((inv) => ({
      id: inv.id,
      branchId: inv.sucursal_id,
      productId: inv.producto_id,
      stock: inv.cantidad,
      updatedAt: inv.updatedAt.toISOString(),
    }));

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

    const gastos: SyncGasto[] = gastosResult.map((g) => ({
      id: g.id,
      branchId: g.sucursal_id,
      category: g.categoria,
      amount: Number(g.monto),
      description: g.descripcion,
      date: g.fecha.toISOString(),
      providerId: g.proveedor_id,
      updatedAt: g.updatedAt.toISOString(),
    }));

    const deactivatedProductIds = deactivatedProductsResult.map(p => p.id);
    const deactivatedUserIds = deactivatedUsersResult.map(u => u.id);

    const responseBody: PullSyncResponse = {
      products,
      inventory,
      users,
      branches,
      gastos,
      deactivatedProductIds,
      deactivatedUserIds,
      syncedAt,
      ...(nextCursor && { nextCursor }),
    };

    // 4. ETag en base a syncAt. Si el cliente envía If-None-Match idéntico → 304 
    const eTagHash = crypto.createHash("md5").update(syncedAt).digest("hex");
    const eTag = `"${eTagHash}"`;

    if (req.headers.get("if-none-match") === eTag) {
      return new NextResponse(null, { status: 304, headers: responseHeaders });
    }

    const headersWithEtag = new Headers(responseHeaders);
    headersWithEtag.set("ETag", eTag);

    return NextResponse.json(responseBody, {
      status: 200,
      headers: headersWithEtag,
    });

  } catch (error) {
    console.error("Error in GET /api/pos/sync/pull:", error);
    return NextResponse.json(
      { error: "Error al intentar sincronizar la información." },
      { status: 500, headers: responseHeaders }
    );
  }
}
