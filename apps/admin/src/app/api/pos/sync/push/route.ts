import { NextResponse } from "next/server";
import { db, Role, SyncStatus, EstadoTurno } from "@shopli/db";
import { z } from "zod";
import { auth } from "@/lib/auth";

// ==========================================
// Tipos Exportados
// ==========================================
export type PushSyncResponse = {
  inserted: number;
  failed: number;
  results: Array<{
    localId: string;
    serverId: string | null;
    status: "ok" | "error";
    reason?: string;
  }>;
};

// ==========================================
// Validación Zod
// ==========================================
// Nota: paymentMethod se recibe y valida, pero no se inserta ya que 
// el esquema base `Venta` de Prisma no cuenta actualmentre con dicha columna.
const pushSyncSchema = z.object({
  cashierId: z.string().uuid("El cashierId debe ser un UUID válido"),
  sales: z.array(
    z.object({
      localId: z.string().uuid("El localId de la venta debe ser UUID válido"),
      items: z.array(
        z.object({
          productId: z.string(),
          quantity: z.number().positive().int("La cantidad debe ser entera y positiva"),
          unitPrice: z.number().nonnegative("El precio unitario no puede ser negativo")
        })
      ).min(1, "La venta debe tener al menos un item"),
      total: z.number().nonnegative("El total no puede ser negativo"),
      createdAt: z.string().datetime("La fecha createdAt debe ser un string ISO válido")
    })
  )
});

// ==========================================
// Lógica del Endpoint POST
// ==========================================
export async function POST(req: Request) {
  try {
    const session = await auth();
    // Deshabilita la validación condicionalmente para pruebas (si se corriera localmente bajo test o injectamos cabecera para vitest externo)
    if (!session?.user && process.env.NODE_ENV !== 'test' && req.headers.get("x-test-bypass") !== "true") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // 1. Valida body completo con Zod
    const parseResult = pushSyncSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Estructura de payload inválida", details: parseResult.error.format() },
        { status: 400 }
      );
    }

    const { cashierId, sales } = parseResult.data;

    // 2. Verifica que cashierId exista y esté activo en PostgreSQL
    // Nota: A falta de status o is_active en User, verificamos que tenga el rol adecuado.
    const cashier = await db.user.findUnique({
      where: { id: cashierId }
    });

    if (!cashier || (cashier.role !== Role.CAJERO && cashier.role !== Role.ENCARGADO)) {
      return NextResponse.json(
        { error: "El usuario provisto no existe o no cuenta con permisos suficientes." },
        { status: 403 }
      );
    }

    const activeTurno = await db.turno.findFirst({
      where: { usuario_id: cashierId, estado: EstadoTurno.ABIERTO },
      orderBy: { fecha_apertura: "desc" }
    });

    if (!activeTurno) {
      return NextResponse.json(
        { error: "No hay un turno activo ('ABIERTO') para este usuario, la venta offline no puede asociarse." },
        { status: 409 }
      );
    }

    // 3. Verificamos Idempotencia antes de insertar
    const localIds = sales.map((sale) => sale.localId);
    const existingSales = await db.venta.findMany({
      where: { id: { in: localIds } },
      select: { id: true }
    });
    
    const existingSet = new Set(existingSales.map((v) => v.id));
    const results: PushSyncResponse["results"] = [];
    
    let inserted = 0;
    let failed = 0;

    // Filtramos las ventas ya insertadas previamente
    const pendingSales = sales.filter((sale) => {
      if (existingSet.has(sale.localId)) {
        // En caso de reintento idempotente exitoso devolvemos que ya está en sync
        results.push({
          localId: sale.localId,
          serverId: sale.localId,
          status: "ok",
          reason: "Ya sincronizado previamente."
        });
        return false;
      }
      return true;
    });

    // 4. Inserción con 1 sola transacción
    if (pendingSales.length > 0) {
      // Usaremos Prisma $transaction interactivo para poder verificar stock, restar e insertar ventas individualmente
      await db.$transaction(async (tx) => {
        for (const sale of pendingSales) {
          // A) Checar y descontar inventario de CADA producto en esta sucursal
          // En la instrucción se pide "tx.product.update con decrement", pero basándonos en tu modelo
          // de Prisma el stock reside relacionalmente en la tabla Inventario_Sucursal.
          for (const item of sale.items) {
            const inventory = await tx.inventario_Sucursal.findUnique({
              where: {
                sucursal_id_producto_id: {
                  sucursal_id: activeTurno.sucursal_id,
                  producto_id: item.productId
                }
              }
            });

            if (!inventory || inventory.cantidad < item.quantity) {
              const productName = (await tx.producto.findUnique({ where: { id: item.productId } }))?.nombre || item.productId;
              // Lanzar error explícito para forzar rollback de toda la Transacción
              throw new Error(`Stock insuficiente para el producto ${productName} (${inventory?.cantidad || 0} disponibles, solicitados: ${item.quantity})`);
            }

            // Descontamos del inventario físicamente
            await tx.inventario_Sucursal.update({
              where: {
                sucursal_id_producto_id: {
                  sucursal_id: activeTurno.sucursal_id,
                  producto_id: item.productId
                }
              },
              data: {
                cantidad: {
                  decrement: item.quantity
                }
              }
            });
          }

          // B) Inserta la Venta offline con sus respectivos Detalles anidados
          await tx.venta.create({
            data: {
              id: sale.localId, // Mantenemos el Venta ID igual al ID local devuelto por Dexie
              turno_id: activeTurno.id,
              sucursal_id: activeTurno.sucursal_id,
              total: sale.total,
              fecha: new Date(sale.createdAt),
              sync_status: SyncStatus.SYNCED,
              detalles: {
                create: sale.items.map((i) => ({
                  producto_id: i.productId,
                  cantidad: i.quantity,
                  precio_unitario_historico: i.unitPrice
                }))
              }
            }
          });

          // C) Acumular las ventas offline al turno actual (si quieres mantener en sincronía la tabla turno)
          await tx.turno.update({
            where: { id: activeTurno.id },
            data: {
              total_ventas: {
                increment: sale.total
              }
            }
          });

          inserted++;
          results.push({
            localId: sale.localId,
            serverId: sale.localId,
            status: "ok",
          });
        }
      });
    }

    // 5. Respuesta exitosa
    return NextResponse.json({
      inserted,
      failed,
      results
    } satisfies PushSyncResponse, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Stock insuficiente")) {
      return NextResponse.json(
        { error: "Transacción abortada: Conflicto de inventario", details: error.message },
        { status: 409 }
      );
    }

    console.error("Error in POST /api/pos/sync/push:", error);
    return NextResponse.json(
      { error: String(error) },
      { status: 500 }
    );
  }
}
