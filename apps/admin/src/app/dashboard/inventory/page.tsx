import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventory, getBranches } from "./queries";
import { QuickAdjustModal } from "./QuickAdjustModal";
import { BranchFilter } from "./BranchFilter";
import { TransferModal } from "./TransferModal";

export const metadata = {
  title: "Inventario Global - ShopLI",
};

export default async function InventoryPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { branch: branchId } = await searchParams;
  const branches = await getBranches();
  const products = await getInventory(branchId);

  // KPIs calculation
  const totalSkus = products.length;
  let totalInventoryValue = 0;
  let itemsInNegative = 0;
  let itemsLowStock = 0;

  const MIN_STOCK = 5;

  products.forEach(p => {
    if (p.totalStock > 0) {
      totalInventoryValue += p.totalStock * Number(p.costo);
    }
    if (p.totalStock < 0) {
      itemsInNegative++;
    }
    if (p.totalStock >= 0 && p.totalStock < MIN_STOCK) {
      itemsLowStock++;
    }
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-stretch">
        <div className="flex flex-col justify-center py-2">
          <h1 className="text-3xl font-black tracking-tight text-black">Inventario de Stock</h1>
          <p className="text-sm text-zinc-400 font-medium mt-1">
            Control de existencias, movimientos entre sucursales y ajustes manuales.
          </p>
        </div>
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <TransferModal products={products} branches={branches} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
        <KPICard
          title="Productos"
          value={totalSkus.toString()}
          subtitle="Productos en catálogo"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-500"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.29 7 12 12 20.71 7" /><line x1="12" x2="12" y1="22" y2="12" /></svg>
          }
          bgColor="bg-blue-50/50"
          borderColor="border-blue-100"
        />
        <KPICard
          title="Valor Total (Costo)"
          value={"$" + totalInventoryValue.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          subtitle="Capital invertido en stock"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><line x1="12" x2="12" y1="2" y2="22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
          }
          bgColor="bg-emerald-50/50"
          borderColor="border-emerald-100"
        />
        <KPICard
          title="Items en Negativo"
          value={itemsInNegative.toString()}
          subtitle="Requieren ajuste urgente"
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" x2="12" y1="9" y2="13" /><line x1="12" x2="12.01" y1="17" y2="17" /></svg>
          }
          bgColor="bg-rose-50/50"
          borderColor="border-rose-200"
          valueColor={itemsInNegative > 0 ? "text-rose-600" : "text-zinc-900"}
        />
        <KPICard
          title="Stock Bajo"
          value={itemsLowStock.toString()}
          subtitle={`Stock por debajo de ${MIN_STOCK} u.`}
          icon={
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><polyline points="22 17 13.5 8.5 8.5 13.5 2 7" /><polyline points="16 17 22 17 22 11" /></svg>
          }
          bgColor="bg-amber-50/50"
          borderColor="border-amber-200"
          valueColor={itemsLowStock > 0 ? "text-amber-600" : "text-zinc-900"}
        />
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm mt-8">
        <BranchFilter branches={branches} />
      </div>

      {/* Tabla de Datos */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm mt-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-500 w-24 uppercase tracking-wider text-xs">Código</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Producto</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Categoría</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 text-right uppercase tracking-wider text-xs">Costo Unit.</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-24 uppercase tracking-wider text-xs">Stock</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 text-right uppercase tracking-wider text-xs">Valor P.</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-32 uppercase tracking-wider text-xs">Estado</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 text-center w-24 uppercase tracking-wider text-xs">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-8 py-12 text-center text-zinc-500 bg-zinc-50/30">
                    <div className="flex flex-col items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="mb-4 text-zinc-300"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
                      <p className="font-medium text-lg text-zinc-700">No hay productos</p>
                      <p className="text-sm">Registra productos para ver su inventario aquí.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                products.map(p => {
                  const valorParcial = p.totalStock > 0 ? p.totalStock * Number(p.costo) : 0;
                  const isNegative = p.totalStock < 0;
                  const isLow = p.totalStock >= 0 && p.totalStock < MIN_STOCK;

                  return (
                    <tr key={p.id} className="hover:bg-zinc-50/80 transition-colors group">
                      <td className="px-4 py-3 text-zinc-400 font-mono text-xs truncate max-w-[100px]" title={p.codigo_interno || 'N/A'}>
                        {p.codigo_interno || 'N/A'}
                      </td>
                      <td className="px-4 py-3 font-medium text-zinc-900">{p.nombre}</td>
                      <td className="px-4 py-3 text-zinc-500 text-sm">{p.categoria || '—'}</td>
                      <td className="px-4 py-3 text-zinc-600 text-right font-mono text-sm">
                        ${Number(p.costo).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ring-1 ring-inset ${isNegative ? 'bg-rose-50 text-rose-700 ring-rose-200' :
                          isLow ? 'bg-amber-50 text-amber-700 ring-amber-200' :
                            'bg-zinc-50 text-zinc-700 ring-zinc-200 shadow-sm'
                          }`}>
                          {p.totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-zinc-900 text-right font-mono font-medium text-sm">
                        ${valorParcial.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isNegative ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-rose-600">Revisar</span>
                        ) : isLow ? (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-600">Reabastecer</span>
                        ) : (
                          <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">Óptimo</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <QuickAdjustModal
                          productId={p.id}
                          productName={p.nombre}
                          branches={branches}
                          selectedBranchId={branchId}
                          productShares={p.inventario.map(inv => ({
                            sucursal_id: inv.sucursal_id,
                            cantidad: inv.cantidad
                          }))}
                        />
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="bg-zinc-50 border-t border-zinc-200 px-4 py-3 text-xs text-zinc-500 text-center">
          Mostrando {products.length} productos en el sistema
        </div>
      </div>
    </div>
  );
}

// Interfaz para la KPI Card
interface KPICardProps {
  title: string;
  value: string;
  subtitle: string;
  icon: React.ReactNode;
  bgColor: string;
  borderColor: string;
  valueColor?: string;
}

function KPICard({ title, value, subtitle, icon, bgColor, borderColor, valueColor = "text-zinc-900" }: KPICardProps) {
  return (
    <div className={`p-5 rounded-2xl border ${borderColor} ${bgColor} flex flex-col justify-between shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between space-x-2">
        <h3 className="text-sm font-semibold text-zinc-700">{title}</h3>
        <div className="p-2.5 bg-white rounded-xl shadow-sm border border-black/5">
          {icon}
        </div>
      </div>
      <div className="mt-5">
        <div className={`text-3xl font-black tracking-tight ${valueColor}`}>{value}</div>
        <p className="text-xs text-zinc-500 mt-1.5 font-medium">{subtitle}</p>
      </div>
    </div>
  );
}
