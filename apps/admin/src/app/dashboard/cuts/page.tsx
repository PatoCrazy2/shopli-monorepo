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
                className="group bg-white dark:bg-zinc-950 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-xs transition-all hover:border-zinc-300 dark:hover:border-zinc-700 relative overflow-hidden"
              >
                {/* 1. Header de Tarjeta: Barra Negra Completa de Borde a Borde */}
                <div className="bg-zinc-950 dark:bg-zinc-900 text-white px-4 sm:px-5 py-2.5 flex items-center justify-between gap-3 border-b border-zinc-900 dark:border-zinc-800">
                  <h3 className="font-bold text-sm sm:text-base tracking-tight truncate">
                    {turno.usuario.name || "Cajero Desconocido"}
                  </h3>

                  <div className="flex items-center gap-2 shrink-0">
                    {!isClosed &&
                      (session.user.role === "DUENO" || session.user.role === "ENCARGADO") && (
                        <ForceCloseButton turnoId={turno.id} />
                      )}
                    <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          !isClosed
                            ? "bg-amber-400 animate-pulse"
                            : isBalanced
                            ? "bg-emerald-400"
                            : "bg-rose-400"
                        }`}
                      />
                      <span
                        className={
                          !isClosed
                            ? "text-amber-300 font-semibold"
                            : "text-zinc-400"
                        }
                      >
                        {turno.estado === "CERRADO" ? "Cerrado" : turno.estado}
                      </span>
                    </span>
                  </div>
                </div>

                {/* Contenido interior de la Tarjeta */}
                <div className="p-4 sm:p-5">
                  {/* 2. Metadata Secundaria: Sucursal · Fecha · Fondo */}
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400 mb-3.5 flex-wrap">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                      {turno.sucursal.nombre}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span suppressHydrationWarning>
                      {formatDate(turno.fecha_apertura)}
                      {turno.fecha_cierre && ` → ${formatDate(turno.fecha_cierre)}`}
                    </span>
                    <span className="text-zinc-300 dark:text-zinc-700">·</span>
                    <span>
                      Fondo:{" "}
                      <strong className="font-mono text-zinc-700 dark:text-zinc-300">
                        ${Number(turno.monto_inicial).toFixed(2)}
                      </strong>
                    </span>
                  </div>

                {/* 3. Resumen Financiero: 3 Columnas perfectamente centradas en móvil */}
                <div className="grid grid-cols-3 gap-1 sm:gap-4 py-1 text-center sm:text-left">
                  {/* Sistema */}
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Sistema
                    </span>
                    <span className="text-sm sm:text-lg font-bold font-mono text-zinc-900 dark:text-zinc-100 tracking-tight mt-0.5">
                      ${sistema.toFixed(2)}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-full">
                      Ventas: ${ventasSistema.toFixed(2)}
                    </span>
                  </div>

                  {/* Reportado */}
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Reportado
                    </span>
                    <span
                      className={`text-sm sm:text-lg font-bold font-mono tracking-tight mt-0.5 ${
                        !isClosed ? "text-zinc-400" : "text-zinc-900 dark:text-zinc-100"
                      }`}
                    >
                      ${isClosed ? reportado.toFixed(2) : "--.--"}
                    </span>
                    <span className="text-[10px] sm:text-[11px] text-zinc-400 dark:text-zinc-500 mt-0.5 truncate max-w-full">
                      {isClosed ? "Conteo físico" : "En curso"}
                    </span>
                  </div>

                  {/* Diferencia */}
                  <div className="flex flex-col items-center sm:items-start">
                    <span className="text-[11px] sm:text-xs font-medium text-zinc-500 dark:text-zinc-400">
                      Diferencia
                    </span>
                    <span
                      className={`text-sm sm:text-lg font-bold font-mono tracking-tight mt-0.5 ${
                        !isClosed
                          ? "text-zinc-400"
                          : isBalanced
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-rose-600 dark:text-rose-400"
                      }`}
                    >
                      {!isClosed
                        ? "--.--"
                        : `${diferencia > 0 ? "+" : ""}${isBalanced ? "0.00" : diferencia.toFixed(2)}`}
                    </span>
                    <span
                      className={`text-[10px] sm:text-[11px] font-medium mt-0.5 truncate max-w-full ${
                        !isClosed
                          ? "text-zinc-400"
                          : isBalanced
                          ? "text-emerald-600/90 dark:text-emerald-400/90"
                          : "text-rose-600/90 dark:text-rose-400/90"
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
                </div>

                {/* Footer de Tarjeta: Franja de Borde a Borde con Fondo Gris Visible */}
                {(((turno as any).gastos && (turno as any).gastos.length > 0) ||
                  (turno.auditorias && turno.auditorias.length > 0)) && (
                  <div className="bg-zinc-100/90 dark:bg-zinc-900 border-t border-zinc-200/80 dark:border-zinc-800 px-4 sm:px-5 py-2.5 flex flex-wrap items-center justify-between gap-3">
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
