import { getEffectiveSubscription } from "@/lib/subscription-plans";
import { getEmpresaSubscription } from "@/lib/queries/get-empresa-subscription";
import { SubscriptionPlan, SubscriptionStatus } from "@shopli/db";

export async function PlanBadgeServer({
  empresaId,
  isDrawer = false,
}: {
  empresaId: string;
  isDrawer?: boolean;
}) {
  const empresa = await getEmpresaSubscription(empresaId);
  if (!empresa) return null;

  const effectiveSubscription = getEffectiveSubscription(empresa);
  let planBadge = "Vencido";

  if (effectiveSubscription.effectiveStatus === SubscriptionStatus.TRIALING) {
    planBadge = `Trial ${effectiveSubscription.daysRemaining ?? 0}d`;
  } else if (effectiveSubscription.effectiveStatus === SubscriptionStatus.GRACE_PERIOD) {
    planBadge = `Gracia ${effectiveSubscription.graceDaysRemaining ?? 0}d`;
  } else if (effectiveSubscription.effectiveStatus === SubscriptionStatus.ACTIVE) {
    planBadge =
      effectiveSubscription.plan === SubscriptionPlan.ARRANQUE
        ? "Arranque"
        : effectiveSubscription.plan === SubscriptionPlan.CRECIMIENTO
        ? "Crecimiento"
        : "Multi-Sucursal";
  }

  const badgeLower = planBadge.toLowerCase();

  if (isDrawer) {
    return (
      <span
        className={`shrink-0 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
          badgeLower.includes("arranque")
            ? "bg-zinc-200/80 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border-zinc-300/80 dark:border-zinc-700"
            : badgeLower.includes("crecimiento")
            ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 border-zinc-800 dark:border-zinc-200"
            : badgeLower.includes("multi") || badgeLower.includes("sucursal")
            ? "bg-amber-100 text-amber-900 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300/40"
            : "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700"
        }`}
      >
        {planBadge}
      </span>
    );
  }

  return (
    <span
      className={`text-[10px] uppercase tracking-wider block ${
        badgeLower.includes("trial") || badgeLower.includes("arranque")
          ? "bg-gradient-to-r from-slate-700 via-gray-500 to-zinc-800 dark:from-zinc-100 dark:via-gray-300 dark:to-slate-400 bg-clip-text text-transparent drop-shadow-sm font-extrabold"
          : badgeLower.includes("crecimiento")
          ? "bg-gradient-to-r from-zinc-900 via-slate-700 to-zinc-950 dark:from-white dark:via-zinc-200 dark:to-gray-400 bg-clip-text text-transparent font-extrabold"
          : badgeLower.includes("multi") || badgeLower.includes("sucursal")
          ? "bg-gradient-to-r from-amber-700 via-yellow-600 to-amber-900 dark:from-amber-200 dark:via-yellow-300 dark:to-amber-400 bg-clip-text text-transparent font-extrabold"
          : "text-zinc-500 font-bold"
      }`}
    >
      {planBadge}
    </span>
  );
}
