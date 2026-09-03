import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { db, SubscriptionStatus } from "@shopli/db";
import { syncEmpresaFromStripeSubscription } from "@/lib/stripe-sync";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("❌ STRIPE_WEBHOOK_SECRET no está configurado en el servidor.");
    return NextResponse.json({ error: "Webhook secret no configurado." }, { status: 500 });
  }

  const sig = req.headers.get("stripe-signature");
  if (!sig) {
    return NextResponse.json({ error: "Firma stripe-signature ausente." }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    // REGLA CRÍTICA: Extraer el cuerpo raw como texto, NUNCA parsear req.json()
    const rawBody = await req.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error(`⚠️ Error al verificar la firma del webhook de Stripe: ${err?.message}`);
    return NextResponse.json({ error: `Firma inválida: ${err?.message}` }, { status: 400 });
  }

  // 1. REGLA SERVERLESS: Resolver toda la I/O de red con Stripe FUERA de la transacción
  let sub: Stripe.Subscription | undefined;
  let empresaIdFromEvent: string | undefined;

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        empresaIdFromEvent = session.metadata?.empresaId;
        if (session.subscription) {
          sub = await stripe.subscriptions.retrieve(session.subscription as string);
        }
        break;
      }
      case "invoice.payment_succeeded":
      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        const subId =
          (invoice as any).subscription ||
          (invoice as any).parent?.subscription_details?.subscription ||
          (invoice as any).lines?.data?.[0]?.subscription;

        if (subId) {
          const subscriptionId = typeof subId === "string" ? subId : subId.id;
          sub = await stripe.subscriptions.retrieve(subscriptionId);
          empresaIdFromEvent = sub.metadata?.empresaId;
        }
        break;
      }
      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        sub = event.data.object as Stripe.Subscription;
        empresaIdFromEvent = sub.metadata?.empresaId;
        break;
      }
      default:
        // Evento no relevante para la sincronización de suscripciones
        break;
    }
  } catch (stripeApiErr: any) {
    console.error(`Error al consultar Stripe para el evento ${event.type}:`, stripeApiErr);
    return NextResponse.json(
      { error: "Error de red al consultar el estado de la suscripción en Stripe." },
      { status: 500 }
    );
  }

  // 2. DENTRO DE LA TRANSACCIÓN: Escrituras atómicas en Neon (< 5ms de conexión)
  try {
    await db.$transaction(async (tx) => {
      // Idempotencia: Si ya fue procesado concurrentemente, la clave primaria id lanza error P2002
      await tx.stripeWebhookEvent.create({
        data: {
          id: event.id,
          type: event.type,
        },
      });

      if (sub) {
        // En cobros exitosos forzamos ACTIVE; en borrado forzamos CANCELED;
        // en eventos de actualización o cobro fallido dejamos que mapStripeStatusToInternal decida.
        const statusOverride =
          event.type === "checkout.session.completed" || event.type === "invoice.payment_succeeded"
            ? SubscriptionStatus.ACTIVE
            : event.type === "customer.subscription.deleted"
            ? SubscriptionStatus.CANCELED
            : undefined;

        await syncEmpresaFromStripeSubscription(sub, empresaIdFromEvent, statusOverride, tx);
      }
    });

    return NextResponse.json({ received: true });
  } catch (dbErr: any) {
    // Si el error es P2002, significa que el evento ya fue registrado por una invocación concurrente
    if (dbErr?.code === "P2002") {
      return NextResponse.json({ received: true, duplicate: true });
    }

    console.error(`Error al procesar webhook [${event.type}] en la base de datos:`, dbErr);
    return NextResponse.json({ error: "Fallo al procesar el webhook en DB." }, { status: 500 });
  }
}
