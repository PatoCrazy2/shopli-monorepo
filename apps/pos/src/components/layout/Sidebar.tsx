import { useState } from "react";
import { NavLink } from "react-router-dom";
import { ShoppingCart, Package, Wallet, Banknote, History, Lock, Settings, ClipboardCheck, Check } from "lucide-react";
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
        { path: "/caja-chica", label: "Gasto Caja Chica", icon: Banknote },
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
            {/* Backdrop invisible/suave para cerrar tocando afuera */}
            <div
                className="fixed inset-0 z-40 bg-black/10 backdrop-blur-[1px]"
                onClick={onClose}
            />

            {/* Popover Card flotante tipo Select */}
            <div className="fixed top-14 left-3 sm:left-6 w-[290px] sm:w-[310px] bg-white rounded-3xl border border-zinc-200/90 shadow-2xl z-50 p-2 flex flex-col select-none overflow-hidden max-h-[calc(100dvh-4.5rem)]">
                {/* Encabezado: Contexto del Cajero */}
                {user && (
                    <div className="px-3 py-2.5 flex items-center gap-2.5 bg-zinc-50 border border-zinc-200/60 rounded-2xl mb-1 shrink-0">
                        <UserAvatar id={user.id} name={user.name} size={32} />
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-zinc-900 truncate leading-tight">
                                {user.name}
                            </p>
                            <p className="text-[10px] font-medium text-zinc-500 truncate leading-tight mt-0.5">
                                {user.branchName || user.role}
                            </p>
                        </div>
                    </div>
                )}

                {/* Lista de Vistas (Estilo Select con Check) */}
                <div className="flex flex-col gap-0.5 py-1 overflow-y-auto custom-scrollbar">
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
                                `flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs sm:text-sm transition-none cursor-pointer ${
                                    item.disabled
                                        ? "opacity-45 cursor-not-allowed text-zinc-400 font-medium"
                                        : isActive
                                        ? "bg-zinc-100 text-zinc-950 font-bold"
                                        : "text-zinc-700 hover:bg-zinc-50 active:bg-zinc-100 font-medium"
                                }`
                            }
                        >
                            {({ isActive }) => (
                                <>
                                    <div className="flex items-center gap-2.5 min-w-0">
                                        <item.icon className="w-4 h-4 text-zinc-500 shrink-0" />
                                        <span className="truncate">{item.label}</span>
                                        {item.disabled && (
                                            <Lock className="w-3 h-3 text-red-500 shrink-0" />
                                        )}
                                    </div>
                                    {isActive && !item.disabled && (
                                        <Check className="w-4 h-4 text-zinc-900 shrink-0" />
                                    )}
                                </>
                            )}
                        </NavLink>
                    ))}
                </div>

                <div className="h-px bg-zinc-100 my-1 shrink-0" />

                {/* Acciones Secundarias */}
                <div className="flex flex-col gap-0.5 shrink-0">
                    <button
                        type="button"
                        onClick={() => setIsSettingsOpen(true)}
                        className="flex items-center gap-2.5 px-3 py-2.5 rounded-2xl text-xs sm:text-sm text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50 active:bg-zinc-100 font-medium text-left cursor-pointer transition-none"
                    >
                        <Settings className="w-4 h-4 text-zinc-400 shrink-0" />
                        <span className="truncate">Ajustes del Sistema</span>
                    </button>
                </div>
            </div>

            <PWASettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
            />
        </>
    );
}
