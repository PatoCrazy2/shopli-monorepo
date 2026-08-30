import fs from "fs";
import path from "path";
import { generateLabelsPDF, LabelProductInput } from "../../../apps/admin/src/lib/label-generator";

async function runTest() {
  console.log("Generando PDFs de prueba...");

  const mockProducts: LabelProductInput[] = [
    {
      nombre: "Coca-Cola Sin Azúcar 600ml",
      variante_nombre: null,
      precio_publico: 18.5,
      codigo_interno: "SL-000001",
      cantidad: 5,
    },
    {
      nombre: "Playera Manga Corta Algodón",
      variante_nombre: "Roja - M",
      precio_publico: 199.99,
      codigo_interno: "SL-000002",
      cantidad: 15,
    },
    {
      nombre: "Galletas Chokis Chocolate",
      variante_nombre: null,
      precio_publico: 15.0,
      codigo_interno: "SL-000003",
      cantidad: 15,
    },
  ];

  console.log("- Generando formato Carta (avery)...");
  const docLetter = await generateLabelsPDF(mockProducts, "letter");
  const bufferLetter = Buffer.from(docLetter.output("arraybuffer"));
  const letterPath = path.join(process.cwd(), "test-carta.pdf");
  fs.writeFileSync(letterPath, bufferLetter);
  console.log(`  ✓ Guardado en: ${letterPath}`);

  console.log("- Generando formato Térmico (rollo)...");
  const docThermal = await generateLabelsPDF(mockProducts, "thermal");
  const bufferThermal = Buffer.from(docThermal.output("arraybuffer"));
  const thermalPath = path.join(process.cwd(), "test-termico.pdf");
  fs.writeFileSync(thermalPath, bufferThermal);
  console.log(`  ✓ Guardado en: ${thermalPath}`);

  console.log("\nPrueba completada con éxito.");
}

runTest().catch((err) => {
  console.error("Error en la prueba:", err);
});
