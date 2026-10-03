import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { getEffectiveSubscription } from "@/lib/subscription-plans";
import { getEmpresaSubscription } from "@/lib/queries/get-empresa-subscription";

export async function SubscriptionBannerServer({
  empresaId,
  userRole,
}: {
  empresaId: string;
  userRole?: string;
}) {
  const empresa = await getEmpresaSubscription(empresaId);
  if (!empresa) return null;

  const effectiveSubscription = getEffectiveSubscription(empresa);

  return (
    <SubscriptionBanner
      effectiveSub={effectiveSubscription}
      userRole={userRole}
    />
  );
}
