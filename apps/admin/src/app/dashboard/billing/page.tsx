import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, Role, SubscriptionStatus } from "@shopli/db";
import { stripe } from "@/lib/stripe";
import { getEffectiveSubscription } from "@/lib/subscription-plans";
import { syncEmpresaFromStripeSubscription } from "@/lib/stripe-sync";
import { BillingClientView } from "./_components/BillingClientView";

export const dynamic = "force-dynamic";

interface BillingPageProps {
  searchParams: Promise<{
    status?: string;
    session_id?: string;
    expired?: string;
  }>;
}

export default async function BillingPage({ searchParams }: BillingPageProps) {
  const session = await auth();

  if (!session?.user?.id || !session?.user?.empresa_id) {
    redirect("/login");
  }

  // Solo el DUEÑO tiene acceso a la gestión de suscripción y facturación
  if (session.user.role !== Role.DUENO) {
    redirect("/dashboard/inicio");
  }

  const { status, session_id } = await searchParams;
  let optimisticSuccess = false;

  // Si regresa de Stripe Checkout exitoso con session_id:
  // Resolver síncronamente en el servidor para evitar race conditions con el webhook
  if (status === "success" && session_id) {
    try {
      const checkoutSession = await stripe.checkout.sessions.retrieve(session_id, {
        expand: ["subscription"],
      });

      if (checkoutSession.subscription) {
        const sub =
          typeof checkoutSession.subscription === "string"
            ? await stripe.subscriptions.retrieve(checkoutSession.subscription)
            : checkoutSession.subscription;

        await syncEmpresaFromStripeSubscription(
          sub,
          session.user.empresa_id,
          SubscriptionStatus.ACTIVE
        );
        optimisticSuccess = true;
      }
    } catch (checkoutRetrieveErr) {
      console.error("Error al recuperar checkout session en retorno:", checkoutRetrieveErr);
    }
  }

  // Obtener estado fresco de la empresa
  const empresa = await db.empresa.findUnique({
    where: { id: session.user.empresa_id },
    select: {
      id: true,
      nombre: true,
      plan: true,
      subscriptionStatus: true,
      trialEndsAt: true,
      gracePeriodEndsAt: true,
      stripeCustomerId: true,
      stripeSubscriptionId: true,
      currentPeriodEnd: true,
    },
  });

  if (!empresa) {
    redirect("/login");
  }

  const effectiveSub = getEffectiveSubscription(empresa);

  // Obtener uso actual de recursos
  const [productCount, branchCount, userCount] = await Promise.all([
    db.producto.count({
      where: { empresa_id: empresa.id, parent_id: null },
    }),
    db.sucursal.count({
      where: { empresa_id: empresa.id, activo: true },
    }),
    db.user.count({
      where: { empresa_id: empresa.id, active: true },
    }),
  ]);

  return (
    <BillingClientView
      empresa={{
        id: empresa.id,
        nombre: empresa.nombre,
        stripeCustomerId: empresa.stripeCustomerId,
        stripeSubscriptionId: empresa.stripeSubscriptionId,
        currentPeriodEnd: empresa.currentPeriodEnd
          ? empresa.currentPeriodEnd.toISOString()
          : null,
      }}
      effectiveSub={effectiveSub}
      usage={{
        products: productCount,
        branches: branchCount,
        users: userCount,
      }}
      initialSuccess={optimisticSuccess}
    />
  );
}
