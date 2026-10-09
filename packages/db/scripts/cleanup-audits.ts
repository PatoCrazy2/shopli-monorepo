import dotenv from "dotenv";
import path from "path";

// Cargar variables de entorno en orden de prioridad
dotenv.config();
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "packages/db/.env") });
dotenv.config({ path: path.resolve(process.cwd(), "apps/admin/.env") });
dotenv.config({ path: path.resolve(__dirname, "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../apps/admin/.env") });

import { PrismaClient, AuditStatus } from "@prisma/client";

let dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  console.warn("⚠️  ADVERTENCIA: No se encontró DATABASE_URL en ningún archivo .env");
} else {
  // En Windows Node.js a veces resuelve localhost como IPv6 (::1) fallando la conexión con Docker
  if (dbUrl.includes("@localhost:")) {
    dbUrl = dbUrl.replace("@localhost:", "@127.0.0.1:");
  }
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
const isDryRun = args.includes("--dry-run");
const skipCountdown = args.includes("--yes");

const beforeIdx = args.indexOf("--before");
const beforeArg = beforeIdx !== -1 ? args[beforeIdx + 1] : undefined;

const empresaIdx = args.indexOf("--empresa-id");
const empresaIdFilter = empresaIdx !== -1 ? args[empresaIdx + 1] : undefined;

function resolveCutoffDate(dateStr?: string): { cutoff: Date; label: string } {
  if (!dateStr) {
    const now = new Date();
    return {
      cutoff: now,
      label: `Ahora (${now.toISOString()})`,
    };
  }

  const trimmed = dateStr.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    throw new Error(
      `Formato inválido en --before "${dateStr}". Usa YYYY-MM-DD (ej. --before 2026-10-09).`
    );
  }

  const cutoff = new Date(`${trimmed}T23:59:59.999-06:00`);
  if (isNaN(cutoff.getTime())) {
    throw new Error(`Fecha inválida en --before "${dateStr}".`);
  }

  return {
    cutoff,
    label: `${trimmed} 23:59:59.999 (CDMX UTC-6)`,
  };
}

