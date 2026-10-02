import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventory, getBranches } from "./queries";
import { InventoryClient } from "./InventoryClient";

export const metadata = {
  title: "Inventario de Stock - ShopLI",
};

export default async function InventoryPage({
  searchParams,
}: {
  searchParams: Promise<{ branch?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { branch: branchId } = await searchParams;
  const branches = await getBranches();
  const rawProducts = await getInventory(branchId);
  const products = rawProducts.sort((a, b) => a.totalStock - b.totalStock);

  const totalInventoryValue = products.reduce((acc, p) => {
    return p.totalStock > 0 ? acc + p.totalStock * Number(p.costo) : acc;
  }, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Header Compacto (Estilo Catálogo) con Monto Protagonista */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-xs">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Inventario de Stock
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {products.length}
            </span>
          </div>
          <p className="hidden md:block text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Control de existencias y movimientos de almacén.
          </p>
        </div>

        {/* Monto Total Protagonista (Integrado sin ser card) */}
        <div className="flex flex-col sm:items-end">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
            Valor de Almacén
          </span>
          <span className="text-xl sm:text-2xl md:text-3xl font-mono font-black tabular-nums tracking-tight text-zinc-900 dark:text-white">
            ${totalInventoryValue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      {/* Vista de Cliente Reactiva */}
      <InventoryClient
        products={products}
        branches={branches}
        selectedBranchId={branchId}
      />
    </div>
  );
}
