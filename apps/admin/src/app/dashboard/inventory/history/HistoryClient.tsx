"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, X, ArrowDownRight, ArrowUpRight, ArrowLeftRight, Clock, User, Store, Loader2 } from "lucide-react";
import { getInventoryHistory, type HistoryMovementItem } from "./queries";
import { BranchFilter } from "../BranchFilter";
import type { BranchItem } from "../InventoryClient";

interface HistoryClientProps {
  initialMovements: HistoryMovementItem[];
  branches: BranchItem[];
  selectedBranchId?: string;
}

export function HistoryClient({
  initialMovements,
  branches,
  selectedBranchId,
}: HistoryClientProps) {
  const [movements, setMovements] = useState<HistoryMovementItem[]>(initialMovements);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(initialMovements.length >= 100);

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"ALL" | "IN" | "OUT" | "TRANSFER">("ALL");
  const [selectedPeriod, setSelectedPeriod] = useState<"ALL" | "TODAY" | "YESTERDAY" | "LAST_7_DAYS">("ALL");

  useEffect(() => {
    setMovements(initialMovements);
    setHasMore(initialMovements.length >= 100);
  }, [initialMovements]);

  const handleLoadMore = async () => {
    if (isLoadingMore || movements.length === 0) return;
    setIsLoadingMore(true);
    try {
      const lastMovement = movements[movements.length - 1];
      const nextBatch = await getInventoryHistory({
        branchId: selectedBranchId,
        cursor: lastMovement.id,
        limit: 100,
      });

      if (nextBatch.length < 100) {
        setHasMore(false);
      }
      setMovements((prev) => [...prev, ...nextBatch]);
    } catch (error) {
      console.error("Error al cargar más movimientos:", error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Filtrado instantáneo en memoria
  const filteredMovements = useMemo(() => {
    return movements.filter((m) => {
      // 1. Filtro por Sucursal (si está seleccionada en URL/props)
      if (selectedBranchId && m.sucursal_id !== selectedBranchId) {
        return false;
      }

      // 2. Filtro por Tipo
      if (selectedType === "IN") {
        if (m.tipo !== "INGRESO" && m.tipo !== "TRANSFERENCIA_ENTRADA") return false;
      } else if (selectedType === "OUT") {
        if (m.tipo !== "EGRESO" && m.tipo !== "AJUSTE" && m.tipo !== "TRANSFERENCIA_SALIDA") return false;
      } else if (selectedType === "TRANSFER") {
        if (m.tipo !== "TRANSFERENCIA_ENTRADA" && m.tipo !== "TRANSFERENCIA_SALIDA") return false;
      }

      // 3. Filtro por Período
      if (selectedPeriod !== "ALL") {
        const moveDate = new Date(m.fecha);
        const now = new Date();

        if (selectedPeriod === "TODAY") {
          const isToday =
            moveDate.getFullYear() === now.getFullYear() &&
            moveDate.getMonth() === now.getMonth() &&
            moveDate.getDate() === now.getDate();
          if (!isToday) return false;
        } else if (selectedPeriod === "YESTERDAY") {
          const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
          const isYesterday =
            moveDate.getFullYear() === yesterday.getFullYear() &&
            moveDate.getMonth() === yesterday.getMonth() &&
            moveDate.getDate() === yesterday.getDate();
          if (!isYesterday) return false;
        } else if (selectedPeriod === "LAST_7_DAYS") {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          if (moveDate < sevenDaysAgo) return false;
        }
      }

      // 4. Filtro por Búsqueda (Nombre de producto, SKU o motivo)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = m.producto.nombre.toLowerCase().includes(q);
        const skuMatch = m.producto.codigo_interno?.toLowerCase().includes(q) ?? false;
        const reasonMatch = m.motivo?.toLowerCase().includes(q) ?? false;
        const userMatch = m.usuario.name?.toLowerCase().includes(q) ?? false;

        if (!nameMatch && !skuMatch && !reasonMatch && !userMatch) {
          return false;
        }
      }

      return true;
    });
  }, [movements, selectedBranchId, selectedType, selectedPeriod, searchQuery]);

  // Resumen métrico del período filtrado
  const stats = useMemo(() => {
    let totalIn = 0;
    let totalOut = 0;
    let transferCount = 0;

    for (const m of filteredMovements) {
      if (m.tipo === "INGRESO" || m.tipo === "TRANSFERENCIA_ENTRADA") {
        totalIn += Math.abs(m.cantidad);
      } else if (m.tipo === "EGRESO" || m.tipo === "AJUSTE" || m.tipo === "TRANSFERENCIA_SALIDA") {
        totalOut += Math.abs(m.cantidad);
      }
      if (m.tipo === "TRANSFERENCIA_ENTRADA" || m.tipo === "TRANSFERENCIA_SALIDA") {
        transferCount += 1;
      }
    }

    return { totalIn, totalOut, transferCount, totalMovements: filteredMovements.length };
  }, [filteredMovements]);

  const isFiltering = searchQuery.trim() !== "" || selectedType !== "ALL" || selectedPeriod !== "ALL";

  return (
    <div className="space-y-4">
      {/* 1. Barra de Controles y Filtros */}
      <div className="bg-white dark:bg-zinc-950 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs space-y-3">
        {/* Fila Superior: Buscador y Selector de Sucursal */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar por producto, SKU, motivo o usuario..."
              className="w-full h-10 pl-9 pr-9 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-all"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="w-full sm:w-[260px] shrink-0">
            <BranchFilter branches={branches} />
          </div>
        </div>

        {/* Vista Móvil: Filtros como Selects (sm:hidden) */}
        <div className="grid grid-cols-2 gap-2 sm:hidden pt-2 border-t border-zinc-100 dark:border-zinc-850 text-xs">
          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Período
            </label>
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value as any)}
              className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
            >
              <option value="ALL">Todo el tiempo</option>
              <option value="TODAY">Hoy</option>
              <option value="YESTERDAY">Ayer</option>
              <option value="LAST_7_DAYS">Últimos 7 días</option>
            </select>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 block">
              Tipo
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value as any)}
              className="w-full h-8 px-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-xs font-medium text-zinc-900 dark:text-zinc-100 focus:outline-hidden focus:ring-1 focus:ring-zinc-900 dark:focus:ring-zinc-100 transition-colors"
            >
              <option value="ALL">Todos los tipos</option>
              <option value="IN">+ Entradas</option>
              <option value="OUT">- Salidas</option>
              <option value="TRANSFER">⇄ Transferencias</option>
            </select>
          </div>
        </div>

        {/* Vista Desktop: Píldoras de Filtro (hidden sm:flex) */}
        <div className="hidden sm:flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-850 text-xs">
          {/* Selector de Período (Día / Rango) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
              Período:
            </span>
            <button
              type="button"
              onClick={() => setSelectedPeriod("ALL")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Todo
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod("TODAY")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === "TODAY"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod("YESTERDAY")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === "YESTERDAY"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Ayer
            </button>
            <button
              type="button"
              onClick={() => setSelectedPeriod("LAST_7_DAYS")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedPeriod === "LAST_7_DAYS"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Últimos 7 días
            </button>
          </div>

          {/* Selector de Tipo (Entradas / Salidas / Transferencias) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mr-1">
              Tipo:
            </span>
            <button
              type="button"
              onClick={() => setSelectedType("ALL")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === "ALL"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              Todos
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("IN")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === "IN"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              + Entradas
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("OUT")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === "OUT"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              - Salidas
            </button>
            <button
              type="button"
              onClick={() => setSelectedType("TRANSFER")}
              className={`h-7 px-2.5 rounded-lg text-xs font-medium transition-all ${
                selectedType === "TRANSFER"
                  ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-2xs"
                  : "bg-zinc-100 dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200 dark:hover:bg-zinc-800"
              }`}
            >
              ⇄ Transferencias
            </button>
          </div>
        </div>
      </div>

      {/* 2. Barra de Resumen Métrico de la Bitácora */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Movimientos
          </span>
          <span className="text-xl font-mono font-black tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            {stats.totalMovements}
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Total Entradas
          </span>
          <span className="text-xl font-mono font-black tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            +{stats.totalIn} <span className="text-xs font-normal text-zinc-400 font-sans">u.</span>
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Total Salidas
          </span>
          <span className="text-xl font-mono font-black tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            -{stats.totalOut} <span className="text-xs font-normal text-zinc-400 font-sans">u.</span>
          </span>
        </div>

        <div className="bg-white dark:bg-zinc-950 p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider block">
            Transferencias
          </span>
          <span className="text-xl font-mono font-black tabular-nums tracking-tight text-zinc-900 dark:text-zinc-100">
            {stats.transferCount}
          </span>
        </div>
      </div>

      {/* 3. Vista Móvil: Tarjetas Cronológicas de Movimiento (md:hidden) */}
      <div className="md:hidden space-y-2.5">
        {filteredMovements.length === 0 ? (
          <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-8 text-center text-zinc-500 shadow-xs">
            <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
              No se encontraron movimientos
            </p>
            <p className="text-xs text-zinc-400 mt-1">
              Prueba cambiando la fecha, tipo o término de búsqueda.
            </p>
            {isFiltering && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSelectedType("ALL");
                  setSelectedPeriod("ALL");
                }}
                className="mt-3 inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-xs"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        ) : (
          filteredMovements.map((m) => {
            const isIngreso = m.tipo === "INGRESO" || m.tipo === "TRANSFERENCIA_ENTRADA";
            const dateObj = new Date(m.fecha);

            return (
              <div
                key={m.id}
                className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-xs space-y-2"
              >
                {/* Cabecera de la card: Producto, SKU y Cantidad */}
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-0.5 flex-1">
                    <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 leading-tight">
                      {m.producto.nombre}
                    </h3>
                    <p className="font-mono tabular-nums tracking-tight text-[11px] text-zinc-400">
                      {m.producto.codigo_interno ? `SKU: ${m.producto.codigo_interno}` : "Sin SKU"}
                    </p>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`font-mono tabular-nums tracking-tight font-black text-base ${
                        isIngreso
                          ? "text-zinc-900 dark:text-zinc-100"
                          : "text-zinc-500 dark:text-zinc-400 line-through"
                      }`}
                    >
                      {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                    </span>
                    <span className="block text-[10px] text-zinc-400 uppercase font-semibold">
                      unidades
                    </span>
                  </div>
                </div>

                {/* Badge de tipo y Detalle de fecha */}
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-100 dark:border-zinc-850">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider ${
                        isIngreso
                          ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                      }`}
                    >
                      {isIngreso ? (
                        <ArrowDownRight className="w-3 h-3" />
                      ) : (
                        <ArrowUpRight className="w-3 h-3" />
                      )}
                      <span>{m.tipo.replace(/_/g, " ")}</span>
                    </span>

                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">
                      {m.motivo || "Sin motivo"}
                    </span>
                  </div>

                  <div className="text-[11px] font-mono tabular-nums tracking-tight text-zinc-400">
                    {dateObj.toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}{" "}
                    {dateObj.toLocaleTimeString("es-MX", { hour: "2-digit", minute: "2-digit" })}
                  </div>
                </div>

                {/* Footer de la card: Sucursal y Operador */}
                <div className="flex items-center justify-between text-[11px] text-zinc-400 pt-1 border-t border-zinc-100 dark:border-zinc-850">
                  <span className="inline-flex items-center gap-1">
                    <Store className="w-3 h-3" />
                    <span>{m.sucursal.nombre}</span>
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <User className="w-3 h-3" />
                    <span>{m.usuario.name || "Sistema"}</span>
                  </span>
                </div>
              </div>
            );
          })
        )}

        {/* Botón Cargar Más en Móvil */}
        {hasMore && (
          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="w-full h-10 inline-flex items-center justify-center gap-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-500" />
                  <span>Cargando movimientos antiguos...</span>
                </>
              ) : (
                <span>Cargar más movimientos antiguos</span>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 4. Vista Desktop: Tabla Monocromática de Movimientos (hidden md:block) */}
      <div className="hidden md:block bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 dark:text-zinc-400 uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                <th className="px-4 py-3 w-36">Fecha / Hora</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3 text-center w-32">Tipo</th>
                <th className="px-4 py-3 text-right w-24">Cantidad</th>
                <th className="px-4 py-3 w-32">Sucursal</th>
                <th className="px-4 py-3">Motivo / Auditoría</th>
                <th className="px-4 py-3 w-28 text-right">Registrado Por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
              {filteredMovements.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-zinc-500">
                    <div className="space-y-2">
                      <p className="font-semibold text-sm text-zinc-800 dark:text-zinc-200">
                        No hay movimientos registrados
                      </p>
                      <p className="text-xs text-zinc-400">
                        {isFiltering
                          ? "No se encontraron coincidencias para los filtros seleccionados."
                          : "Aún no se han generado entradas o salidas de inventario."}
                      </p>
                      {isFiltering && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedType("ALL");
                            setSelectedPeriod("ALL");
                          }}
                          className="mt-2 inline-flex items-center px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-850 transition-colors shadow-xs"
                        >
                          Limpiar filtros
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                filteredMovements.map((m) => {
                  const isIngreso = m.tipo === "INGRESO" || m.tipo === "TRANSFERENCIA_ENTRADA";
                  const dateObj = new Date(m.fecha);

                  return (
                    <tr
                      key={m.id}
                      className="hover:bg-zinc-50/80 dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-4 py-3 whitespace-nowrap font-mono tabular-nums tracking-tight text-zinc-500 dark:text-zinc-400">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                          {dateObj.toLocaleDateString("es-MX", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </span>{" "}
                        <span className="text-[11px] text-zinc-400">
                          {dateObj.toLocaleTimeString("es-MX", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>

                      <td className="px-4 py-3">
                        <span className="font-bold text-zinc-900 dark:text-zinc-100 block">
                          {m.producto.nombre}
                        </span>
                        <span className="font-mono tabular-nums tracking-tight text-[11px] text-zinc-400">
                          {m.producto.codigo_interno || "—"}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                            isIngreso
                              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                              : "bg-zinc-100 text-zinc-700 dark:bg-zinc-850 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700"
                          }`}
                        >
                          {isIngreso ? (
                            <ArrowDownRight className="w-3 h-3" />
                          ) : (
                            <ArrowUpRight className="w-3 h-3" />
                          )}
                          <span>{m.tipo.replace(/_/g, " ")}</span>
                        </span>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <span
                          className={`font-mono tabular-nums tracking-tight font-black text-xs ${
                            isIngreso
                              ? "text-zinc-900 dark:text-zinc-100"
                              : "text-zinc-500 dark:text-zinc-400"
                          }`}
                        >
                          {m.cantidad > 0 ? `+${m.cantidad}` : m.cantidad}
                        </span>
                      </td>

                      <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 truncate max-w-[130px]" title={m.sucursal.nombre}>
                        {m.sucursal.nombre}
                      </td>

                      <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400 italic text-[11px]">
                        {m.motivo || "—"}
                      </td>

                      <td className="px-4 py-3 text-right text-zinc-500 dark:text-zinc-400 text-[11px] font-medium truncate max-w-[120px]" title={m.usuario.name || "Sistema"}>
                        {m.usuario.name || "Sistema"}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de la Tabla */}
        <div className="bg-zinc-50 dark:bg-zinc-900/60 border-t border-zinc-200 dark:border-zinc-800 px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400 flex items-center justify-between">
          <p>
            Mostrando{" "}
            <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-700 dark:text-zinc-300">
              {filteredMovements.length}
            </span>{" "}
            movimientos cargados
          </p>

          {hasMore && (
            <button
              type="button"
              onClick={handleLoadMore}
              disabled={isLoadingMore}
              className="inline-flex items-center justify-center gap-2 h-8 px-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-850 hover:text-zinc-900 dark:hover:text-zinc-100 disabled:opacity-50 transition-colors shadow-2xs cursor-pointer"
            >
              {isLoadingMore ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-500" />
                  <span>Cargando...</span>
                </>
              ) : (
                <span>Cargar más antiguos</span>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
