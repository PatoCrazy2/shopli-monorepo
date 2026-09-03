import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, Role } from "@shopli/db";
import { stripe } from "@/lib/stripe";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.empresa_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    if (session.user.role !== Role.DUENO) {
      return NextResponse.json(
        { error: "Solo el Dueño de la empresa puede acceder al portal de facturación." },
        { status: 403 }
      );
    }

    const empresa = await db.empresa.findUnique({
      where: { id: session.user.empresa_id },
      select: { stripeCustomerId: true },
    });

    if (!empresa?.stripeCustomerId) {
      return NextResponse.json(
        { error: "No cuentas con un perfil de facturación registrado en Stripe aún." },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: empresa.stripeCustomerId,
      return_url: `${appUrl}/dashboard/billing`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error("Error al generar sesión del Stripe Customer Portal:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al abrir el portal de facturación." },
      { status: 500 }
    );
  }
}
