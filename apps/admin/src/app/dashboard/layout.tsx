import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { Sidebar } from "@/components/Sidebar";

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

    // 3. Renderiza <Sidebar> + {children} en un flex layout full-height
    return (
        <div className="flex h-screen w-full bg-white dark:bg-zinc-950 overflow-hidden text-gray-900 dark:text-gray-100 font-sans selection:bg-black selection:text-white">
            {/* 
                El Sidebar maneja su propia navegación y estado (active). 
                Pasamos la info del usuario como dicta la regla.
            */}
            <Sidebar 
                user={{ 
                    name: session.user.name, 
                    role: session.user.role 
                }} 
            />
            
            <main className="flex-1 w-full overflow-y-auto transition-all duration-300 ease-out bg-gray-50/50 dark:bg-black">
                {/* 
                    Container con padding generoso (p-6/p-8), 
                    margen superior en móvil para evitar pisar el botón de menú
                */}
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 mt-16 md:mt-0 animate-in fade-in duration-300">
                    {children}
                </div>
            </main>
        </div>
    );
}
