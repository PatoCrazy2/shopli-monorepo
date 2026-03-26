import { db, SyncStatus, EstadoTurno, EstadoVenta, Role } from "./src";
import crypto from "crypto";

async function testPush() {
  console.log("--- Iniciando Prueba de Push Sincronización ---");

  try {
    // 1. Crear Sucursal y Usuario para referencias requeridas
    const sucursal = await db.sucursal.create({
      data: { nombre: "Sucursal Test Push", direccion: "Calle Falsa 123" }
    });

    const usuario = await db.user.create({
      data: {
        email: `test-${Date.now()}@test.com`,
        name: "Cajero Test",
        role: Role.CAJERO,
        pin_hash: "1234"
      }
    });

    const producto = await db.producto.create({
      data: {
        nombre: "Aceite 1L",
        costo: 30,
        precio_publico: 45,
        codigo_interno: `SKU-${Date.now()}`
      }
    });

    // Stock inicial en 100
    await db.inventario_Sucursal.create({
      data: {
        sucursal_id: sucursal.id,
        producto_id: producto.id,
        cantidad: 100
      }
    });

    console.log(`Setup completo: Sucursal=${sucursal.id}, Usuario=${usuario.id}, Producto=${producto.id}`);

    // 2. Definir IDs "Locales" (UUIDs)
    const turnoId = crypto.randomUUID();
    const ventaId = crypto.randomUUID();
    const labAuditId = crypto.randomUUID();

    // 3. Simular payload del POS
    const payload = {
      turnos: [{
        id: turnoId,
        usuario_id: usuario.id,
        sucursal_id: sucursal.id,
        estado: "ABIERTO",
        monto_inicial: 1000,
        total_ventas: 45, // La venta que mandaremos abajo
        fecha_apertura: new Date().toISOString()
      }],
      ventas: [{
        id: ventaId,
        turno_id: turnoId,
        sucursal_id: sucursal.id,
        total: 45,
        estado: "COMPLETADA",
        fecha: new Date().toISOString(),
        detalles: [{
          producto_id: producto.id,
          cantidad: 2,
          precio_unitario_historico: 22.5
        }]
      }],
      auditorias: [{
         id: labAuditId,
         turno_id: turnoId,
         usuario_id: usuario.id,
         sucursal_id: sucursal.id,
         createdAt: new Date().toISOString(),
         items: [{
            productId: producto.id,
            expectedStock: 98, // 100 - 2
            countedStock: 97,
            discrepancy: -1,
            reason: "Faltante",
            comments: "Error de conteo inicial"
         }]
      }]
    };

    console.log("Enviando POST a http://localhost:3000/api/pos/sync/push...");

    const response = await fetch("http://localhost:3000/api/pos/sync/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-test-bypass": "true"
      },
      body: JSON.stringify(payload)
    });

    const result: any = await response.json();
    console.log("RESPUESTA SERVIDOR:", JSON.stringify(result, null, 2));

    if (result.success) {
      console.log("--- Verificando Datos en DB Core ---");
      const savedVenta = await db.venta.findUnique({ where: { id: ventaId }, include: { detalles: true } });
      const inventory = await db.inventario_Sucursal.findUnique({
         where: { sucursal_id_producto_id: { sucursal_id: sucursal.id, producto_id: producto.id } }
      });

      console.log("Venta Guardada con Detalles:", savedVenta?.detalles.length === 1 ? "OK" : "ERROR");
      console.log("Stock Final (Delta):", inventory?.cantidad); // Debería ser 98 (100 inicial - 2 vendidos)
      
      if (inventory?.cantidad === 98) {
          console.log("¡ÉXITO! El stock se descontó correctamente mediante Delta en el servidor.");
      } else {
          console.error("ERROR: El stock no coincide con el descuento Delta esperado.");
      }
    } else {
      console.error("ERROR: El push falló en el servidor.");
    }

  } catch (err: any) {
    console.error("ERROR FATAL:", err.message);
  } finally {
    await db.$disconnect();
  }
}

testPush();
