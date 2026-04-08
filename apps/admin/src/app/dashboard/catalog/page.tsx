import { db } from "@shopli/db";
import Link from "next/link";
import { toggleProduct } from "./actions";

// RSC
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const query = params.q || "";
  const take = 20;
  const skip = (page - 1) * take;

  const whereClause = query ? { nombre: { contains: query, mode: "insensitive" as const } } : {};

  const products = await db.producto.findMany({
    where: whereClause,
    skip,
    take,
    orderBy: { nombre: "asc" },
  });

  const totalProducts = await db.producto.count({ where: whereClause });
  const totalPages = Math.ceil(totalProducts / take);

  return (
    <div className="space-y-8">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-white dark:bg-zinc-950 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm transition-all hover:shadow-md">
        <div className="space-y-1 min-w-fit">
          <h1 className="text-4xl font-black tracking-tight text-zinc-900 dark:text-white">Catálogo</h1>
          <p className="text-zinc-500 dark:text-zinc-400 font-medium leading-relaxed">
            Gestiona los productos e inventario global del sistema.
          </p>
        </div>

        <div className="flex flex-col md:flex-row items-center gap-4 flex-1 justify-end w-full">
          {/* Barra de Búsqueda */}
          <form method="GET" className="relative flex-1 w-full max-w-lg group">
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400 group-focus-within:text-black transition-colors" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Buscar productos por nombre..."
              className="w-full h-11 pl-11 pr-4 rounded-xl border border-zinc-200 bg-zinc-50/50 text-sm font-bold placeholder:text-zinc-400 placeholder:font-medium focus:outline-none focus:ring-2 focus:ring-black dark:border-zinc-800 dark:bg-zinc-900 dark:focus:ring-white transition-all shadow-inner"
            />
          </form>

          <Link
            href="/dashboard/catalog/new"
            className="inline-flex h-11 w-full md:w-auto items-center justify-center rounded-xl bg-black px-6 text-sm font-bold text-white transition-all hover:bg-zinc-800 shadow-lg active:scale-95 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="mr-2 h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M5 12h14"></path>
              <path d="M12 5v14"></path>
            </svg>
            Nuevo Producto
          </Link>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-black overflow-hidden relative">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-zinc-900 dark:text-gray-300 border-b border-gray-200 dark:border-zinc-800">
              <tr>
                <th scope="col" className="px-6 py-4 font-medium">
                  SKU
                </th>
                <th scope="col" className="px-6 py-4 font-medium">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right">
                  Precio
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right">
                  Costo
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-center">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-center">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-zinc-800">
              {products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                    No hay productos en el catálogo.
                  </td>
                </tr>
              ) : (
                products.map((product) => {
                  // Cast needed: isActive exists in DB but Prisma client type cache is stale
                  const isActive = (product as any).isActive as boolean;

                  return (
                    <tr
                      key={product.id}
                      className="bg-white hover:bg-gray-50/50 dark:bg-black dark:hover:bg-zinc-900/50 transition-colors"
                    >
                      <td className="px-6 py-4 font-mono text-xs text-gray-500">
                        {product.codigo_interno || "N/A"}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                        {product.nombre}
                      </td>
                      <td className="px-6 py-4 text-right">
                        ${Number(product.precio_publico).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-right text-gray-400">
                        ${Number(product.costo).toFixed(2)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${isActive
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                            }`}
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Link
                            href={`/dashboard/catalog/${product.id}`}
                            className="inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-bold uppercase tracking-wider bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors dark:bg-zinc-800 dark:text-gray-300 dark:hover:bg-zinc-700"
                          >
                            Editar
                          </Link>
                          {/* Server action in a form */}
                          <form
                            action={async () => {
                              "use server";
                              await toggleProduct(product.id, isActive);
                            }}
                          >
                            <button
                              type="submit"
                              className={`inline-flex items-center justify-center h-8 px-3 rounded-md text-xs font-bold uppercase tracking-wider transition-colors ${isActive
                                ? "bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 border border-red-100 dark:border-red-900/50"
                                : "bg-green-50 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 border border-green-100 dark:border-green-900/50"
                                }`}
                            >
                              {isActive ? "Desactivar" : "Activar"}
                            </button>
                          </form>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Paginación simple */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center sm:justify-end gap-2">
          {page > 1 && (
            <Link
              href={`/dashboard/catalog?page=${page - 1}${query ? `&q=${query}` : ""}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Anterior
            </Link>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400 px-4">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/catalog?page=${page + 1}${query ? `&q=${query}` : ""}`}
              className="inline-flex h-9 items-center justify-center rounded-md border border-gray-200 bg-white px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-gray-100 hover:text-gray-900 dark:border-zinc-800 dark:bg-black dark:hover:bg-zinc-800 dark:hover:text-white"
            >
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
