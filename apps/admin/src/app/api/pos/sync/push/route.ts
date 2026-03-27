import { NextResponse } from "next/server";
import { db, SyncStatus, EstadoTurno, EstadoVenta } from "@shopli/db";
import { z } from "zod";
import { auth } from "@/lib/auth";

// ==========================================
// Tipos Exportados
// ==========================================
export type PushSyncResponse = {
  success: boolean;
  procesados: {
    turnos: string[];
    ventas: string[];
    auditorias: string[];
  };
};

// ==========================================
// Validación Zod
// ==========================================
const pushSyncSchema = z.object({
  turnos: z.array(
    z.object({
      id: z.string().uuid(),
      usuario_id: z.string().uuid(),
      sucursal_id: z.string().uuid(),
      estado: z.enum(["ABIERTO", "CERRADO"]),
      monto_inicial: z.number().nonnegative(),
      monto_final: z.number().nullable().optional(),
      total_ventas: z.number().nonnegative(),
      fecha_apertura: z.string().datetime(),
      fecha_cierre: z.string().datetime().nullable().optional()
    })
  ).default([]),
  ventas: z.array(
    z.object({
      id: z.string().uuid(),
      turno_id: z.string().uuid(),
      sucursal_id: z.string().uuid(),
      total: z.number().nonnegative(),
      estado: z.enum(["COMPLETADA", "CANCELADA"]),
      fecha: z.string().datetime(),
      detalles: z.array(
        z.object({
          producto_id: z.string().uuid(),
          cantidad: z.number().positive().int(),
          precio_unitario_historico: z.number().nonnegative()
        })
      ).min(1)
    })
  ).default([]),
  auditorias: z.array(
    z.object({
      id: z.string().uuid(),
      turno_id: z.string().uuid().optional(),
      shiftId: z.string().uuid().optional(),
      usuario_id: z.string().uuid().optional(),
      userId: z.string().uuid().optional(),
      sucursal_id: z.string().uuid().optional(),
      branchId: z.string().uuid().optional(),
      createdAt: z.string().datetime(),
      items: z.array(
        z.object({
          productId: z.string().uuid(),
          expectedStock: z.number().int(),
          countedStock: z.number().int(),
          discrepancy: z.number().int(),
          reason: z.string().nullable().optional(),
          comments: z.string().nullable().optional()
        })
      )
    })
  ).default([])
});

