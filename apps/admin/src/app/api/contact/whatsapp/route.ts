import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "");

  if (!whatsappNumber) {
    // Si no está configurado aún en el servidor, redirigir a la landing de forma segura
    return NextResponse.redirect(new URL("/#precios", req.url));
  }

  const { searchParams } = new URL(req.url);
  const plan = searchParams.get("plan");

  const defaultMessage = plan
    ? `Hola ShopLI, me interesa obtener información sobre el plan ${plan} y opciones a la medida.`
    : "Hola ShopLI, me gustaría cotizar un plan a la medida o resolver unas dudas sobre el sistema.";

  const targetUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(defaultMessage)}`;

  // Redirección temporal 307 al enlace seguro de WhatsApp
  return NextResponse.redirect(targetUrl, 307);
}
