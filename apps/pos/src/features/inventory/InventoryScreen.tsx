import { useState } from "react";
import { Search, AlertTriangle, PackageSearch, Lock, X } from "lucide-react";
import { useInventory } from "./hooks/useInventory";
import { useLiveQuery } from "dexie-react-hooks";
import { db } from "../../lib/db";
import { Link } from "react-router-dom";

export default function InventoryScreen() {
    const [searchTerm, setSearchTerm] = useState("");
    const { products } = useInventory();
    const [showLowStockOnly, setShowLowStockOnly] = useState(false);

    const isAuditActive = useLiveQuery(
        async () => {
            const activeAudit = await db.meta.get('active_audit_id');
            return !!activeAudit;
        },
        []
    );

    // Métricas de inventario
    const lowStockCount = products.filter(p => p.stock <= 5).length;

    // Filtrado de productos por nombre, código y stock bajo
    const filteredProducts = products.filter(p => {
        const term = searchTerm.toLowerCase().trim();
        const matchesName = p.nombre.toLowerCase().includes(term);
        const matchesCode = p.codigo_interno ? p.codigo_interno.toLowerCase().includes(term) : false;
        const matchesLowStock = showLowStockOnly ? p.stock <= 5 : true;
        return (matchesName || matchesCode) && matchesLowStock;
    });

    if (isAuditActive) {
        return (
            <div className="flex flex-col w-full h-full bg-zinc-50 items-center justify-center p-6 text-center font-sans">
                <div className="max-w-md bg-white p-8 sm:p-10 rounded-3xl shadow-xl border border-zinc-200">
                    <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-red-100">
                        <Lock className="w-8 h-8 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-black text-zinc-900 mb-2 tracking-tight">Acceso Restringido</h1>
                    <p className="text-zinc-600 text-sm mb-6 leading-relaxed">
                        No es posible consultar el inventario mientras hay una <strong>Auditoría Dinámica</strong> en curso para proteger la precisión del conteo a ciegas.
                    </p>
                    <Link
                        to="/auditoria-dinamica"
                        className="inline-flex items-center justify-center w-full h-12 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 active:scale-95 transition-all shadow-sm"
                    >
                        Volver a la Auditoría
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-zinc-50 p-4 sm:p-6 overflow-hidden font-sans">
            {/* Header Compacto */}
            <div className="shrink-0 mb-4">
                <h1 className="text-base sm:text-2xl font-black text-zinc-900 tracking-tight">
                    Inventario Global
                </h1>
                <p className="text-xs text-zinc-500 font-medium hidden sm:block">
                    Existencias y alertas de stock de la sucursal activa
                </p>
            </div>

            {/* Summary Card de 2 Columnas Balanceadas */}
            <div className="shrink-0 bg-black text-white p-4 sm:p-5 rounded-2xl mb-4 shadow-sm border border-zinc-900 grid grid-cols-2 divide-x divide-zinc-800">
                <div className="pr-3 sm:pr-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        Catálogo Total
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight">
                            {products.length}
                        </span>
                        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                            {products.length === 1 ? 'producto' : 'productos'}
                        </span>
                    </div>
                </div>
                <div className="pl-3 sm:pl-5 flex flex-col justify-center">
                    <span className="text-zinc-400 text-[11px] sm:text-xs font-semibold uppercase tracking-wider block mb-1">
                        En Riesgo (≤ 5)
                    </span>
                    <div className="flex items-baseline gap-1.5">
                        <span className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight ${
                            lowStockCount > 0 ? 'text-amber-400' : 'text-white'
                        }`}>
                            {lowStockCount}
                        </span>
                        <span className="text-xs sm:text-sm text-zinc-400 font-medium">
                            {lowStockCount === 1 ? 'alerta' : 'alertas'}
                        </span>
                    </div>
                </div>
            </div>

            {/* Controles de Búsqueda y Filtro */}
            <div className="flex gap-2.5 items-center mb-4 shrink-0">
                {/* Buscador estilizado */}
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-400" />
                    </div>
                    <input
                        type="text"
                        placeholder="Buscar por nombre o código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="block w-full h-10 pl-9 pr-8 bg-white border border-zinc-200 rounded-xl text-xs sm:text-sm text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-zinc-400 shadow-sm transition-colors"
                    />
                    {searchTerm && (
                        <button
                            type="button"
                            onClick={() => setSearchTerm('')}
                            className="absolute inset-y-0 right-0 pr-3 flex items-center text-zinc-400 hover:text-zinc-600"
                            aria-label="Limpiar búsqueda"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    )}
                </div>

                {/* Filtro Chip Stock Bajo */}
                <button
                    type="button"
                    onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                    className={`flex items-center gap-1.5 h-10 px-3 sm:px-3.5 rounded-xl text-xs font-semibold border transition-all active:scale-95 shrink-0 shadow-sm ${
                        showLowStockOnly
                            ? "bg-zinc-900 text-white border-zinc-900 ring-1 ring-black/10"
                            : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
                    }`}
                >
                    <AlertTriangle className={`w-3.5 h-3.5 flex-shrink-0 ${showLowStockOnly ? "text-amber-400" : "text-amber-600"}`} />
                    <span>Stock Bajo</span>
                    {lowStockCount > 0 && (
                        <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                            showLowStockOnly ? "bg-zinc-800 text-amber-300" : "bg-amber-100 text-amber-900"
                        }`}>
                            {lowStockCount}
                        </span>
                    )}
                </button>
            </div>

            {/* Contenedor Principal de Productos */}
            <div className="flex-1 overflow-y-auto no-scrollbar pb-6">
                {filteredProducts.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
                        <div className="w-16 h-16 bg-zinc-200 rounded-full flex items-center justify-center mb-3">
                            <PackageSearch className="w-8 h-8 text-zinc-500" />
                        </div>
                        <p className="text-base sm:text-lg font-bold text-zinc-700">No se encontraron productos</p>
                        <p className="text-xs sm:text-sm text-zinc-500 max-w-xs text-center mt-1">
                            {searchTerm || showLowStockOnly
                                ? "Intenta modificar los filtros o el término de búsqueda."
                                : "No hay productos registrados en el inventario local."}
                        </p>
                        {(searchTerm || showLowStockOnly) && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchTerm("");
                                    setShowLowStockOnly(false);
                                }}
                                className="mt-4 px-4 py-2 bg-white border border-zinc-200 rounded-xl text-xs font-bold text-zinc-800 hover:bg-zinc-50 shadow-sm transition-all active:scale-95"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {/* 1. Vista Móvil: Lista de Tarjetas Limpias (sm:hidden) */}
                        <div className="flex flex-col gap-2 sm:hidden">
                            {filteredProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-sm flex items-center justify-between gap-3"
                                >
                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5 mb-1">
                                            <span className="font-bold text-sm text-zinc-900 truncate block">
                                                {product.nombre}
                                            </span>
                                            {product.isCritical && (
                                                <span className="px-1.5 py-0.5 text-[9px] font-bold rounded-full bg-black text-white shrink-0 tracking-wider uppercase">
                                                    Crítico
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                                            {product.codigo_interno && (
                                                <span className="font-mono text-[11px] text-zinc-400">
                                                    #{product.codigo_interno}
                                                </span>
                                            )}
                                            <span className="text-[11px] text-zinc-400">
                                                Act. {new Date(product.updatedAt).toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <span
                                            className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                                                product.stock <= 0
                                                    ? "bg-red-50 text-red-700 border border-red-200"
                                                    : product.stock <= 5
                                                    ? "bg-amber-50 text-amber-900 border border-amber-200"
                                                    : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                                            }`}
                                        >
                                            {product.stock} {product.stock === 1 ? "pza" : "pzas"}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* 2. Vista Desktop: Tabla Moderna Pulida (hidden sm:block) */}
                        <div className="hidden sm:block bg-white border border-zinc-200 rounded-2xl shadow-sm overflow-hidden">
                            <table className="min-w-full divide-y divide-zinc-100">
                                <thead className="bg-zinc-50/80 sticky top-0 border-b border-zinc-100">
                                    <tr>
                                        <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            Código
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-left text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            Stock Actual
                                        </th>
                                        <th scope="col" className="px-5 py-3 text-right text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">
                                            Última Actualización
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-zinc-100">
                                    {filteredProducts.map((product) => (
                                        <tr key={product.id} className="hover:bg-zinc-50/80 transition-colors">
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-zinc-900">
                                                        {product.nombre}
                                                    </span>
                                                    {product.isCritical && (
                                                        <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-black text-white uppercase tracking-wider">
                                                            Crítico
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400 font-mono">
                                                {product.codigo_interno ? `#${product.codigo_interno}` : "—"}
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap">
                                                <span
                                                    className={`inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-black ${
                                                        product.stock <= 0
                                                            ? "bg-red-50 text-red-700 border border-red-200"
                                                            : product.stock <= 5
                                                            ? "bg-amber-50 text-amber-900 border border-amber-200"
                                                            : "bg-zinc-100 text-zinc-800 border border-zinc-200"
                                                    }`}
                                                >
                                                    {product.stock} {product.stock === 1 ? "pza" : "pzas"}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3.5 whitespace-nowrap text-xs text-zinc-400 text-right">
                                                {new Date(product.updatedAt).toLocaleDateString('es-MX', {
                                                    day: '2-digit',
                                                    month: 'short',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
