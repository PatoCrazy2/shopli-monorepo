import { useState } from "react";
import { Search, AlertTriangle, PackageSearch, Lock } from "lucide-react";
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

    // Filtrado
    const filteredProducts = products.filter(p => {
        const matchesName = p.nombre.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesLowStock = showLowStockOnly ? p.stock <= 5 : true;
        return matchesName && matchesLowStock;
    });

    if (isAuditActive) {
        return (
            <div className="flex flex-col w-full h-full bg-gray-50 items-center justify-center p-6 text-center">
                <div className="max-w-md bg-white p-10 rounded-2xl shadow-xl border border-gray-100">
                    <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Lock className="w-10 h-10 text-red-600" />
                    </div>
                    <h1 className="text-3xl font-black text-gray-900 mb-4">Acceso Restringido</h1>
                    <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                        No puedes consultar el inventario mientras hay una **Auditoría Dinámica** en curso.
                        Esto garantiza la integridad del conteo ciego.
                    </p>
                    <Link
                        to="/auditoria-dinamica"
                        className="inline-flex items-center justify-center w-full h-14 bg-black text-white rounded-lg font-bold text-lg hover:bg-zinc-800 transition-colors"
                    >
                        Volver a la Auditoría
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col w-full h-full bg-gray-50 p-6 overflow-hidden">
            {/* Header Area */}
            <div className="shrink-0 mb-6">
                <h1 className="text-3xl font-bold text-gray-900 mb-6">Inventario Global</h1>

                <div className="flex gap-4 items-center">
                    {/* Buscador */}
                    <div className="relative flex-1">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <Search className="h-6 w-6 text-gray-400" />
                        </div>
                        <input
                            type="text"
                            placeholder="Buscar producto por nombre..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="block w-full h-14 pl-12 pr-4 bg-white border border-gray-200 rounded-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent text-lg"
                        />
                    </div>

                    {/* Filtro Stock Bajo */}
                    <button
                        onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                        className={`flex items-center gap-2 h-14 px-6 rounded-lg font-medium border text-lg
                            ${showLowStockOnly
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-white text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                    >
                        <AlertTriangle className={`w-6 h-6 ${showLowStockOnly ? "text-red-500" : "text-gray-400"}`} />
                        Stock Bajo
                    </button>
                </div>
            </div>

            {/* Tabla de Productos */}
            <div className="flex-1 bg-white border border-gray-200 rounded-lg shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto flex-1">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50 sticky top-0">
                            <tr>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/2">
                                    Producto
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                                    Stock
                                </th>
                                <th scope="col" className="px-3 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider w-1/4">
                                    Actualización
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredProducts.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-3 py-8 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <PackageSearch className="w-10 h-10 text-gray-300 mb-2" />
                                            <p className="text-sm font-medium">No se encontraron productos</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredProducts.map((product) => (
                                    <tr key={product.id} className="hover:bg-gray-50">
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="text-sm font-medium text-gray-900">{product.nombre}</div>
                                                {product.isCritical && (
                                                    <span className="ml-2 px-2 py-0.5 inline-flex text-xs leading-4 font-bold rounded-full bg-black text-white">
                                                        Crítico
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-sm font-bold ${product.stock <= 5 ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                {product.stock}
                                            </span>
                                        </td>
                                        <td className="px-3 py-3 whitespace-nowrap text-xs text-gray-500">
                                            {new Date(product.updatedAt).toLocaleDateString('es-MX', {
                                                day: '2-digit',
                                                month: 'short',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
