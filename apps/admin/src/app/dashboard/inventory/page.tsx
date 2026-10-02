import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getInventory, getBranches } from "./queries";
import { InventoryClient } from "./InventoryClient";
import { TransferModal } from "./TransferModal";
import Link from "next/link";
import { History } from "lucide-react";

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
      {/* Header Corporativo Monocromático */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Inventario de Stock
            </h1>
            <span className="text-xs font-mono tabular-nums tracking-tight px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-700">
              {products.length} SKUs
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Control de existencias y movimientos. Valor total en almacén:{" "}
            <span className="font-mono tabular-nums tracking-tight font-semibold text-zinc-900 dark:text-zinc-100">
              ${totalInventoryValue.toLocaleString("es-MX", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/dashboard/inventory/history"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-3.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors shadow-xs"
          >
            <History className="mr-1.5 w-3.5 h-3.5 text-zinc-500" />
            Historial
          </Link>
          <TransferModal products={products} branches={branches} />
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
