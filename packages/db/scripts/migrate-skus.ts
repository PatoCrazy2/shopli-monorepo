import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("=== Iniciando migración de SKUs para productos existentes ===");

  // 1. Obtener todos los SKUs que empiezan con "SL-" para encontrar el máximo numérico real
  const slProducts = await prisma.producto.findMany({
    where: {
      codigo_interno: {
        startsWith: "SL-",
      },
    },
    select: {
      codigo_interno: true,
    },
  });

  let currentNumber = 0;
  for (const p of slProducts) {
    if (p.codigo_interno) {
      const match = (p.codigo_interno as string).match(/^SL-(\d+)$/);
      if (match) {
        const num = parseInt(match[1] as string, 10);
        if (num > currentNumber) {
          currentNumber = num;
        }
      }
    }
  }

  if (currentNumber > 0) {
    console.log(`Máximo SKU secuencial real encontrado: SL-${String(currentNumber).padStart(6, "0")} (Número: ${currentNumber})`);
  } else {
    console.log("No se encontraron SKUs previos con prefijo 'SL-'. Iniciando desde 0.");
  }

  // 2. Obtener productos y variantes sin SKU
  const productsToUpdate = await prisma.producto.findMany({
    where: {
      OR: [
        { codigo_interno: null },
        { codigo_interno: "" },
      ],
    },
    select: {
      id: true,
      nombre: true,
    },
  });

  console.log(`Se encontraron ${productsToUpdate.length} productos/variantes sin SKU.`);

  let updatedCount = 0;

  for (const p of productsToUpdate) {
    let skuGenerated = false;
    let nextSku = "";

    while (!skuGenerated) {
      currentNumber++;
      nextSku = `SL-${String(currentNumber).padStart(6, "0")}`;

      // Verificar si por casualidad existe en base de datos
      const exists = await prisma.producto.findUnique({
        where: { codigo_interno: nextSku },
        select: { id: true },
      });

      if (!exists) {
        skuGenerated = true;
      }
    }

    try {
      await prisma.producto.update({
        where: { id: p.id },
        data: {
          codigo_interno: nextSku,
          updatedAt: new Date(),
        },
      });
      updatedCount++;
      console.log(`[${updatedCount}/${productsToUpdate.length}] Asignado SKU ${nextSku} a: "${p.nombre}"`);
    } catch (error) {
      console.error(`Error al actualizar el producto ID ${p.id} ("${p.nombre}"):`, error);
    }
  }

  console.log(`\n=== Migración finalizada con éxito. Se actualizaron ${updatedCount} productos. ===`);
}

main()
  .catch((e) => {
    console.error("Error crítico durante la migración:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
