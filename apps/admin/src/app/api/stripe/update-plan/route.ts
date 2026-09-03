import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { auth } from "@/lib/auth";
import { db, Role, SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { stripe } from "@/lib/stripe";
import { PLAN_CONFIG } from "@/lib/subscription-plans";
import { syncEmpresaFromStripeSubscription } from "@/lib/stripe-sync";
import { validateDowngradeEligibility } from "@/lib/check-plan-limits";
import { z } from "zod";

const updatePlanSchema = z.object({
  targetPlan: z.enum([
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

    if (session.user.role !== Role.DUENO) {
      return NextResponse.json(
        { error: "Solo el Dueño de la empresa puede modificar planes de pago." },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parseResult = updatePlanSchema.safeParse(body);
    if (!parseResult.success) {
      return NextResponse.json(
        { error: "Parámetros inválidos", details: parseResult.error.flatten() },
        { status: 400 }
      );
    }

    const { targetPlan, interval } = parseResult.data;
    const empresa = await db.empresa.findUnique({
      where: { id: session.user.empresa_id },
      select: {
        id: true,
        plan: true,
        stripeSubscriptionId: true,
        stripeSubscriptionItemId: true,
      },
    });

    if (!empresa) {
      return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 });
    }

    if (!empresa.stripeSubscriptionId || !empresa.stripeSubscriptionItemId) {
      return NextResponse.json(
        {
          error: "No tienes una suscripción activa previa. Inicia tu suscripción a través del Checkout.",
          requiresCheckout: true,
        },
        { status: 400 }
      );
    }

    // Si ya tiene ese mismo plan, no hace falta mutar
    if (empresa.plan === targetPlan) {
      return NextResponse.json(
        { error: "Ya te encuentras en este plan actualmente." },
        { status: 400 }
      );
    }

    // 1. Candado Server-Side: Validar si es elegible para el cambio (evitar downgrade con datos excedentes)
    const eligibility = await validateDowngradeEligibility(empresa.id, targetPlan);
    if (!eligibility.allowed) {
      return NextResponse.json({ error: eligibility.reason }, { status: 400 });
    }

    const targetConfig = PLAN_CONFIG[targetPlan];
    const targetPriceId =
      interval === "year"
        ? targetConfig.prices.yearly.priceId
        : targetConfig.prices.monthly.priceId;

    if (!targetPriceId) {
      return NextResponse.json(
        { error: `El ID de precio para el ${targetConfig.name} (${interval}) no está configurado en el servidor.` },
        { status: 400 }
      );
    }

    // 2. Ejecutar actualización en Stripe exigiendo cobro síncrono del prorrateo
    try {
      const updatedSub = await stripe.subscriptions.update(empresa.stripeSubscriptionId, {
        items: [{ id: empresa.stripeSubscriptionItemId, price: targetPriceId }],
        proration_behavior: "always_invoice",
        payment_behavior: "error_if_incomplete",
        metadata: {
          empresaId: empresa.id,
          planId: targetPlan,
        },
        expand: ["latest_invoice.payment_intent"],
      });

      // 3. Si el cobro no falló, sincronizar atómicamente en base de datos con override ACTIVE
      await syncEmpresaFromStripeSubscription(updatedSub, empresa.id, SubscriptionStatus.ACTIVE);

      return NextResponse.json({
        success: true,
        plan: targetPlan,
        message: `Has cambiado exitosamente al ${targetConfig.name}.`,
      });
    } catch (stripeErr: any) {
      if (stripeErr instanceof Stripe.errors.StripeCardError) {
        return NextResponse.json(
          {
            error:
              stripeErr.message ||
              "Tu tarjeta fue rechazada al procesar el cobro de la diferencia de plan.",
          },
          { status: 400 }
        );
      }
      throw stripeErr;
    }
  } catch (error: any) {
    console.error("Error al actualizar suscripción en caliente:", error);
    return NextResponse.json(
      { error: error?.message || "Ocurrió un error al actualizar el plan." },
      { status: 500 }
    );
  }
}
