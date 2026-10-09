import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getGastos } from "./queries";
import { getFilterOptions } from "../analytics/queries";
import { ExpenseForm } from "./_components/expense-form";
import { ExpenseList } from "./_components/expense-list";
import { ExpenseFilters } from "./_components/expense-filters";
import { Scale, Store, Activity, Receipt } from "lucide-react";

export const dynamic = "force-dynamic";

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
  const otrosGastos = totalGastos - nominalGastos - localGastos;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-7xl mx-auto pb-20">
      {/* 1. Header Card (Apple Style / ShopLI Clean & Crisp) */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Gastos Operativos
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono">
              {gastos.length}
            </span>
          </div>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs sm:text-sm font-medium">
            Control y registro financiero de egresos y costos operativos.
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
          <ExpenseFilters
            sucursales={options.sucursales}
            currentSucursal={filters.sucursalId}
            currentDate={filters.startDate}
            currentCategoria={filters.categoria}
          />
          <ExpenseForm sucursales={options.sucursales} />
        </div>
      </div>

      {/* 2. Grid de Métricas Compactas pero Protagónicas (4 Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <SummaryCard 
          title="Egreso Total" 
          value={`$${totalGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          desc={`${gastos.length} movimientos`}
          icon={<Receipt size={16} className="text-zinc-900 dark:text-zinc-100" />}
          featured
        />
        <SummaryCard 
          title="Nómina" 
          value={`$${nominalGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          desc="Gasto de staff y sueldos" 
          icon={<Scale size={16} className="text-zinc-500 dark:text-zinc-400" />}
        />
        <SummaryCard 
          title="Infraestructura" 
          value={`$${localGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          desc="Rentas y servicios" 
          icon={<Store size={16} className="text-zinc-500 dark:text-zinc-400" />}
        />
        <SummaryCard 
          title="Otros Egresos" 
          value={`$${otrosGastos.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`} 
          desc="Caja chica y variables" 
          icon={<Activity size={16} className="text-zinc-500 dark:text-zinc-400" />}
        />
      </div>

      {/* 3. Listado de Egresos */}
      <ExpenseList 
        gastos={gastos.map(g => ({ ...g, monto: Number(g.monto) })) as any} 
      />
    </div>
  );
}

function SummaryCard({ 
  title, 
  value, 
  desc, 
  icon,
  featured = false,
}: { 
  title: string; 
  value: string; 
  desc: string; 
  icon: React.ReactNode;
  featured?: boolean;
}) {
  return (
    <div className={`p-4 sm:p-5 rounded-2xl border shadow-xs transition-all flex flex-col justify-between min-h-[6.5rem] sm:min-h-[7.5rem] ${
      featured 
        ? "bg-zinc-900 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-800 text-white" 
        : "bg-white dark:bg-zinc-950 border-zinc-200/80 dark:border-zinc-800 text-zinc-900 dark:text-white"
    }`}>
      <div className="flex justify-between items-center mb-1.5">
        <span className={`text-[10px] font-bold uppercase tracking-wider ${
          featured ? "text-zinc-400" : "text-zinc-500 dark:text-zinc-400"
        }`}>
          {title}
        </span>
        <div className={`p-1.5 rounded-lg ${
          featured ? "bg-zinc-800 text-white" : "bg-zinc-100 dark:bg-zinc-900"
        }`}>
          {icon}
        </div>
      </div>
      <div>
        <h3 className="text-xl sm:text-2xl font-mono font-bold tracking-tight truncate">
          {value}
        </h3>
        <p className={`text-[10px] font-mono mt-0.5 truncate ${
          featured ? "text-zinc-400" : "text-zinc-400 dark:text-zinc-500"
        }`}>
          {desc}
        </p>
      </div>
    </div>
  );
}