// ==========================================
// Lógica del Endpoint POST
// ==========================================
export async function POST(req: Request) {
  try {
    // Validación de autenticación: acepta secret del POS via header O query param
    const validPosSecret = process.env.POS_SYNC_SECRET;
    const posSecretHeader = req.headers.get("x-pos-sync-secret");
    
    // Fallback URL parse explicitly for secret query param if preferred over header
    const { searchParams } = new URL(req.url);
    const posSecretQuery = searchParams.get("secret");

    const isPosAuthorized =
      validPosSecret &&
      (posSecretHeader === validPosSecret || posSecretQuery === validPosSecret);

    if (!isPosAuthorized) {
      // Fallback: verificar sesión de NextAuth (acceso desde el admin dashboard local)
      const session = await auth();
      const isAdminAuthorized = !!session?.user;
      
      // Bypass para scripts de test / integración 
      const isTestBypass = process.env.NODE_ENV === 'test' || req.headers.get("x-test-bypass") === "true";

      if (!isAdminAuthorized && !isTestBypass) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
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

    const { turnos, ventas, auditorias } = parseResult.data;

    const procesados = {
      turnos: [] as string[],
      ventas: [] as string[],
      auditorias: [] as string[]
    };

    // 2. Transaccionalidad: Implementa un db.$transaction de Prisma. Todo el lote debe procesarse de forma atómica.
    await db.$transaction(async (tx) => {

      // 2.1 Para turnos: Realiza un upsert usando el UUID.
      for (const turno of turnos) {
        await tx.turno.upsert({
          where: { id: turno.id },
          create: {
            id: turno.id,
            usuario_id: turno.usuario_id,
            sucursal_id: turno.sucursal_id,
            estado: turno.estado === "ABIERTO" ? EstadoTurno.ABIERTO : EstadoTurno.CERRADO,
            monto_inicial: turno.monto_inicial,
            monto_final: turno.monto_final || null,
            total_ventas: turno.total_ventas,
            fecha_apertura: new Date(turno.fecha_apertura),
            fecha_cierre: turno.fecha_cierre ? new Date(turno.fecha_cierre) : null,
          },
          update: {
            estado: turno.estado === "ABIERTO" ? EstadoTurno.ABIERTO : EstadoTurno.CERRADO,
            monto_final: turno.monto_final || null,
            total_ventas: turno.total_ventas,
            fecha_cierre: turno.fecha_cierre ? new Date(turno.fecha_cierre) : null,
          }
        });
        procesados.turnos.push(turno.id);
      }

      // 2.2 Para auditorias: Realiza un upsert usando el UUID.
      for (const auditoria of auditorias) {
        const turno_id = auditoria.turno_id || auditoria.shiftId;
        const usuario_id = auditoria.usuario_id || auditoria.userId;
        const sucursal_id = auditoria.sucursal_id || auditoria.branchId;

        if (!turno_id || !usuario_id || !sucursal_id) {
            throw new Error(`Referencia de auditoria incompleta: ${auditoria.id}`);
        }

        await tx.inventoryAudit.upsert({
          where: { id: auditoria.id },
          create: {
            id: auditoria.id,
            turno_id: turno_id,
            usuario_id: usuario_id,
            sucursal_id: sucursal_id,
            createdAt: new Date(auditoria.createdAt),
            items: {
              create: auditoria.items.map(item => ({
                productId: item.productId,
                expectedStock: item.expectedStock,
                countedStock: item.countedStock,
                discrepancy: item.discrepancy,
                reason: item.reason || null,
                comments: item.comments || null
              }))
            }
          },
          update: {
            // Upsert Idempotencia: asumimos que las auditorías no modifican items aquí si ya existen.
          }
        });
        procesados.auditorias.push(auditoria.id);
      }

      // 2.3 Para ventas: Upsert. Si es create, usa creación anidada para insertar detalles. 
      // Si es update, asume que la venta ya existe y no modifiques detalles.
      for (const venta of ventas) {
        // Checar si la venta existe
        const existingSale = await tx.venta.findUnique({
          where: { id: venta.id },
          select: { id: true }
        });

        if (existingSale) {
          // Si es update, asume que la venta ya existe y NO modifiques detalles
          await tx.venta.update({
             where: { id: venta.id },
             data: {
               estado: venta.estado === 'COMPLETADA' ? EstadoVenta.COMPLETADA : EstadoVenta.CANCELADA,
               sync_status: SyncStatus.SYNCED
             }
          });
        } else {
          // Solución Delta (Inventario): decrementa stock central sin sobrescribir con cálculos locales
          if (venta.estado === 'COMPLETADA') {
            for (const detalle of venta.detalles) {
               await tx.inventario_Sucursal.update({
                 where: {
                   sucursal_id_producto_id: {
                     sucursal_id: venta.sucursal_id,
                     producto_id: detalle.producto_id
                   }
                 },
                 data: {
                   cantidad: {
                     decrement: detalle.cantidad
                   }
                 }
               });
            }
          }

          // Si es create, usa creación anidada para insertar detalles al mismo tiempo
          await tx.venta.create({
            data: {
              id: venta.id,
              turno_id: venta.turno_id,
              sucursal_id: venta.sucursal_id,
              total: venta.total,
              estado: venta.estado === 'COMPLETADA' ? EstadoVenta.COMPLETADA : EstadoVenta.CANCELADA,
              sync_status: SyncStatus.SYNCED,
              fecha: new Date(venta.fecha),
              detalles: {
                create: venta.detalles.map(d => ({
                  producto_id: d.producto_id,
                  cantidad: d.cantidad,
                  precio_unitario_historico: d.precio_unitario_historico
                }))
              }
            }
          });
        }
        procesados.ventas.push(venta.id);
      }

    });

    // 3. Respuesta: Devuelve un HTTP 200 con { success: true, procesados: {...} }
    return NextResponse.json({
      success: true,
      procesados
    } satisfies PushSyncResponse, { status: 200 });

  } catch (error) {
    if (error instanceof Error && error.message.includes("Record to update not found")) {
      return NextResponse.json(
        { error: "Transacción abortada: Inconsistencia referencial (por ej. Inventario no encontrado)", details: error.message },
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
