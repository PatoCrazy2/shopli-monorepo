"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { signOut } from "next-auth/react";

const HomeIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>);
const BoxIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path><polyline points="3.27 6.96 12 12.01 20.73 6.96"></polyline><line x1="12" y1="22.08" x2="12" y2="12"></line></svg>);
const UsersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>);
const ReceiptIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"></path><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"></path><path d="M12 17V7"></path></svg>);
const WalletIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"></path><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"></path><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"></path></svg>);
const LayersIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 12 12 17 22 12"></polyline><polyline points="2 17 12 22 22 17"></polyline></svg>);
const BarChartIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>);
const MenuIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>);
const CloseIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>);
const LogOutIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>);
const MapPinIcon = () => (<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>);

const NAV_LINKS = [
    { name: "Inicio", href: "/dashboard/inicio", icon: HomeIcon },
    { name: "Sucursales", href: "/dashboard/branches", icon: MapPinIcon },
    { name: "Catálogo", href: "/dashboard/catalog", icon: BoxIcon },
    { name: "Usuarios", href: "/dashboard/users", icon: UsersIcon },
    { name: "Ventas", href: "/dashboard/sales", icon: ReceiptIcon },
    { name: "Cortes", href: "/dashboard/cuts", icon: WalletIcon },
    { name: "Inventario", href: "/dashboard/inventory", icon: LayersIcon },
    { name: "Analítica", href: "/dashboard/analytics", icon: BarChartIcon },
];

export function Sidebar({ user }: { user: { name?: string | null; role?: string } }) {
    const pathname = usePathname();
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            {/* Mobile menu toggle */}
            <div className="md:hidden fixed top-0 left-0 w-full bg-white dark:bg-black border-b border-gray-200 dark:border-zinc-800 z-50 p-4 flex justify-between items-center shadow-sm">
                <span className="font-bold text-lg tracking-tight">ShopLI</span>
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors"
                >
                    {isOpen ? <CloseIcon /> : <MenuIcon />}
                </button>
            </div>

            {/* Sidebar background overlay for mobile */}
            {isOpen && (
                <div
                    className="md:hidden fixed inset-0 bg-black/40 z-40 backdrop-blur-sm transition-opacity"
                    onClick={() => setIsOpen(false)}
                />
            )}

            {/* Sidebar container */}
            <aside
                className={`
                    fixed md:static inset-y-0 left-0 z-50 w-64 bg-white dark:bg-black border-r border-gray-100 dark:border-zinc-900
                    flex flex-col transform transition-transform duration-300 ease-out shadow-lg md:shadow-none
                    ${isOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0 md:h-screen
                `}
            >
                <div className="p-6 pb-2 hidden md:flex md:items-center md:gap-2">
                    <img src="/shopli_snbg.svg" alt="ShopLI Logo" className="w-6 h-6" />
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white">ShopLI</h1>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-6 mt-12 md:mt-2 space-y-1">
                    <nav className="flex flex-col space-y-1">
                        {NAV_LINKS.map((link) => {
                            const Icon = link.icon;
                            // Check if pathname starts with the link's href to activate properly
                            const isActive = pathname.startsWith(link.href);

                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`
                                        flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200
                                        ${isActive
                                            ? "bg-black text-white shadow-md dark:bg-white dark:text-black"
                                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-50 hover:text-black dark:hover:bg-zinc-900 dark:hover:text-white"
                                        }
                                    `}
                                >
                                    <Icon />
                                    {link.name}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                {/* Bottom User Info Section */}
                <div className="p-4 border-t border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-black/50">
                    <div className="flex flex-col gap-1 mb-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                            {user.name || "Usuario"}
                        </span>
                        <span className="text-xs font-medium text-gray-500 bg-gray-200 dark:bg-zinc-800 py-0.5 px-2 rounded-full w-max">
                            {user.role}
                        </span>
                    </div>
                    <button
                        onClick={() => signOut()}
                        className="flex items-center gap-2 w-full px-2 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors duration-200 font-medium"
                    >
                        <LogOutIcon />
                        Cerrar Sesión
                    </button>
                </div>
            </aside>
        </>
    );
}
