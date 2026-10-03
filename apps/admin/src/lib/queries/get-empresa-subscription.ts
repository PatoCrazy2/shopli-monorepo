import { unstable_cache } from "next/cache";
import { cache } from "react";
import { db } from "@shopli/db";

const getCachedEmpresaSubscription = unstable_cache(
  async (empresaId: string) => {
    return db.empresa.findUnique({
      where: { id: empresaId },
      select: {
        plan: true,
        subscriptionStatus: true,
        trialEndsAt: true,
        gracePeriodEndsAt: true,
        stripeSubscriptionId: true,
      },
    });
  },
  ["empresa-subscription-cache-v1"],
  {
    revalidate: 300,
    tags: ["empresa-subscription"],
  }
);

export const getEmpresaSubscription = cache(async (empresaId: string) => {
  return getCachedEmpresaSubscription(empresaId);
});
