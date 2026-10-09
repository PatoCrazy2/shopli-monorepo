import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { useSidebar } from "../../hooks/useSidebar";
import Sidebar from "./Sidebar";

const VIEW_LABELS: Record<string, string> = {
    "/": "Ventas",
    "/caja-chica": "Caja Chica",
    "/historial-ventas": "Historial",
    "/inventario": "Inventario",
    "/auditoria-dinamica": "Auditoría",
    "/corte-caja": "Corte de Caja",
};

export default function MainLayout() {
    const { isOpen, toggle, close } = useSidebar();
    const location = useLocation();
    const isAuditActive = location.pathname === '/auditoria-cierre';
    const [isOnline, setIsOnline] = useState(navigator.onLine);

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    const currentViewLabel = VIEW_LABELS[location.pathname] || "ShopLI POS";

    return (
        <div className="h-dvh bg-zinc-50 flex flex-col font-sans text-zinc-900 overflow-hidden">
            {!isAuditActive && (
                <Sidebar
                    isOpen={isOpen}
                    onClose={close}
                />
            )}

            {/* Minimalist Pill Header */}
            {!isAuditActive && (
                <header className="h-14 px-3 sm:px-6 flex items-center justify-between shrink-0 relative z-10">
                    <button
                        type="button"
                        onClick={toggle}
                        aria-label="Abrir menú de navegación"
                        className="flex items-center gap-2.5 pl-2 pr-3.5 py-1.5 bg-white border border-zinc-200/80 hover:border-zinc-300 active:scale-[0.98] rounded-full shadow-xs cursor-pointer select-none"
                    >
                        <img
                            src="/shopli.svg"
                            alt="ShopLI"
                            className="w-6 h-6 rounded-full shrink-0"
                        />
                        <span className="text-sm font-semibold text-zinc-900 tracking-tight">
                            {currentViewLabel}
                        </span>
                        <ChevronDown className={`w-3.5 h-3.5 text-zinc-400 shrink-0 transition-transform duration-150 ${isOpen ? 'rotate-180 text-zinc-900' : ''}`} />
                    </button>

                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white border border-zinc-200/80 rounded-full shadow-2xs select-none">
                        <span
                            className={`w-1.5 h-1.5 rounded-full ${
                                isOnline ? "bg-emerald-500" : "bg-red-500"
                            }`}
                        />
                        <span className="text-[11px] font-medium text-zinc-600">
                            {isOnline ? "Online" : "Offline"}
                        </span>
                    </div>
                </header>
            )}

            {/* Main Content Area */}
            <main className="flex-1 flex overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
