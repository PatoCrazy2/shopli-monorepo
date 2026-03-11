import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSidebar } from "../../hooks/useSidebar";
import Sidebar from "./Sidebar";

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

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col font-sans text-gray-900">
            {!isAuditActive && <Sidebar isOpen={isOpen} onClose={close} />}

            {/* Top Navigation Bar */}
            {!isAuditActive && (
                <header className="h-14 sm:h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggle}
                            className="flex items-center gap-3 -ml-2 p-2 rounded-md hover:bg-gray-100 min-h-[3rem] transition-none"
                        >
                            <img src="/menushopli.svg" alt="ShopLI Logo" className="w-6 h-6" />
                            <h1 className="text-xl font-bold tracking-tight">ShopLI <sub style={{ fontSize: '0.5em' }}>POS</sub></h1>
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Indicador de conexión con texto pequeño */}
                        <div className="flex items-center gap-1">
                            <span className={`text-xs font-medium ${isOnline ? "text-green-600" : "text-red-600"}`}>
                                {isOnline ? "Online" : "Offline"}
                            </span>
                            <div
                                className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"}`}
                                title={isOnline ? "Conectado" : "Offline"}
                            />
                        </div>
                        {/* User profile / shift info */}
                        <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center font-bold text-xs">
                            C1
                        </div>
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
