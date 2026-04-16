import { db, Role, EstadoTurno, EstadoVenta, AuditStatus } from "./src";
import crypto from "crypto";

async function testDynamicReconciliation() {
  console.log("🚀 Iniciando Test de Reconciliación Dinámica...");

  try {
    // 1. SETUP: Sucursal, Usuario y Producto
    const sucursal = await db.sucursal.create({
      data: { nombre: "Sucursal Test Recombinación", direccion: "Lab 1" }
    });

    const usuario = await db.user.create({
      data: {
        email: `auditor-${Date.now()}@test.com`,
        name: "Auditor Test",
        role: Role.ENCARGADO,
        pin_hash: "1234"
      }
    });

    const producto = await db.producto.create({
      data: {
        nombre: "Shampoo XYZ",
        costo: 50,
        precio_publico: 80,
        codigo_interno: `SKU-DYN-${Date.now()}`
      }
    });

    // Stock Inicial: 100 unidades
    await db.inventario_Sucursal.create({
      data: { sucursal_id: sucursal.id, producto_id: producto.id, cantidad: 100 }
    });

    console.log("✅ Stock inicial definido en: 100");

    // 2. INICIO DE AUDITORÍA (Snapshot)
    // Se inicia a las 10:00 AM
    const startTime = new Date();
    startTime.setHours(10, 0, 0, 0);

    const audit = await db.dynamicAudit.create({
      data: {
        sucursalId: sucursal.id,
        status: AuditStatus.OPEN,
        startedAt: startTime,
        items: {
          create: [{
            productId: producto.id,
            initialStock: 100 // El snapshot capturado
          }]
        }
      },
      include: { items: true }
    });

    console.log(`✅ Auditoría iniciada a las: ${startTime.toISOString()}`);

    // 3. VENTAS CONCURRENTES
    // Una venta ocurre a las 10:05 AM (2 unidades)
    const saleTime = new Date(startTime);
    saleTime.setMinutes(5);

    // Crear un Turno válido para la venta
    const turnoId = crypto.randomUUID();
    await db.turno.create({
      data: {
        id: turnoId,
        usuario_id: usuario.id,
        sucursal_id: sucursal.id,
        estado: EstadoTurno.ABIERTO,
        monto_inicial: 1000,
        fecha_apertura: startTime
      }
    });

    await db.venta.create({
      data: {
        id: crypto.randomUUID(),
        turno_id: turnoId, 
        sucursal_id: sucursal.id,
        total: 160,
        fecha: saleTime,
        estado: EstadoVenta.COMPLETADA,
        detalles: {
          create: [{
             producto_id: producto.id,
             cantidad: 2,
             precio_unitario_historico: 80
          }]
        }
      }
    });
    
    // Descontamos del inventario central (simulando lo que hace el endpoint de ventas)
    await db.inventario_Sucursal.update({
        where: { sucursal_id_producto_id: { sucursal_id: sucursal.id, producto_id: producto.id } },
        data: { cantidad: { decrement: 2 } }
    });

    console.log("🛒 Venta de 2 unidades registrada a las 10:05 AM. Stock central actual: 98");

    // 4. SIMULACIÓN DE PAYLOAD DESDE POS
    // El cajero cuenta el producto a las 10:10 AM y encuentra 95 unidades (Falta mercancía)
    const countTime = new Date(startTime);
    countTime.setMinutes(10);
    
    const payload = {
       auditoriasDinamicas: [{
          id: crypto.randomUUID(),
          sucursal_id: sucursal.id,
          startedAt: startTime.toISOString(),
          items: [{
             productId: producto.id,
             countedQuantity: 95,
             countedAt: countTime.toISOString()
          }]
       }]
    };

    console.log("📡 Payload recibido con conteo de 95 unidades at 10:10 AM...");

    // 5. EJECUCIÓN DEL MOTOR DE RECONCILIACIÓN (Misma lógica del API)
    await db.$transaction(async (tx) => {
        for (const da of payload.auditoriasDinamicas) {
            const dbAudit = await tx.dynamicAudit.findFirst({
                where: { sucursalId: da.sucursal_id, status: 'OPEN' },
                include: { items: true }
            });

            if (dbAudit) {
                for (const item of da.items) {
                    const dbItem = dbAudit.items.find(i => i.productId === item.productId);
                    if (!dbItem || item.countedQuantity === null || !item.countedAt) continue;

                    const countedAt = new Date(item.countedAt);

                    // Paso A: Sumar ventas entre 10:00 y 10:10
                    const sales = await tx.detalle_Venta.aggregate({
                        _sum: { cantidad: true },
                        where: {
                            producto_id: item.productId,
                            venta: {
                                sucursal_id: da.sucursal_id,
                                fecha: { gte: dbAudit.startedAt, lte: countedAt },
                                estado: 'COMPLETADA'
                            }
                        }
                    });

                    const soldQty = sales._sum.cantidad || 0;
                    const expected = dbItem.initialStock - soldQty; // 100 - 2 = 98
                    const difference = item.countedQuantity - expected; // 95 - 98 = -3

                    console.log(`📊 Cálculos: Esperado=${expected}, Vendido=${soldQty}, Contado=${item.countedQuantity}, Diferencia=${difference}`);

                    // Paso C: Actualizar Item y Stock Central
                    await tx.dynamicAuditItem.update({
                        where: { id: dbItem.id },
                        data: {
                            countedQuantity: item.countedQuantity,
                            countedAt: countedAt,
                            expectedAtCount: expected,
                            difference: difference
                        }
                    });

                    if (difference !== 0) {
                        await tx.inventario_Sucursal.update({
                            where: { sucursal_id_producto_id: { sucursal_id: sucursal.id, producto_id: producto.id } },
                            data: { cantidad: { increment: difference } } // 98 + (-3) = 95
                        });
                    }
                }
            }
        }
    });

    // 6. VERIFICACIÓN FINAL
    const finalInventory = await db.inventario_Sucursal.findUnique({
        where: { sucursal_id_producto_id: { sucursal_id: sucursal.id, producto_id: producto.id } }
    });

    console.log(`\n🏁 RESULTADO FINAL:`);
    console.log(`Stock en Base de Datos: ${finalInventory?.cantidad}`);
    
    if (finalInventory?.cantidad === 95) {
        console.log("🌟 ¡ÉXITO! La reconciliación es exacta.");
    } else {
        console.error(`❌ ERROR: El stock final no coincide. Esperado 95, obtenido ${finalInventory?.cantidad}`);
    }

  } catch (error) {
    console.error("❌ Fallo en el test:", error);
  } finally {
    await db.$disconnect();
  }
}

testDynamicReconciliation();
