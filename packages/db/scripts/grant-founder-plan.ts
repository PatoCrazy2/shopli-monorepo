import { PrismaClient, SubscriptionPlan, SubscriptionStatus } from "@prisma/client";
import * as readline from "readline";

const prisma = new PrismaClient();

async function main() {
  console.log("\n=======================================================");
  console.log("🚀 ShopLI SaaS - Asignación de Plan Fundador / Lifetime");
  console.log("=======================================================\n");

  const empresas = await prisma.empresa.findMany({
    select: {
      id: true,
      nombre: true,
      plan: true,
      subscriptionStatus: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  if (empresas.length === 0) {
    console.log("❌ No se encontraron empresas registradas en la base de datos.");
    return;
  }

  console.log(`📋 Se encontraron ${empresas.length} empresa(s) registrada(s):\n`);
  empresas.forEach((e, idx) => {
    console.log(
      `[${idx + 1}] ID: ${e.id} | Nombre: "${e.nombre}" | Plan actual: ${e.plan} | Estado: ${e.subscriptionStatus}`
    );
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query: string): Promise<string> =>
    new Promise((resolve) => rl.question(query, resolve));

  const input = await question(
    "\n👉 Ingresa el número [#] o el UUID exacto de la empresa que deseas promover a MULTISUCURSAL ACTIVO (o 'q' para salir): "
  );

  rl.close();

  if (input.toLowerCase() === "q" || !input.trim()) {
    console.log("Operación cancelada.");
    return;
  }

  let targetEmpresa = null;
  const numIdx = parseInt(input, 10);
  if (!isNaN(numIdx) && numIdx >= 1 && numIdx <= empresas.length) {
    targetEmpresa = empresas[numIdx - 1];
  } else {
    targetEmpresa = empresas.find((e) => e.id === input.trim()) || null;
  }

  if (!targetEmpresa) {
    console.log("❌ No se encontró ninguna empresa con ese número o UUID.");
    return;
  }

  console.log(`\n⏳ Actualizando empresa: "${targetEmpresa.nombre}" (${targetEmpresa.id})...`);

  const updated = await prisma.empresa.update({
    where: { id: targetEmpresa.id },
    data: {
      plan: SubscriptionPlan.MULTISUCURSAL,
      subscriptionStatus: SubscriptionStatus.ACTIVE,
      trialEndsAt: null,
      gracePeriodEndsAt: null,
    },
  });

  console.log("✅ ¡Actualización completada con éxito!");
  console.log(`🎉 La empresa "${updated.nombre}" ahora tiene acceso a:`);
  console.log(`   - Plan: ${updated.plan}`);
  console.log(`   - Estado: ${updated.subscriptionStatus} (Activo permanente / Fundador)`);
  console.log("   - Bloqueos en POS: Desactivados (0% riesgo de suspensión)\n");
}

main()
  .catch((e) => {
    console.error("Error al ejecutar el script:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
