import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export default async function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  // 1. Si no hay sesión activa, debe autenticarse
  if (!session?.user) {
    redirect("/login");
  }

  // 2. Si el usuario ya completó el onboarding (ya tiene empresa_id), redirigir directamente al dashboard
  if (session.user.empresa_id) {
    redirect("/dashboard/inicio");
  }

  return <>{children}</>;
}
