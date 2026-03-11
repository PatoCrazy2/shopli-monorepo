import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Wifi, WifiOff } from "lucide-react";
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
                <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shrink-0 relative z-10">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={toggle}
                            className="flex items-center gap-3 -ml-2 p-2 rounded-md hover:bg-gray-100 min-h-[3rem] transition-none"
                        >
                            <img src="/menushopli.svg" alt="ShopLI Logo" className="w-6 h-6" />
                            <h1 className="text-xl font-bold tracking-tight">ShopLI <sub style={{ fontSize: '0.5em' }}>POS</sub></h1>
                        </button>
                    </div>

                    <div className="flex items-center gap-4">
                        {/* Sutil Connection Indicator (Semáforo) */}
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-medium text-gray-500">
                                {isOnline ? "Conectado" : "Offline"}
                            </span>
                            <div
                                className={`w-3 h-3 rounded-full ${isOnline ? "bg-green-500" : "bg-red-500"
                                    }`}
                                title={isOnline ? "Sincronizado" : "Trabajando sin conexión"}
                            />
                            {isOnline ? (
                                <Wifi className="w-4 h-4 text-green-600" />
                            ) : (
                                <WifiOff className="w-4 h-4 text-red-600" />
                            )}
                        </div>
                        {/* User profile / shift info will go here */}
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-bold">
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
