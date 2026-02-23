import { PrismaClient } from '@prisma/client';
import process from 'process';

const prisma = new PrismaClient();

async function runTests() {
    console.log('--- Starting DB Constraint Tests ---');

    // 1. User pin_hash check
    try {
        console.log('\nTesting: User Cajero sin PIN (Debe fallar)');
        await prisma.user.create({
            data: {
                email: 'cajero_sin_pin@test.com',
                name: 'Cajero Invalido',
                role: 'CAJERO',
                pin_hash: null, // Should fail constraint
            },
        });
        console.error('❌ FALLO: Creó el usuario Cajero sin PIN');
    } catch (e: any) {
        if (e.message.includes('pin_hash_required')) {
            console.log('✅ EXITO: Restricción pin_hash funcionó correctamente.');
        } else {
            console.error('❌ Error inesperado:', e.message);
        }
    }

    // 2. Producto precios checks
    try {
        console.log('\nTesting: Producto precio < costo (Debe fallar)');
        await prisma.producto.create({
            data: {
                nombre: 'Producto Invalido',
                costo: 100.0,
                precio_publico: 50.0, // Should fail constraint
            },
        });
        console.error('❌ FALLO: Creó producto con precio menor a costo');
    } catch (e: any) {
        if (e.message.includes('producto_precios_check')) {
            console.log('✅ EXITO: Restricción de precios funcionó correctamente.');
        } else {
            console.error('❌ Error inesperado:', e.message);
        }
    }

    // 3. Inventario no negativo
    console.log('\nTesting: Inventario cantidad negativa (Debe fallar)');
    try {
        const sucursal = await prisma.sucursal.create({ data: { nombre: 'Sucursal Test' } });
        const producto = await prisma.producto.create({
            data: { nombre: 'Prod 1', costo: 10, precio_publico: 15 },
        });

        await prisma.inventario_Sucursal.create({
            data: {
                sucursal_id: sucursal.id,
                producto_id: producto.id,
                cantidad: -5, // Should fail constraint
            },
        });
        console.error('❌ FALLO: Permitió crear inventario negativo');
    } catch (e: any) {
        if (e.message.includes('inventario_cantidad_check')) {
            console.log('✅ EXITO: Restricción de cantidad negativa funcionó.');
        } else {
            console.error('❌ Error inesperado:', e.message);
        }
    }

    // 4. Multiples turnos abiertos
    console.log('\nTesting: 2 turnos abiertos para 1 usuario (Debe fallar el segundo)');
    try {
        const sucursal = await prisma.sucursal.create({ data: { nombre: 'Turnos Test' } });
        const user = await prisma.user.create({
            data: { email: 'user@turnos.com', role: 'DUENO' },
        });

        await prisma.turno.create({
            data: {
                usuario_id: user.id,
                sucursal_id: sucursal.id,
                estado: 'ABIERTO',
                monto_inicial: 100,
            },
        });

        // Second one should fail
        await prisma.turno.create({
            data: {
                usuario_id: user.id,
                sucursal_id: sucursal.id,
                estado: 'ABIERTO',
                monto_inicial: 50,
            },
        });

        console.error('❌ FALLO: Permitió crear el segundo turno abierto');
    } catch (e: any) {
        if (e.message.includes('Unique constraint failed') || e.message.includes('Turno_usuario_id_abierto_key')) {
            console.log('✅ EXITO: Restricción de 1 turno abierto funcionó.');
        } else {
            console.error('❌ Error inesperado:', e.message);
        }
    }

    // 5. Update Detalle_Venta
    console.log('\nTesting: Update detalle_venta (Debe fallar)');
    try {
        const sucursal = await prisma.sucursal.create({ data: { nombre: 'Sucursal Venta' } });
        const user = await prisma.user.create({ data: { email: 'vendedor@test.com', role: 'DUENO' } });
        const turno = await prisma.turno.create({
            data: {
                usuario_id: user.id,
                sucursal_id: sucursal.id,
                estado: 'CERRADO',
                monto_inicial: 0,
                total_ventas: 0,
                fecha_cierre: new Date(Date.now() + 1000) // Explicitly later than now
            },
        });
        const venta = await prisma.venta.create({
            data: { turno_id: turno.id, sucursal_id: sucursal.id, total: 100, estado: 'COMPLETADA' },
        });
        const producto = await prisma.producto.create({
            data: { nombre: 'Prod Venta', costo: 10, precio_publico: 20 },
        });
        const detalle = await prisma.detalle_Venta.create({
            data: { venta_id: venta.id, producto_id: producto.id, cantidad: 5, precio_unitario_historico: 20 },
        });

        await prisma.detalle_Venta.update({
            where: { id: detalle.id },
            data: { cantidad: 10 },
        });

        console.error('❌ FALLO: Permitió actualizar el Detalle_Venta');
    } catch (e: any) {
        if (e.message.includes('UPDATE y DELETE están prohibidas')) {
            console.log('✅ EXITO: Trigger de inmutabilidad funcionó en Update.');
        } else {
            console.error('❌ Error inesperado:', e.message);
        }
    }

    // Cleanup to keep DB fresh
    console.log('\n--- Cleaning up test records ---');
    // Can't use deleteMany on Detalle_Venta because of our trigger, so we use TRUNCATE CASCADE
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Sucursal" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "User" CASCADE;');
    await prisma.$executeRawUnsafe('TRUNCATE TABLE "Proveedor" CASCADE;');
    await prisma.venta.deleteMany({});
    await prisma.turno.deleteMany({});
    await prisma.inventario_Sucursal.deleteMany({});
    await prisma.producto.deleteMany({});
    console.log('--- Tests finished ---');

    process.exit(0);
}

runTests().catch((e) => {
    console.error('Global Error:', e);
    process.exit(1);
});
