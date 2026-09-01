import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "packages/db/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "apps/admin/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../apps/admin/.env") });

import { PrismaClient } from "@prisma/client";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn("⚠️  ADVERTENCIA: No se encontró DATABASE_URL en ningún archivo .env");
} else {
  // En Windows Node.js a veces resuelve localhost como IPv6 (::1) fallando la conexión con Docker
  if (dbUrl.includes("@localhost:")) {
    dbUrl = dbUrl.replace("@localhost:", "@127.0.0.1:");
  }
  // Ocultar contraseña para log seguro
  const maskedUrl = dbUrl.replace(/:([^:@]+)@/, ":****@");
  console.log(`🔌 Conectando a BD: ${maskedUrl}`);
}

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: dbUrl,
    },
  },
});

const args = process.argv.slice(2);
const isList = args.includes("--list");
const isDryRun = args.includes("--dry-run");
const keepIndex = args.indexOf("--keep");
const keepName = keepIndex !== -1 ? args[keepIndex + 1] : undefined;

// ─── Modo --list ─────────────────────────────────────────────────────────────
async function listEmpresas() {
  console.log("\n" + "=".repeat(70));
  console.log("  Empresas registradas en la base de datos");
  console.log("=".repeat(70));

  const empresas = await prisma.empresa.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: {
        select: {
          usuarios: true,
          sucursales: true,
          productos: true,
        },
      },
    },
  });

  if (empresas.length === 0) {
    console.log("\n  No hay empresas registradas.\n");
    return;
  }

  for (const e of empresas) {
    // Contar ventas via sucursales de esta empresa
    const ventasCount = await prisma.venta.count({
      where: { sucursal: { empresa_id: e.id } },
    });

    console.log(`\n  📦 "${e.nombre}"`);
    console.log(`     ID:         ${e.id}`);
    console.log(`     Creada:     ${e.createdAt.toLocaleDateString("es-MX")}`);
    console.log(`     Usuarios:   ${e._count.usuarios}`);
    console.log(`     Sucursales: ${e._count.sucursales}`);
    console.log(`     Productos:  ${e._count.productos}`);
    console.log(`     Ventas:     ${ventasCount}`);

    // Listar usuarios para ayudar a identificar la empresa correcta
    if (e._count.usuarios > 0) {
      const usuarios = await prisma.user.findMany({
        where: { empresa_id: e.id },
        select: { name: true, email: true, role: true },
        orderBy: { role: "asc" },
      });
      console.log(`     Usuarios registrados:`);
      for (const u of usuarios) {
        console.log(`       · ${u.role.padEnd(10)} ${u.name ?? "(sin nombre)"}  <${u.email}>`);
      }
    }
  }

  console.log("\n" + "=".repeat(70));
  console.log("  Una vez identificada tu empresa, ejecuta:");
  console.log(`  pnpm --filter @shopli/db run db:cleanup-companies -- --keep "Nombre Exacto" --dry-run`);
  console.log("=".repeat(70) + "\n");
}

