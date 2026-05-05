import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventoryHistory } from "./queries";
import { getBranches } from "../queries";
import { BranchFilter } from "../BranchFilter";
import Link from "next/link";

export default async function InventoryHistoryPage({ searchParams }: { searchParams: Promise<{ branch?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { branch: branchId } = await searchParams;
  const [history, branches] = await Promise.all([
    getInventoryHistory(branchId),
    getBranches()
  ]);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-500 mb-1">
            <Link href="/dashboard/inventory" className="hover:text-black transition-colors text-xs font-bold uppercase tracking-widest">Inventario</Link>
            <span className="text-zinc-300">/</span>
            <span className="text-xs font-bold uppercase tracking-widest text-black">Historial</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Movimientos de Stock</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Registro detallado de ingresos, egresos y transferencias entre sucursales.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4 bg-zinc-50 p-4 rounded-xl border border-zinc-200 shadow-sm">
        <BranchFilter branches={branches} />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-zinc-50 border-b border-zinc-200">
              <tr>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Fecha</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Producto</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs text-center">Tipo</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs text-right">Cant.</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Sucursal</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Motivo / Detalle</th>
                <th className="px-4 py-3 font-semibold text-zinc-500 uppercase tracking-wider text-xs">Usuario</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-8 py-12 text-center text-zinc-500 bg-zinc-50/30">
                    No hay movimientos registrados.
                  </td>
                </tr>
              ) : (
                history.map((m) => (
                  <tr key={m.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap text-zinc-500 font-medium">
                      {new Date(m.fecha).toLocaleString('es-MX', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </td>
                    <td className="px-4 py-3 font-bold text-zinc-900">
                      {m.producto.nombre}
                      <span className="block text-[10px] text-zinc-400 font-mono">{m.producto.codigo_interno || 'SIN SKU'}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider border ${
                        m.tipo === 'INGRESO' || m.tipo === 'TRANSFERENCIA_ENTRADA' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100' 
                        : 'bg-rose-50 text-rose-700 border-rose-100'
                      }`}>
                        {m.tipo.replace('_', ' ')}
                      </span>
                    </td>
                    <td className={`px-4 py-3 text-right font-mono font-bold ${m.cantidad > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </td>
                    <td className="px-4 py-3 text-zinc-600">{m.sucursal.nombre}</td>
                    <td className="px-4 py-3 text-zinc-500 italic text-xs">
                      {m.motivo || '—'}
                    </td>
                    <td className="px-4 py-3 text-zinc-400 text-xs font-medium">
                      {m.usuario.name || 'Admin'}
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
