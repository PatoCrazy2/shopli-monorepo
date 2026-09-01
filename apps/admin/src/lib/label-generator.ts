import { jsPDF } from "jspdf";
import QRCode from "qrcode";

export interface LabelProductInput {
  nombre: string;
  variante_nombre?: string | null;
  precio_publico: number;
  codigo_interno: string;
  cantidad: number;
}

const formatPrice = (price: number) => {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(price);
};

export async function generateLabelsPDF(
  products: LabelProductInput[],
  format: "letter" | "thermal"
): Promise<jsPDF> {
  // Generar todos los QRs de antemano para optimizar velocidad
  const qrCache: Record<string, string> = {};
  for (const p of products) {
    if (p.codigo_interno && !qrCache[p.codigo_interno]) {
      try {
        qrCache[p.codigo_interno] = await QRCode.toDataURL(p.codigo_interno, {
          margin: 1,
          width: 300,
          errorCorrectionLevel: "M",
        });
      } catch (err) {
        console.error(`Error generando QR para SKU: ${p.codigo_interno}`, err);
        // QR vacío por seguridad
        qrCache[p.codigo_interno] = "";
      }
    }
  }

  // Expandir productos por su cantidad
  const labelQueue: { nombre: string; precio: number; sku: string }[] = [];
  for (const p of products) {
    const displayName = p.variante_nombre ? `${p.nombre} (${p.variante_nombre})` : p.nombre;
    for (let i = 0; i < p.cantidad; i++) {
      labelQueue.push({
        nombre: displayName,
        precio: p.precio_publico,
        sku: p.codigo_interno,
      });
    }
  }

  if (format === "letter") {
    // Avery 5160 (Letter, 3x10 grid, 30 labels per page)
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "letter",
    });

    const labelWidth = 66.675;
    const labelHeight = 25.4;
    const leftMargin = 4.7625;
    const topMargin = 12.7;
    const colGap = 3.175;
    
    let currentLabel = 0;

    for (const item of labelQueue) {
      if (currentLabel > 0 && currentLabel % 30 === 0) {
        doc.addPage();
      }

      const indexOnPage = currentLabel % 30;
      const col = indexOnPage % 3;
      const row = Math.floor(indexOnPage / 3);

      const x = leftMargin + col * (labelWidth + colGap);
      const y = topMargin + row * labelHeight;

      // QR Code
      const qrData = qrCache[item.sku];
      if (qrData) {
        doc.addImage(qrData, "PNG", x + 2, y + 3, 19, 19);
      }

      // Nombre del producto (Bold, 7.5pt, con wrap/maxWidth)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(7.5);
      doc.text(item.nombre, x + 23, y + 7, { maxWidth: 41 });

      // SKU / Código Interno (Normal, 6.5pt)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(6.5);
      doc.text(item.sku, x + 23, y + 15);

      // Precio (Bold, 9pt)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(formatPrice(item.precio), x + 23, y + 21);

      currentLabel++;
    }

    return doc;
  } else {
    // Formato Térmico (Rollo individual de 50mm x 25mm)
    const doc = new jsPDF({
      orientation: "landscape",
      unit: "mm",
      format: [50, 25],
    });

    let firstPage = true;

    for (const item of labelQueue) {
      if (!firstPage) {
        doc.addPage([50, 25], "landscape");
      }
      firstPage = false;

      // QR Code
      const qrData = qrCache[item.sku];
      if (qrData) {
        doc.addImage(qrData, "PNG", 2, 2.5, 20, 20);
      }

      // Nombre del producto (Bold, 8pt, wrap)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.text(item.nombre, 24, 7, { maxWidth: 24 });

      // SKU / Código Interno (Normal, 7pt)
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.text(item.sku, 24, 15);

      // Precio (Bold, 10pt)
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(formatPrice(item.precio), 24, 21);
    }

    return doc;
  }
}