// ─── Modo --keep ─────────────────────────────────────────────────────────────
async function cleanupEmpresas(keepName: string) {
  // Buscar la empresa a conservar
  const empresaToKeep = await prisma.empresa.findFirst({
    where: { nombre: keepName },
    include: { _count: { select: { usuarios: true, productos: true } } },
  });

  if (!empresaToKeep) {
    console.error(`\n❌ No se encontró ninguna empresa con el nombre exacto: "${keepName}"`);
    console.error(`   Usa --list para ver los nombres exactos disponibles.\n`);
    process.exit(1);
  }

  // Empresas a eliminar
  const empresasToDelete = await prisma.empresa.findMany({
    where: { id: { not: empresaToKeep.id } },
    include: {
      _count: { select: { usuarios: true, sucursales: true, productos: true } },
    },
  });

  console.log("\n" + "=".repeat(70));
  if (isDryRun) console.log("  ⚠️  MODO DRY-RUN — No se escribirá nada en la base de datos");
  console.log("=".repeat(70));
  console.log(`\n  ✅ CONSERVAR: "${empresaToKeep.nombre}" (${empresaToKeep.id})`);
  console.log(`     ${empresaToKeep._count.usuarios} usuarios · ${empresaToKeep._count.productos} productos\n`);

  if (empresasToDelete.length === 0) {
    console.log("  ✅ No hay otras empresas que eliminar. Base de datos limpia.\n");
    return;
  }

  console.log(`  🗑️  ELIMINAR (${empresasToDelete.length} empresa${empresasToDelete.length > 1 ? "s" : ""}):`);

  // Calcular y mostrar el total de registros que se eliminarán
  let totalVentas = 0;
  let totalProductos = 0;
  let totalUsuarios = 0;

  for (const e of empresasToDelete) {
    const ventas = await prisma.venta.count({ where: { sucursal: { empresa_id: e.id } } });
    totalVentas += ventas;
    totalProductos += e._count.productos;
    totalUsuarios += e._count.usuarios;

    console.log(`\n     · "${e.nombre}" (${e.id})`);
    console.log(`       ${e._count.usuarios} usuarios · ${e._count.sucursales} sucursales · ${e._count.productos} productos · ${ventas} ventas`);
  }

  console.log(`\n  📊 Total a eliminar: ${totalUsuarios} usuarios, ${totalProductos} productos, ${totalVentas} ventas`);

  if (isDryRun) {
    console.log("\n  ✅ Dry-run completado. Ningún dato fue modificado.");
    console.log("     Para ejecutar la limpieza real, corre el mismo comando sin --dry-run.\n");
    return;
  }

  // ── Confirmación de seguridad en modo real ────────────────────────────────
  console.log("\n  ⚠️  ESTA OPERACIÓN ES IRREVERSIBLE.");
  console.log("     Tienes 5 segundos para cancelar con Ctrl+C...");
  await new Promise((r) => setTimeout(r, 5000));

  console.log("\n  ⏳ Ejecutando limpieza dentro de una transacción atómica...\n");

  const idsToDelete = empresasToDelete.map((e) => e.id);

  // Obtener IDs intermedios necesarios para borrar en orden correcto
  const sucursalIds = (
    await prisma.sucursal.findMany({
      where: { empresa_id: { in: idsToDelete } },
      select: { id: true },
    })
  ).map((s) => s.id);

  const turnoIds = (
    await prisma.turno.findMany({
      where: { sucursal_id: { in: sucursalIds } },
      select: { id: true },
    })
  ).map((t) => t.id);

  const productoIds = (
    await prisma.producto.findMany({
      where: { empresa_id: { in: idsToDelete } },
      select: { id: true },
    })
  ).map((p) => p.id);

  await prisma.$transaction(async (tx) => {
    // Buscar dinámicamente si existe algún trigger de usuario en Detalle_Venta
    const triggers: Array<{ tgname: string }> = await tx.$queryRaw`
      SELECT tgname 
      FROM pg_trigger 
      WHERE tgrelid = '"Detalle_Venta"'::regclass 
        AND NOT tgisinternal;
    `;

    // Desactivar triggers de usuario existentes
    for (const t of triggers) {
      await tx.$executeRawUnsafe(`ALTER TABLE "Detalle_Venta" DISABLE TRIGGER "${t.tgname}"`);
    }

    // 1. DynamicAuditItem y AuditItem (dependen de Producto y Audit → Cascade, pero
    //    Producto tiene Restrict en algunos, borramos explícitamente por seguridad)
    await tx.dynamicAuditItem.deleteMany({ where: { productId: { in: productoIds } } });
    await tx.auditItem.deleteMany({ where: { productId: { in: productoIds } } });

    // 2. DynamicAudit y InventoryAudit (dependen de Sucursal/Turno)
    await tx.dynamicAudit.deleteMany({ where: { sucursalId: { in: sucursalIds } } });
    await tx.inventoryAudit.deleteMany({ where: { turno_id: { in: turnoIds } } });

    // 3. MovimientoInventario
    await tx.movimientoInventario.deleteMany({ where: { sucursal_id: { in: sucursalIds } } });

    // 4. Detalle_Venta (Cascade desde Venta, pero borramos explícito para evitar
    //    el Restrict que tiene hacia Producto)
    const ventaIds = (
      await tx.venta.findMany({
        where: { sucursal_id: { in: sucursalIds } },
        select: { id: true },
      })
    ).map((v) => v.id);

    await tx.detalle_Venta.deleteMany({ where: { venta_id: { in: ventaIds } } });

    // Re-habilitar los triggers que existían
    for (const t of triggers) {
      await tx.$executeRawUnsafe(`ALTER TABLE "Detalle_Venta" ENABLE TRIGGER "${t.tgname}"`);
    }

    // 5. Ventas
    await tx.venta.deleteMany({ where: { id: { in: ventaIds } } });

    // 6. Gastos
    await tx.gasto.deleteMany({ where: { sucursal_id: { in: sucursalIds } } });

    // 7. Turnos (Restrict en Sucursal → borrar antes que Sucursal)
    await tx.turno.deleteMany({ where: { id: { in: turnoIds } } });

    // 8. Inventario_Sucursal (Restrict en Sucursal → borrar antes que Sucursal)
    await tx.inventario_Sucursal.deleteMany({ where: { sucursal_id: { in: sucursalIds } } });

    // 9. Productos (variantes primero por Cascade, luego padres)
    await tx.producto.deleteMany({
      where: { empresa_id: { in: idsToDelete }, parent_id: { not: null } },
    });
    await tx.producto.deleteMany({
      where: { empresa_id: { in: idsToDelete }, parent_id: null },
    });

    // 10. Sucursales
    await tx.sucursal.deleteMany({ where: { empresa_id: { in: idsToDelete } } });

    // 11. Usuarios
    await tx.user.deleteMany({ where: { empresa_id: { in: idsToDelete } } });

    // 12. Proveedores
    await tx.proveedor.deleteMany({ where: { empresa_id: { in: idsToDelete } } });

    // 13. Empresas
    await tx.empresa.deleteMany({ where: { id: { in: idsToDelete } } });
  });

  console.log(`  ✅ Limpieza completada. ${empresasToDelete.length} empresa(s) eliminada(s).`);
  console.log(`     La empresa "${empresaToKeep.nombre}" no fue modificada.\n`);
  console.log("  👉 Siguiente paso: asignar SKUs con migrate-skus.\n");
}

// ─── Entry point ─────────────────────────────────────────────────────────────
async function main() {
  if (isList) {
    await listEmpresas();
    return;
  }

  if (!keepName) {
    console.error("\n❌ Debes especificar --list o --keep \"Nombre de Empresa\".");
    console.error("   Ejemplo: pnpm --filter @shopli/db run db:cleanup-companies -- --list\n");
    process.exit(1);
  }

  await cleanupEmpresas(keepName);
}

main()
  .catch((e) => {
    console.error("\n❌ Error crítico (ningún cambio fue aplicado):", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
