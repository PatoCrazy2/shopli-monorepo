import type { Metadata, Viewport } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";
import { MobileHeader } from "@/components/navigation/MobileHeader";
import { MobileBottomNav } from "@/components/navigation/MobileBottomNav";
import { SubscriptionBannerServer } from "@/components/subscription/SubscriptionBannerServer";
import { PlanBadgeServer } from "@/components/subscription/PlanBadgeServer";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    template: "%s | ShopLI Admin",
    default: "Dashboard | ShopLI Admin",
  },
};

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

  // 3. Guardián de Onboarding: Si el usuario no ha configurado su empresa → /onboarding
  if (!session.user.empresa_id) {
    redirect("/onboarding");
  }

  const userData = {
    name: session.user.name,
    role: session.user.role,
  };

  const empresaId = session.user.empresa_id;

  // 4. Renderiza MobileHeader + Sidebar (Desktop) + Main Content + MobileBottomNav
  // Cero bloqueos de DB en el layout raíz: las consultas de suscripción y banners corren en streaming paralelo
  return (
    <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white">
      {/* Header móvil minimalista (sin hamburguesa) */}
      <MobileHeader user={userData} />

      {/* Sidebar exclusivo para Desktop con streaming no bloqueante de planBadge */}
      <Sidebar
        user={userData}
        planBadgeSlot={
          <Suspense fallback={null}>
            <PlanBadgeServer empresaId={empresaId} />
          </Suspense>
        }
      />

      {/* Contenido principal con streaming no bloqueante de banner */}
      <main id="dashboard-scroll-container" className="flex-1 w-full overflow-y-auto bg-gray-50/50 dark:bg-black">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-18 pb-32 pb-[calc(env(safe-area-inset-bottom,0px)+7rem)] md:py-8 md:pt-8 animate-in fade-in duration-300">
          <Suspense fallback={null}>
            <SubscriptionBannerServer
              empresaId={empresaId}
              userRole={session.user.role}
            />
          </Suspense>
          {children}
        </div>
      </main>

      {/* Floating Bottom Dock móvil + Action Drawer con streaming no bloqueante */}
      <MobileBottomNav
        user={userData}
        planBadgeSlot={
          <Suspense fallback={null}>
            <PlanBadgeServer empresaId={empresaId} isDrawer />
          </Suspense>
        }
      />
    </div>
  );
}
