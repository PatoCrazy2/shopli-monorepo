import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const whatsappNumber = process.env.WHATSAPP_BUSINESS_NUMBER?.replace(/\D/g, "");

  if (!whatsappNumber) {
    // Si no está configurado aún en el servidor, redirigir a la landing de forma segura
    return NextResponse.redirect(new URL("/#precios", req.url));
  }

  const message =
    "Buen día, me gustaría recibir asesoría y cotización para implementar ShopLI en mi negocio.";

  const targetUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;


  // Redirección temporal 307 al enlace seguro de WhatsApp
  return NextResponse.redirect(targetUrl, 307);
}
