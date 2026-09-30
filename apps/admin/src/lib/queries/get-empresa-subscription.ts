import { unstable_cache } from "next/cache";
import { db } from "@shopli/db";

export const getEmpresaSubscription = (empresaId: string) =>
  unstable_cache(
    async () => {
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
    [`empresa-sub-${empresaId}`],
    {
      tags: [`empresa-sub-${empresaId}`],
      revalidate: 300,
    }
  )();
