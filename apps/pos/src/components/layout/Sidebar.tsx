import { NavLink } from "react-router-dom";
import { ShoppingCart, Package, Wallet, History, LogOut, X } from "lucide-react";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
    onLogout?: () => void;
}

export default function Sidebar({ isOpen, onClose, onLogout }: SidebarProps) {
    if (!isOpen) return null;

    const navItems = [
        { path: "/", label: "Ventas", icon: ShoppingCart },
        { path: "/inventario", label: "Inventario", icon: Package },
        { path: "/corte-caja", label: "Corte de Caja", icon: Wallet },
        { path: "/historial-ventas", label: "Historial de Ventas", icon: History },
    ];

    return (
        <>
            {/* Backdrop for POS touch-friendly interaction */}
            <div
                className="fixed inset-0 bg-black/20 z-40 transition-none"
                onClick={onClose}
            />
            {/* Sidebar content */}
            <aside className="fixed top-0 left-0 h-full w-72 bg-white border-r border-gray-200 z-50 flex flex-col transition-none shadow-xl">
                <div className="h-16 flex items-center justify-between px-6 border-b border-gray-200 shrink-0">
                    <h2 className="text-xl font-bold tracking-tight">Menú</h2>
                    <button
                        onClick={onClose}
                        className="p-2 -mr-2 rounded-md hover:bg-gray-100 min-h-[3rem] min-w-[3rem] flex items-center justify-center transition-none"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <nav className="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-2">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            onClick={onClose}
                            className={({ isActive }) =>
                                `flex items-center gap-3 px-3 py-4 rounded-md text-base font-medium min-h-[3rem] transition-none ${isActive
                                    ? "bg-black text-white"
                                    : "text-gray-700 hover:bg-gray-100"
                                }`
                            }
                        >
                            <item.icon className="w-5 h-5" />
                            {item.label}
                        </NavLink>
                    ))}
                </nav>

                {onLogout && (
                    <div className="p-4 border-t border-gray-200">
                        <button
                            onClick={() => {
                                onClose();
                                onLogout();
                            }}
                            className="w-full flex items-center justify-center gap-2 px-4 py-4 min-h-[3rem] text-base font-medium text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-none"
                        >
                            <LogOut className="w-5 h-5" />
                            Cerrar Sesión
                        </button>
                    </div>
                )}
            </aside>
        </>
    );
}
