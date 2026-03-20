import Link from "next/link";

export default function DashboardPage() {
   return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
         <div className="space-y-2">
            <h1 className="text-5xl font-bold tracking-tight text-gray-900 dark:text-white">
               ShopLI Admin
            </h1>
            <p className="text-lg text-gray-500 dark:text-gray-400">
               Panel de administración. Selecciona una sección del menú para comenzar.
            </p>
         </div>
         <Link
            href="/dashboard/catalog"
            className="inline-flex h-11 items-center justify-center rounded-lg bg-black px-6 text-sm font-medium text-white transition-colors hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200"
         >
            Ir al Catálogo →
         </Link>
      </div>
   );
}
