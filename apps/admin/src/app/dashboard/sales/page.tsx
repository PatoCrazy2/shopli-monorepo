import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSales, getSucursales } from "./queries";
import { SaleRow } from "./_components/sale-row";
import { SalesCommandBar } from "./_components/sales-command-bar";
import Link from "next/link";
import { Receipt, Store } from "lucide-react";

export const dynamic = "force-dynamic";

function getTodayMexicoCity(): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Mexico_City",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = parts.find((p) => p.type === "year")?.value;
  const month = parts.find((p) => p.type === "month")?.value;
  const day = parts.find((p) => p.type === "day")?.value;

  if (year && month && day) {
    return `${year}-${month}-${day}`;
  }

  const now = new Date();
  const cdmxDate = new Date(now.getTime() - 6 * 60 * 60 * 1000);
  const y = cdmxDate.getUTCFullYear();
  const m = String(cdmxDate.getUTCMonth() + 1).padStart(2, "0");
  const d = String(cdmxDate.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export default async function SalesPage({
  searchParams,
}: {
  searchParams: Promise<{ SUCURSAL?: string; date?: string; page?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) redirect("/login");
  if (session.user.role !== "DUENO" && session.user.role !== "ENCARGADO") {
    redirect("/dashboard");
  }

  const sp = await searchParams;
  const rawSucursalId = sp.SUCURSAL;
  const dateStr = sp.date?.trim() || getTodayMexicoCity();
  const page = Math.max(1, sp.page ? parseInt(sp.page, 10) || 1 : 1);

  const sucursales = await getSucursales();

  const validSucursal = sucursales.find(s => s.id === rawSucursalId);
  // Opción C sin redirect: Si solo existe 1 sucursal, se usa directamente como fallback
  const sucursalId = validSucursal
    ? validSucursal.id
    : (!rawSucursalId && sucursales.length === 1 ? sucursales[0].id : undefined);

  const { ventas, total, pageSize } = sucursalId
    ? await getSales({ sucursalId, dateStr, page })
    : { ventas: [], total: 0, pageSize: 50 };

  const totalVentas = ventas.reduce((acc, v) => acc + Number(v.total), 0);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(date);
  };

  return (
    <div className="space-y-4 md:space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header & CommandBar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-1">
          <h1 className="text-2xl md:text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Ventas</h1>
          <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Historial detallado de todas las transacciones generadas en los turnos.
          </p>
        </div>

        <SalesCommandBar
          sucursales={sucursales}
          currentSucursalId={sucursalId}
          currentDate={dateStr}
        />
      </div>

      {sucursalId && (
        <div className="flex items-center justify-between px-1 gap-2">
          <div className="min-w-0">
            <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-zinc-800 dark:text-zinc-200 truncate block">
              {sucursales.find(s => s.id === sucursalId)?.nombre || 'Desconocida'}
            </span>
            <p className="text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 font-medium truncate">
              {total} {total === 1 ? 'transacción' : 'transacciones registradas'}
            </p>
          </div>

          <div className="text-right shrink-0">
            <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500 block">
              Total (Página)
            </span>
            <span className="text-xl sm:text-3xl font-black tracking-tight text-zinc-900 dark:text-white font-mono tabular-nums">
              ${totalVentas.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      <div className="border border-zinc-200 dark:border-zinc-800 rounded-2xl bg-white dark:bg-zinc-950 shadow-sm overflow-hidden flex flex-col">
        {!sucursalId ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 text-center">
            <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <Store className="w-6 h-6 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              Selecciona una sucursal
            </h2>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 font-medium leading-relaxed">
              Para visualizar el historial de ventas y métricas acumuladas, primero debes elegir una sucursal operativa.
            </p>
          </div>
        ) : ventas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 md:py-24 px-6 text-center">
            <div className="w-14 h-14 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl flex items-center justify-center mb-4 shadow-xs">
              <Receipt className="w-6 h-6 text-zinc-900 dark:text-zinc-100" strokeWidth={1.5} />
            </div>
            <h3 className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white tracking-tight">
              No hay ventas en esta fecha
            </h3>
            <p className="text-xs md:text-sm text-zinc-500 dark:text-zinc-400 max-w-sm mt-1.5 font-medium">
              No se encontraron transacciones para la sucursal y fecha seleccionadas.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
            {ventas.map(venta => (
              <SaleRow
                key={venta.id}
                venta={venta}
                formattedDate={formatDate(venta.fecha)}
              />
            ))}
          </div>
        )}

        {sucursalId && total > 0 && (
          <div className="flex items-center justify-between px-3 sm:px-4 py-2.5 sm:py-3 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800 gap-2">
            <p className="text-[11px] sm:text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              <span className="sm:hidden">Pág. {page}/{Math.max(1, Math.ceil(total / pageSize))}</span>
              <span className="hidden sm:inline">{total} transacciones · Página {page} de {Math.max(1, Math.ceil(total / pageSize))}</span>
            </p>
            <div className="flex items-center gap-1.5 sm:gap-2">
              {page > 1 ? (
                <Link
                  href={`?SUCURSAL=${sucursalId}${dateStr ? `&date=${dateStr}` : ""}&page=${page - 1}`}
                  className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900 text-zinc-900 dark:text-white transition-colors"
                >
                  ← Ant.
                </Link>
              ) : (
                <span className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-zinc-100 dark:border-zinc-800/60 text-zinc-300 dark:text-zinc-700 cursor-not-allowed select-none">
                  ← Ant.
                </span>
              )}
              {page * pageSize < total ? (
                <Link
                  href={`?SUCURSAL=${sucursalId}${dateStr ? `&date=${dateStr}` : ""}&page=${page + 1}`}
                  className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg bg-black text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 transition-colors"
                >
                  Sig. →
                </Link>
              ) : (
                <span className="px-2.5 sm:px-3 py-1 text-xs sm:text-sm font-semibold rounded-lg border border-zinc-100 dark:border-zinc-800/60 text-zinc-300 dark:text-zinc-700 cursor-not-allowed select-none">
                  Sig. →
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
