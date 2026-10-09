import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ShoppingCart, Package, Wallet, History, X, Lock, Settings, ClipboardCheck } from "lucide-react";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { PWASettingsModal } from "../PWASettingsModal";
import { useAuth } from "../../contexts/AuthContext";
import { UserAvatar } from "../../features/auth/LoginForm";

interface SidebarProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const { user } = useAuth();
    const isAuditActive = useLiveQuery(
        async () => {
            const activeAudit = await db.meta.get('active_audit_id');
            return !!activeAudit;
        },
        []
    );

    if (!isOpen) return null;

    const navItems = [
        { path: "/", label: "Ventas", icon: ShoppingCart },
        { path: "/historial-ventas", label: "Historial de Ventas", icon: History },
        { 
            path: "/inventario", 
            label: "Inventario", 
            icon: Package,
            disabled: isAuditActive 
        },
        { path: "/auditoria-dinamica", label: "Auditoría Dinámica", icon: ClipboardCheck },
        { path: "/corte-caja", label: "Corte de Caja", icon: Wallet },
    ];

    return (
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/25 backdrop-blur-[1px] z-40 transition-none"
                onClick={onClose}
            />

            {/* Modern Sheet Drawer */}
            <aside className="fixed top-0 left-0 h-dvh w-[82vw] max-w-[300px] bg-white rounded-r-3xl border-r border-zinc-200/80 z-50 flex flex-col shadow-2xl select-none overflow-hidden">
                {/* Cashier Profile Card Header */}
                <div className="p-4 pb-3 border-b border-zinc-100 shrink-0">
                    <div className="flex items-center justify-between gap-2">
                        {user ? (
                            <div className="flex items-center gap-3 min-w-0 flex-1 bg-zinc-50 border border-zinc-200/70 rounded-full p-1.5 pr-3.5">
                                <UserAvatar id={user.id} name={user.name} size={36} />
                                <div className="min-w-0 flex-1 text-left">
                                    <p className="text-sm font-bold text-zinc-900 truncate leading-tight">
                                        {user.name}
                                    </p>
                                    <p className="text-[11px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                                        {user.branchName || user.role}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <span className="text-base font-bold text-zinc-900 px-2">Menú</span>
                        )}

                        <button
                            type="button"
                            onClick={onClose}
                            aria-label="Cerrar menú"
                            className="w-9 h-9 rounded-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 flex items-center justify-center shrink-0 active:scale-95 cursor-pointer"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 overflow-y-auto py-4 px-3.5 flex flex-col gap-1.5">
                    {navItems.map((item) => (
                        <NavLink
                            key={item.path}
                            to={item.disabled ? "#" : item.path}
                            onClick={(e) => {
                                if (item.disabled) {
                                    e.preventDefault();
                                    return;
                                }
                                onClose();
                            }}
                            className={({ isActive }) =>
                                `flex items-center gap-3.5 px-4 py-3.5 rounded-full text-sm transition-none ${
                                    item.disabled
                                        ? "opacity-45 cursor-not-allowed bg-zinc-50 text-zinc-400 font-medium"
                                        : isActive
                                        ? "bg-black text-white font-semibold shadow-xs"
                                        : "text-zinc-700 hover:bg-zinc-100 active:bg-zinc-200/70 font-medium"
                                }`
                            }
                        >
                            <div className="relative flex items-center justify-center shrink-0">
                                <item.icon className="w-[18px] h-[18px]" />
                                {item.disabled && (
                                    <Lock className="w-3 h-3 absolute -top-1 -right-1.5 text-red-500" />
                                )}
                            </div>
                            <span className="truncate">{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                {/* System Settings Footer */}
                <div className="p-3.5 border-t border-zinc-100 shrink-0 bg-zinc-50/40">
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-full text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 active:scale-[0.99] transition-none cursor-pointer"
                    >
                        <Settings className="w-[18px] h-[18px] text-zinc-400 shrink-0" />
                        <span>Ajustes del Sistema</span>
                    </button>
                </div>
            </aside>

            <PWASettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
}
