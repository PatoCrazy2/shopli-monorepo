import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGastos } from "./queries";
import { getFilterOptions } from "../analytics/queries";
import { ExpenseForm } from "./_components/expense-form";
import { ExpenseList } from "./_components/expense-list";
import { Wallet, Scale, ArrowDownLeft, Receipt, Store, Activity } from "lucide-react";
import Link from "next/link";
import { cn } from "@repo/ui/lib/utils";

export default async function GastosPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursalId?: string; startDate?: string; endDate?: string; categoria?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const filters = {
    sucursalId: sp.sucursalId,
    startDate: sp.startDate,
    endDate: sp.endDate,
    categoria: sp.categoria
  };

  const gastos = await getGastos(filters);
  const options = await getFilterOptions();

  const totalGastos = gastos.reduce((sum, g) => sum + Number(g.monto), 0);
  const nominalGastos = gastos.filter(g => g.categoria === 'NOMINA').reduce((sum, g) => sum + Number(g.monto), 0);
  const localGastos = gastos.filter(g => g.categoria === 'RENTA').reduce((sum, g) => sum + Number(g.monto), 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20 px-4 sm:px-6">
      {/* Header & Filters - Apple Style (Clean & Crisp) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 bg-white dark:bg-zinc-950 p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-4xl font-bold tracking-tight text-zinc-900 dark:text-white">Gastos</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium max-w-md">
            Control financiero de egresos y costos operativos integrados.
          </p>
        </div>

        <form method="GET" className="flex flex-wrap items-center gap-4">
          <div className="flex flex-col gap-1.5 text-zinc-900 dark:text-zinc-100">
            <label htmlFor="sucursalId" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Sucursal</label>
            <select 
              name="sucursalId" 
              id="sucursalId"
              defaultValue={filters.sucursalId || ""}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 transition-all appearance-none pr-10 relative"
              style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' fill=\'none\' viewBox=\'0 0 24 24\' stroke=\'%23a1a1aa\'%3E%3Cpath stroke-linecap=\'round\' stroke-linejoin=\'round\' stroke-width=\'2\' d=\'M19 9l-7 7-7-7\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', backgroundSize: '16px' }}
            >
              <option value="">Todas las sucursales</option>
              {options.sucursales.map(s => (
                <option key={s.id} value={s.id}>{s.nombre}</option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="startDate" className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest ml-1">Fecha</label>
            <input 
              type="date" 
              name="startDate" 
              id="startDate"
              defaultValue={filters.startDate || ""}
              className="h-11 px-4 rounded-xl border border-zinc-200 bg-zinc-50 font-medium text-sm focus:outline-none focus:ring-1 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 transition-all"
            />
          </div>

          <button 
            type="submit"
            className="h-11 mt-auto px-8 bg-black text-white rounded-xl font-bold text-sm hover:bg-zinc-800 transition-all active:scale-95"
          >
            Filtrar
          </button>

          {(filters.sucursalId || filters.startDate) && (
            <Link 
              href="/dashboard/gastos" 
              className="h-11 mt-auto px-5 bg-zinc-100 text-zinc-600 flex items-center justify-center rounded-xl font-bold text-sm hover:bg-zinc-200 transition-all"
            >
              Limpiar
            </Link>
          )}
        </form>
      </div>

      {/* Stats Context Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 px-2">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-2 w-2 rounded-full bg-zinc-900 dark:bg-white" />
            <span className="text-sm font-bold uppercase tracking-widest text-zinc-900 dark:text-white">
              {filters.sucursalId ? options.sucursales.find(s => s.id === filters.sucursalId)?.nombre : 'Global'}
            </span>
            <span className="text-zinc-300">|</span>
            <span className="text-sm font-medium text-zinc-500">
              {gastos.length} Registros
            </span>
          </div>
          <ExpenseForm sucursales={options.sucursales} />
        </div>

        <div className="bg-zinc-100 dark:bg-zinc-900 px-8 py-4 rounded-2xl flex items-center gap-8 shadow-sm border border-zinc-200 dark:border-zinc-800">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">Egreso Acumulado</span>
          <span className="text-4xl font-bold text-zinc-900 dark:text-white tracking-tighter">
            ${totalGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Metrics Cards Grid - Low Density Prioritization */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <SummaryCard 
          title="Nómina" 
          value={`$${nominalGastos.toLocaleString()}`} 
          desc="Gasto total de staff" 
          icon={<Scale className="text-zinc-400" size={20} />}
        />
        <SummaryCard 
          title="Infraestructura" 
          value={`$${localGastos.toLocaleString()}`} 
          desc="Rentas y mantenimiento fijo" 
          icon={<Store className="text-zinc-400" size={20} />}
        />
        <SummaryCard 
          title="Otros Egresos" 
          value={`$${(totalGastos - nominalGastos - localGastos).toLocaleString()}`} 
          desc="Variables y caja chica" 
          icon={<Activity className="text-zinc-400" size={20} />}
        />
      </div>

      {/* List Container */}
      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden min-h-[400px]">
        {gastos.length === 0 ? (
          <div className="p-32 flex flex-col items-center justify-center text-center bg-zinc-50/10">
            <div className="w-20 h-20 bg-zinc-50 dark:bg-zinc-900 rounded-3xl flex items-center justify-center mb-6 border border-zinc-100 dark:border-zinc-800 shadow-sm">
              <Activity className="text-zinc-300" size={32} />
            </div>
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white tracking-tight">Sin información</h2>
            <p className="text-zinc-500 max-w-sm mt-2 text-sm font-medium">
              No hay gastos registrados que coincidan con los criterios de búsqueda.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
             <ExpenseList 
                gastos={gastos.map(g => ({ ...g, monto: Number(g.monto) })) as any} 
             />
          </div>
        )}
      </div>
    </div>
  );
}

function SummaryCard({ title, value, desc, icon }: { title: string, value: string, desc: string, icon: React.ReactNode }) {
  return (
    <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm transition-all hover:shadow-md group">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">{icon}</div>
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-300">Auditoría</span>
      </div>
      <div className="space-y-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">{title}</p>
        <h3 className="text-5xl font-bold tracking-tighter text-zinc-900 dark:text-white">{value}</h3>
        <p className="text-xs font-medium text-zinc-400 mt-4 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
