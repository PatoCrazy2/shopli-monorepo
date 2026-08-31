import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// ==========================================
// Script: Migración de SKUs para productos existentes
//
// Uso:
//   pnpm --filter @shopli/db run db:migrate-skus -- <empresaId>
//   pnpm --filter @shopli/db run db:migrate-skus -- <empresaId> --dry-run
//
// Requisitos:
//   - empresaId es obligatorio para garantizar aislamiento multi-tenant.
//   - Ejecutar únicamente con el sistema fuera de uso (sin sesiones activas de cajeros).
//   - Verificar con --dry-run antes de ejecutar en producción.
//
// Comportamiento:
//   - Solo asigna SKUs a productos que tienen codigo_interno NULL o vacío.
//   - Nunca modifica productos que ya tienen un SKU asignado.
//   - Es idempotente: ejecutar dos veces produce el mismo resultado.
//   - Toda la operación es atómica: o se actualizan todos o ninguno (transacción).
// ==========================================

const prisma = new PrismaClient();

const args = process.argv.slice(2);
const empresaId = args.find((a) => !a.startsWith("--"));
const isDryRun = args.includes("--dry-run");

async function main() {
  // ── Validación de argumentos ──────────────────────────────────────────────
  if (!empresaId) {
    console.error("❌ Error: empresaId es requerido.");
    console.error("   Uso: pnpm --filter @shopli/db run db:migrate-skus -- <empresaId> [--dry-run]");
    process.exit(1);
  }

  // ── Verificar que la empresa existe ──────────────────────────────────────
  const empresa = await prisma.empresa.findUnique({
    where: { id: empresaId },
    select: { id: true, nombre: true },
  });

  if (!empresa) {
    console.error(`❌ Error: No existe ninguna empresa con ID "${empresaId}".`);
    process.exit(1);
  }

  console.log("=".repeat(60));
  console.log(`  Migración de SKUs — Empresa: "${empresa.nombre}"`);
  if (isDryRun) console.log("  ⚠️  MODO DRY-RUN: No se escribirá nada en la base de datos.");
  console.log("=".repeat(60));

  // ── Paso 1: Encontrar el máximo SKU secuencial existente (todos los tenants) ──
  // Se busca en toda la tabla porque codigo_interno es @unique global.
  // El contador arranca desde el máximo global para evitar colisiones cross-tenant.
  const allSkuProducts = await prisma.producto.findMany({
    where: { codigo_interno: { startsWith: "SL-" } },
    select: { codigo_interno: true },
  });

  let currentNumber = 0;
  for (const p of allSkuProducts) {
    const match = p.codigo_interno?.match(/^SL-(\d+)$/);
    if (match) {
      const num = parseInt(match[1]!, 10);
      if (num > currentNumber) currentNumber = num;
    }
  }

  console.log(
    currentNumber > 0
      ? `\n📌 Máximo SKU existente en toda la BD: SL-${String(currentNumber).padStart(6, "0")}`
      : "\n📌 No se encontraron SKUs previos con prefijo 'SL-'. Iniciando desde SL-000001."
  );

  // ── Paso 2: Obtener productos sin SKU de esta empresa ────────────────────
  const productsToUpdate = await prisma.producto.findMany({
    where: {
      empresa_id: empresaId,
      OR: [{ codigo_interno: null }, { codigo_interno: "" }],
    },
    select: { id: true, nombre: true },
    orderBy: { nombre: "asc" }, // Orden determinista para reproducibilidad
  });

  if (productsToUpdate.length === 0) {
    console.log("\n✅ Todos los productos de esta empresa ya tienen SKU asignado. Nada que hacer.");
    return;
  }

  console.log(`\n🔍 Productos sin SKU encontrados: ${productsToUpdate.length}`);

  // ── Paso 3: Preparar los updates (asignación de SKUs) ───────────────────
  const updates: { id: string; nombre: string; sku: string }[] = [];

  for (const p of productsToUpdate) {
    currentNumber++;
    const sku = `SL-${String(currentNumber).padStart(6, "0")}`;
    updates.push({ id: p.id, nombre: p.nombre, sku });
  }

  // ── Vista previa (siempre visible, incluso sin dry-run) ─────────────────
  console.log("\n📋 SKUs a asignar:");
  for (const u of updates) {
    console.log(`   ${u.sku}  →  "${u.nombre}" (${u.id})`);
  }

  if (isDryRun) {
    console.log("\n✅ Dry-run completado. Ningún dato fue modificado.");
    console.log("   Para ejecutar la migración real, corre el mismo comando sin --dry-run.");
    return;
  }

  // ── Paso 4: Ejecutar todos los updates en una sola transacción atómica ──
  console.log("\n⏳ Ejecutando migración...");

  await prisma.$transaction(
    updates.map((u) =>
      prisma.producto.update({
        where: { id: u.id },
        data: { codigo_interno: u.sku },
      })
    )
  );

  console.log(`\n✅ Migración completada. ${updates.length} productos actualizados.`);
  console.log("=".repeat(60));
}

main()
  .catch((e) => {
    console.error("\n❌ Error crítico durante la migración (ningún cambio fue aplicado):", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
