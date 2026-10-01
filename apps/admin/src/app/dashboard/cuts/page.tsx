import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getCuts } from "./queries";
import { getSucursales } from "../branches/queries";
import Link from "next/link";
import CutsAutoRefresh from "./CutsAutoRefresh";
import ForceCloseButton from "./ForceCloseButton";
import CutsFilters from "./CutsFilters";
import ExpensesDetailsDrawer from "./ExpensesDetailsDrawer";
import AuditDetailsDrawer from "./AuditDetailsDrawer";

export default async function CutsPage({
  searchParams,
}: {
  searchParams: Promise<{ sucursal?: string; date?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const params = await searchParams;
  const sucursalId = params.sucursal;
  const date = params.date; // Remove default to today

  const [turnos, sucursales] = await Promise.all([
    getCuts(sucursalId, date),
    getSucursales()
  ]);

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "America/Mexico_City"
    }).format(date);
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-20">
      <CutsAutoRefresh />
      {/* Header & Filters */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-0.5">
          <h1 className="text-xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
            Cortes de Caja
          </h1>
          <p className="hidden md:block text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Auditoría de ingresos y conciliación de inventario.
          </p>
        </div>

        <CutsFilters
          sucursales={sucursales}
          currentSucursal={sucursalId}
          currentDate={date}
        />
      </div>

      <div className="flex flex-col gap-6">
        {turnos.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-24 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/10 rounded-full flex items-center justify-center mb-6 ring-1 ring-amber-100 dark:ring-amber-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" /></svg>
            </div>
            <h2 className="text-2xl font-black text-zinc-900 dark:text-white tracking-tight">
              {date ? "Sin registros para esta fecha" : "Sin cortes registrados"}
            </h2>
            <p className="text-zinc-500 max-w-xs mt-2 font-medium">
              {date 
                ? "No se encontraron turnos abiertos o cerrados para el día indicado."
                : "Aún no se han generado cortes de caja en el sistema."}
            </p>
          </div>
        ) : (
          turnos.map(turno => {
            const ventasSistema = turno.ventas.reduce((acc, v) => acc + Number(v.total), 0);
            const totalGastos = (turno as any).gastos ? (turno as any).gastos.reduce((acc: number, g: any) => acc + Number(g.monto), 0) : 0;
            const sistema = ventasSistema + Number(turno.monto_inicial) - totalGastos;
            const reportado = turno.monto_final ? Number(turno.monto_final) : 0;
            const diferencia = reportado - sistema;
            const isClosed = turno.estado === "CERRADO";
            const isBalanced = Math.abs(diferencia) < 0.01;

            return (
              <div
                key={turno.id}
                className="group bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl md:rounded-3xl p-4 sm:p-5 md:p-8 shadow-xs md:shadow-sm transition-all hover:shadow-md md:hover:shadow-xl relative overflow-hidden"
              >
                {/* Status Indicator Bar */}
                <div
                  className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                    !isClosed ? "bg-amber-400" : isBalanced ? "bg-emerald-500" : "bg-rose-500"
                  }`}
                />

                {/* Card Header: Cajero + Sucursal + Estado + Fechas */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 md:mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl md:rounded-2xl bg-zinc-900 text-white flex items-center justify-center text-sm md:text-lg font-black shadow-xs shrink-0">
                      {(turno.usuario.name || "U")[0]}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-black text-base md:text-xl text-zinc-900 dark:text-white tracking-tight truncate">
                          {turno.usuario.name || "Cajero Desconocido"}
                        </h3>
                        <span
                          className={`px-2.5 py-0.5 text-[9px] md:text-[10px] font-black tracking-wider uppercase rounded-full border shadow-xs shrink-0 ${
                            isClosed
                              ? "bg-zinc-100 text-zinc-600 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700"
                              : "bg-amber-50 text-amber-700 border-amber-200 animate-pulse"
                          }`}
                        >
                          {turno.estado}
                        </span>
                        {!isClosed &&
                          (session.user.role === "DUENO" || session.user.role === "ENCARGADO") && (
                            <ForceCloseButton turnoId={turno.id} />
                          )}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400 mt-0.5 uppercase tracking-tight">
                        <span>{turno.sucursal.nombre}</span>
                        <span className="opacity-30">•</span>
                        <span className="font-mono text-zinc-400">#{turno.id.slice(-6)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Horario de Apertura y Cierre */}
                  <div className="flex items-center gap-2 py-1 px-2.5 bg-zinc-50 dark:bg-zinc-900/80 rounded-lg md:rounded-xl border border-zinc-100 dark:border-zinc-800 text-xs w-fit">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="13"
                      height="13"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-zinc-400 shrink-0"
                    >
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    <span suppressHydrationWarning className="font-semibold text-zinc-600 dark:text-zinc-300 text-[11px] md:text-xs">
                      {formatDate(turno.fecha_apertura)}
                    </span>
                    {turno.fecha_cierre && (
                      <>
                        <span className="text-zinc-300">→</span>
                        <span suppressHydrationWarning className="font-semibold text-zinc-600 dark:text-zinc-300 text-[11px] md:text-xs">
                          {formatDate(turno.fecha_cierre!)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Métricas Financieras: Grid 2x2 denso en móvil, 4 columnas en desktop */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3.5 pt-3 border-t border-zinc-100 dark:border-zinc-900">
                  {/* 1. Fondo Inicial */}
                  <div className="flex flex-col justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Fondo Inicial
                    </span>
                    <span className="text-base md:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mt-1">
                      ${Number(turno.monto_inicial).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium mt-0.5">Apertura</span>
                  </div>

                  {/* 2. Calculado Sistema */}
                  <div className="flex flex-col justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-900 text-white dark:bg-zinc-800 border border-zinc-900 dark:border-zinc-700 shadow-xs">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Sistema
                    </span>
                    <span className="text-base md:text-2xl font-black text-white tracking-tight mt-1">
                      ${sistema.toFixed(2)}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium mt-0.5 truncate">
                      Ventas: ${ventasSistema.toFixed(2)}
                    </span>
                  </div>

                  {/* 3. Reportado Físico */}
                  <div className="flex flex-col justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-50 dark:bg-zinc-900/60 border border-zinc-100 dark:border-zinc-800/80">
                    <span className="text-[9px] md:text-[10px] font-black uppercase tracking-wider text-zinc-400">
                      Reportado
                    </span>
                    <span
                      className={`text-base md:text-2xl font-black tracking-tight mt-1 ${
                        !isClosed ? "text-zinc-400" : "text-zinc-900 dark:text-white"
                      }`}
                    >
                      ${isClosed ? reportado.toFixed(2) : "--.--"}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium mt-0.5">
                      {isClosed ? "Conteo físico" : "En curso"}
                    </span>
                  </div>

                  {/* 4. Diferencia */}
                  <div
                    className={`flex flex-col justify-between p-3 md:p-4 rounded-xl md:rounded-2xl border transition-colors ${
                      !isClosed
                        ? "bg-zinc-50 dark:bg-zinc-900/60 border-zinc-100 dark:border-zinc-800/80"
                        : isBalanced
                        ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50"
                        : "bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50"
                    }`}
                  >
                    <span
                      className={`text-[9px] md:text-[10px] font-black uppercase tracking-wider ${
                        !isClosed
                          ? "text-zinc-400"
                          : isBalanced
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      Diferencia
                    </span>
                    <span
                      className={`text-base md:text-2xl font-black tracking-tight mt-1 ${
                        !isClosed
                          ? "text-zinc-400"
                          : isBalanced
                          ? "text-emerald-700 dark:text-emerald-400"
                          : "text-rose-700 dark:text-rose-400"
                      }`}
                    >
                      {!isClosed
                        ? "--.--"
                        : `${diferencia > 0 ? "+" : ""}${isBalanced ? "0.00" : diferencia.toFixed(2)}`}
                    </span>
                    <span
                      className={`text-[10px] font-bold mt-0.5 truncate ${
                        !isClosed
                          ? "text-zinc-400"
                          : isBalanced
                          ? "text-emerald-700/80 dark:text-emerald-400/80"
                          : "text-rose-700/80 dark:text-rose-400/80"
                      }`}
                    >
                      {!isClosed
                        ? "Al cierre"
                        : isBalanced
                        ? "Cuadrada"
                        : diferencia > 0
                        ? "Sobrante"
                        : "Faltante"}
                    </span>
                  </div>
                </div>

                {/* Footer de Tarjeta: Divulgación Progresiva para Gastos y Auditoría */}
                {(((turno as any).gastos && (turno as any).gastos.length > 0) ||
                  (turno.auditorias && turno.auditorias.length > 0)) && (
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 mt-3 border-t border-zinc-100 dark:border-zinc-900">
                    <ExpensesDetailsDrawer
                      gastos={(turno as any).gastos || []}
                      totalGastos={totalGastos}
                    />
                    <AuditDetailsDrawer
                      auditorias={turno.auditorias || []}
                      sucursalId={turno.sucursal_id}
                    />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
