import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db, SubscriptionPlan, SubscriptionStatus } from "@shopli/db";
import { Sidebar } from "@/components/Sidebar";
import { SubscriptionBanner } from "@/components/SubscriptionBanner";
import { getEffectiveSubscription } from "@/lib/subscription-plans";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await auth();

    // 1. Si no hay sesión → redirect
    if (!session?.user) {
        redirect("/login");
    }

    // 2. Si el rol no es DUEÑO (OWNER) ni ENCARGADO (MANAGER) → redirect
    if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
        redirect("/login");
    }

    // 3. Consultar suscripción efectiva
    let planBadge: string | null = null;
    let effectiveSubscription = null;

    if (session.user.empresa_id) {
        const empresa = await db.empresa.findUnique({
            where: { id: session.user.empresa_id },
            select: {
                plan: true,
                subscriptionStatus: true,
                trialEndsAt: true,
                gracePeriodEndsAt: true,
                stripeSubscriptionId: true,
            },
        });

        if (empresa) {
            effectiveSubscription = getEffectiveSubscription(empresa);

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
            } else {
                planBadge = "Vencido";
            }
        }
    }

    // 4. Renderiza <Sidebar> + {children} en un flex layout full-height
    return (
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white">
            <Sidebar 
                user={{ 
                    name: session.user.name, 
                    role: session.user.role,
                    planBadge,
                }} 
            />
            
            <main className="flex-1 w-full overflow-y-auto transition-all duration-300 ease-out bg-gray-50/50 dark:bg-black">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mt-16 md:mt-0 animate-in fade-in duration-300">
                    <SubscriptionBanner
                        effectiveSub={effectiveSubscription}
                        userRole={session.user.role}
                    />
                    {children}
                </div>
            </main>
        </div>
    );
}