async function main() {
  const { cutoff, label } = resolveCutoffDate(beforeArg);

  console.log("\n" + "=".repeat(76));
  console.log("  🛡️  LIMPIEZA Y CANCELACIÓN SEGURA DE AUDITORÍAS HUÉRFANAS (OPEN)");
  if (isDryRun) {
    console.log("  ⚠️  MODO DRY-RUN — Simulación de solo lectura (ningún dato será modificado)");
  }
  console.log("=".repeat(76));
  console.log(`  · Fecha de corte (startedAt <=): ${label}`);
  if (empresaIdFilter) {
    console.log(`  · Filtro por empresa_id:         ${empresaIdFilter}`);
  }

  const whereClause: any = {
    status: AuditStatus.OPEN,
    startedAt: {
      lte: cutoff,
    },
  };

  if (empresaIdFilter) {
    whereClause.sucursal = {
      empresa_id: empresaIdFilter,
    };
  }

  const staleAudits = await prisma.dynamicAudit.findMany({
    where: whereClause,
    orderBy: { startedAt: "asc" },
    select: {
      id: true,
      startedAt: true,
      isApplied: true,
      iniciadaPor: {
        select: { name: true, email: true },
      },
      sucursal: {
        select: {
          id: true,
          nombre: true,
          empresa: {
            select: {
              id: true,
              nombre: true,
            },
          },
        },
      },
      _count: {
        select: {
          items: true,
        },
      },
      items: {
        where: {
          OR: [
            { countedQuantity: { not: null } },
            { difference: { not: null } },
          ],
        },
        select: {
          id: true,
          countedQuantity: true,
          difference: true,
        },
      },
    },
  });

  if (staleAudits.length === 0) {
    console.log("\n  ✅ No se encontraron auditorías en estado OPEN para los criterios indicados.");
    console.log("=".repeat(76) + "\n");
    return;
  }

  // Agrupar por empresa para un reporte claro
  const byEmpresa = new Map<
    string,
    {
      empresaNombre: string;
      empresaId: string;
      audits: typeof staleAudits;
    }
  >();

  let totalItemsWithDifference = 0;

  for (const audit of staleAudits) {
    const empId = audit.sucursal.empresa.id;
    const empNombre = audit.sucursal.empresa.nombre;
    if (!byEmpresa.has(empId)) {
      byEmpresa.set(empId, {
        empresaNombre: empNombre,
        empresaId: empId,
        audits: [],
      });
    }
    byEmpresa.get(empId)!.audits.push(audit);
    totalItemsWithDifference += audit.items.filter((i) => i.difference !== null).length;
  }

  console.log(
    `\n  📋 Se encontraron ${staleAudits.length} auditoría(s) OPEN en ${byEmpresa.size} empresa(s):`
  );

  for (const group of byEmpresa.values()) {
    console.log(`\n  🏢 Empresa: "${group.empresaNombre}" (${group.empresaId})`);
    for (const a of group.audits) {
      const countedCount = a.items.filter((i) => i.countedQuantity !== null).length;
      const diffCount = a.items.filter((i) => i.difference !== null && i.difference !== 0).length;
      const startedStr = a.startedAt.toLocaleString("es-MX", {
        timeZone: "America/Mexico_City",
      });
      const userStr = a.iniciadaPor?.name || a.iniciadaPor?.email || "Desconocido";

      console.log(`     • Audit ID:   ${a.id}`);
      console.log(`       Sucursal:   ${a.sucursal.nombre}`);
      console.log(`       Iniciada:   ${startedStr} (por ${userStr})`);
      console.log(
        `       Snapshot:   ${a._count.items} prod. | Contados: ${countedCount} | Con dif. parcial: ${diffCount}`
      );
    }
  }

  console.log("\n" + "-".repeat(76));
  console.log(`  📊 RESUMEN DE IMPACTO:`);
  console.log(`     · Auditorías que pasarán a CANCELED:             ${staleAudits.length}`);
  console.log(`     · Ítems con diferencias parciales a neutralizar: ${totalItemsWithDifference}`);
  console.log(`     · Cambios en Inventario_Sucursal (stock):        0 (Garantizado)`);
  console.log(`     · Registros en MovimientoInventario:             0 (Garantizado)`);
  console.log("-".repeat(76));

  if (isDryRun) {
    console.log("\n  ✅ DRY-RUN COMPLETADO. No se realizó ningún cambio en la base de datos.");
    console.log("  👉 Para ejecutar la cancelación real, corre:");
    console.log("     pnpm --filter @shopli/db run db:cleanup-audits\n");
    return;
  }

  if (!skipCountdown) {
    console.log("\n  ⚠️  EJECUCIÓN REAL: Se cancelarán las auditorías listadas arriba.");
    console.log("     Tienes 5 segundos para abortar con Ctrl+C...");
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }

  console.log("\n  ⏳ Asegurando soporte de estado CANCELED en el Enum de PostgreSQL...");
  await prisma.$executeRawUnsafe(
    `ALTER TYPE "AuditStatus" ADD VALUE IF NOT EXISTS 'CANCELED'`
  );

  const targetAuditIds = staleAudits.map((a) => a.id);
  const now = new Date();

  console.log("  ⏳ Ejecutando cancelación y neutralización dentro de una transacción atómica...");

  const result = await prisma.$transaction(async (tx) => {
    // 1. Neutralizar cualquier diferencia o esperado parcial en los ítems para que jamás
    //    afecten cálculos financieros o discrepancias, conservando initialStock y countedQuantity.
    const updatedItems = await tx.dynamicAuditItem.updateMany({
      where: {
        auditId: { in: targetAuditIds },
        OR: [
          { difference: { not: null } },
          { expectedAtCount: { not: null } },
        ],
      },
      data: {
        difference: null,
        expectedAtCount: null,
      },
    });

    // 2. Pasar las auditorías a estado CANCELED con timestamp de cierre y isApplied = false
    const updatedAudits = await tx.dynamicAudit.updateMany({
      where: {
        id: { in: targetAuditIds },
        status: AuditStatus.OPEN,
      },
      data: {
        status: AuditStatus.CANCELED,
        finishedAt: now,
        isApplied: false,
      },
    });

    return {
      auditsCanceled: updatedAudits.count,
      itemsNeutralized: updatedItems.count,
    };
  });

  console.log("\n  ✅ LIMPIEZA COMPLETADA CON ÉXITO:");
  console.log(`     · Auditorías marcadas como CANCELED: ${result.auditsCanceled}`);
  console.log(`     · Ítems parciales neutralizados:     ${result.itemsNeutralized}`);
  console.log("     · El stock e historial financiero de todas las empresas permanece intacto.\n");
}

main()
  .catch((e) => {
    console.error("\n❌ Error durante la ejecución (transacción abortada):", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
