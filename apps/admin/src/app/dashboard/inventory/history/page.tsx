import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventoryHistory } from "./queries";
import { getBranches } from "../queries";
import { HistoryClient } from "./HistoryClient";
import Link from "next/link";
import { ArrowLeft, Clock } from "lucide-react";

export const metadata = {
  title: "Bitácora de Movimientos - ShopLI",
};

export default async function InventoryHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { branch: branchId } = await searchParams;
  const [history, branches] = await Promise.all([
    getInventoryHistory({ branchId, limit: 150 }),
    getBranches(),
  ]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Estilo Catálogo / ShopLI Monocromático */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-zinc-400 dark:text-zinc-500 text-xs">
            <Link
              href="/dashboard/inventory"
              className="inline-flex items-center gap-1 font-semibold text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Inventario</span>
            </Link>
            <span>/</span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">Bitácora Global</span>
          </div>

          <div className="flex items-center gap-2.5 pt-0.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Bitácora de Movimientos
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              <Clock className="w-3 h-3 text-zinc-400" />
              <span>{history.length}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 font-medium">
            Registro cronológico y auditoría de entradas, salidas y transferencias por fecha y turno.
          </p>
        </div>

        {/* Acceso Rápido al Inventario */}
        <div>
          <Link
            href="/dashboard/inventory"
            className="inline-flex items-center justify-center gap-1.5 h-9 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Volver al Inventario</span>
          </Link>
        </div>
      </div>

      {/* Cliente Interactivo de la Bitácora */}
      <HistoryClient
        initialMovements={history}
        branches={branches}
        selectedBranchId={branchId}
      />
    </div>
  );
}
