import { db } from "@shopli/db";
import Link from "next/link";
import { toggleProduct } from "./actions";

// RSC
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const take = 20;
  const skip = (page - 1) * take;

  const products = await db.producto.findMany({
    skip,
    take,
    orderBy: { updatedAt: "desc" },
    include: {
      inventario: true, // Para obtener el stock
    },
  });

  const totalProducts = await db.producto.count();
  const totalPages = Math.ceil(totalProducts / take);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white">
            Catálogo
          </h1>
          <p className="text-gray-500 mt-1 dark:text-gray-400">
            Gestiona los productos y el inventario disponible.
          </p>
        </div>
        <Link
          href="/dashboard/catalog/new"
          className="inline-flex h-10 items-center justify-center rounded-lg bg-black px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-gray-200"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mr-2 h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14"></path>
            <path d="M12 5v14"></path>
          </svg>
          Nuevo Producto
        </Link>
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
                <th scope="col" className="px-6 py-4 font-medium text-right">
                  Stock
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-center">
                  Estado
                </th>
                <th scope="col" className="px-6 py-4 font-medium text-right">
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
                  const stockTotal = product.inventario.reduce(
                    (acc, inv) => acc + inv.cantidad,
                    0
                  );
                  const isNegativeStock = stockTotal < 0;
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
                      <td
                        className={`px-6 py-4 text-right font-semibold ${
                          isNegativeStock
                            ? "text-red-600 dark:text-red-400"
                            : "text-gray-700 dark:text-gray-300"
                        }`}
                      >
                        {stockTotal}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            isActive
                              ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
                          }`}
                        >
                          {isActive ? "Activo" : "Inactivo"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Link
                          href={`/dashboard/catalog/${product.id}`}
                          className="text-black hover:text-gray-600 font-medium dark:text-white dark:hover:text-gray-300 transition-colors"
                        >
                          Editar
                        </Link>
                        {/* Server action in a form */}
                        <form
                          action={async () => {
                            "use server";
                            await toggleProduct(product.id, isActive);
                          }}
                          className="inline-block"
                        >
                          <button
                            type="submit"
                            className={`${
                              isActive
                                ? "text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                                : "text-green-600 hover:text-green-800 dark:text-green-400 dark:hover:text-green-300"
                            } font-medium transition-colors`}
                          >
                            {isActive ? "Desactivar" : "Activar"}
                          </button>
                        </form>
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
              href={`/dashboard/catalog?page=${page - 1}`}
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
              href={`/dashboard/catalog?page=${page + 1}`}
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
