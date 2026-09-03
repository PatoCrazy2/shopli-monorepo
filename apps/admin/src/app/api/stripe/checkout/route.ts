import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db, Role, SubscriptionPlan } from "@shopli/db";
import { stripe } from "@/lib/stripe";
import { PLAN_CONFIG } from "@/lib/subscription-plans";
import { z } from "zod";

const checkoutSchema = z.object({
  planId: z.enum([
    SubscriptionPlan.ARRANQUE,
    SubscriptionPlan.CRECIMIENTO,
    SubscriptionPlan.MULTISUCURSAL,
  ]),
  interval: z.enum(["month", "year"]).default("month"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !session?.user?.empresa_id) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    // Solo el DUEÑO puede gestionar pagos y suscripciones
    if (session.user.role !== Role.DUENO) {
      return NextResponse.json(
        { error: "Solo el Dueño de la empresa puede contratar planes de pago." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = checkoutSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Parámetros de suscripción inválidos", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { planId, interval } = parseResult.data;
    const planConfig = PLAN_CONFIG[planId];
    const priceId =
      interval === "year" ? planConfig.prices.yearly.priceId : planConfig.prices.monthly.priceId;

    if (!priceId) {
      return NextResponse.json(
        {
          error: `El ID de precio para el ${planConfig.name} (${interval}) no está configurado en las variables de entorno de Stripe.`,
        },
        { status: 400 }
      );
    }

    const empresa = await db.empresa.findUnique({
      where: { id: session.user.empresa_id },
      select: { id: true, nombre: true, stripeCustomerId: true, stripeSubscriptionId: true },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    // Si ya tiene una suscripción activa, debe usar la ruta de actualización en caliente (/api/stripe/update-plan)
    if (empresa.stripeSubscriptionId) {
      return NextResponse.json(
        {
          error: "Ya cuentas con una suscripción activa. Utiliza la opción de cambiar plan.",
          requiresUpdate: true,
        },
        { status: 400 }
      );
    }

    // 1. Obtener o crear Customer en Stripe
    let customerId = empresa.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email || undefined,
        name: session.user.name ? `${session.user.name} - ${empresa.nombre}` : empresa.nombre,
        metadata: { empresaId: empresa.id },
      });
      customerId = customer.id;

      await db.empresa.update({
        where: { id: empresa.id },
        data: { stripeCustomerId: customerId },
      });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

    // 2. Generar sesión de Stripe Checkout
    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        metadata: {
          empresaId: empresa.id,
          planId: planConfig.id,
        },
      },
      metadata: {
        empresaId: empresa.id,
        planId: planConfig.id,
      },
      success_url: `${appUrl}/dashboard/billing?status=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${appUrl}/dashboard/billing?status=canceled`,
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (error: any) {
    console.error("Error al crear sesión de Checkout en Stripe:", error);
    return NextResponse.json(
      { error: "Ocurrió un error al iniciar el proceso de pago." },
      { status: 500 }
    );
  }
}
