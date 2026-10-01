import { db } from "@shopli/db";
import Link from "next/link";
import { ImportCatalogModal } from "./_components/ImportCatalogModal";
import { PrintCatalogButton } from "./_components/PrintCatalogButton";
import { CatalogFilterTabs } from "./_components/CatalogFilterTabs";
import { CatalogSearchBar } from "./_components/CatalogSearchBar";
import { ToggleProductButton } from "./_components/ToggleProductButton";
import { auth } from "@/lib/auth";
import { Plus, SearchX, PackageX, PackagePlus, Edit2, Trash2 } from "lucide-react";

// RSC
export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.empresa_id) {
    throw new Error("No autorizado");
  }
  const empresaId = session.user.empresa_id;

  const params = await searchParams;
  const page = parseInt(params.page || "1", 10);
  const query = params.q || "";
  const currentTab = params.tab || "active";
  const take = 20;
  const skip = (page - 1) * take;

  const baseProductFilter = {
    empresa_id: empresaId,
    OR: [
      { parent_id: { not: null } },
      { parent_id: null, variants: { none: {} } },
    ],
  };

  const whereClause: any = {
    empresa_id: empresaId,
    ...(query ? { nombre: { contains: query, mode: "insensitive" as const } } : {}),
    OR: [
      { parent_id: { not: null } },
      { parent_id: null, variants: { none: {} } },
    ],
  };

  if (currentTab === "active") {
    whereClause.isActive = true;
  } else if (currentTab === "inactive") {
    whereClause.isActive = false;
  }

  // Consultas concurrentes para datos, total paginado y conteos para tabs
  const [products, totalProducts, activeCount, inactiveCount] =
    await Promise.all([
      db.producto.findMany({
        where: whereClause,
        skip,
        take,
        orderBy: { nombre: "asc" },
      }),
      db.producto.count({ where: whereClause }),
      db.producto.count({ where: { ...baseProductFilter, isActive: true } }),
      db.producto.count({ where: { ...baseProductFilter, isActive: false } }),
    ]);

  const totalCount = activeCount + inactiveCount;
  const totalPages = Math.ceil(totalProducts / take);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Compacto (Estilo Cortes) con Acciones Responsivas */}
      <div className="flex flex-row items-center justify-between gap-4 bg-white dark:bg-zinc-950 p-4 md:p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl md:text-3xl font-black tracking-tight text-zinc-900 dark:text-white">
              Catálogo
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
              {activeCount}
            </span>
          </div>
          <p className="hidden md:block text-zinc-500 dark:text-zinc-400 text-sm font-medium">
            Gestiona los productos e inventario global del sistema.
          </p>
        </div>

        {/* Acciones Responsivas */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          <PrintCatalogButton />
          <ImportCatalogModal />

          <Link
            href="/dashboard/catalog/new"
            className="inline-flex h-9 sm:h-11 items-center justify-center rounded-xl bg-black px-3 sm:px-6 text-xs sm:text-sm font-bold text-white transition-all hover:bg-zinc-800 shadow-sm active:scale-95 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200 gap-1.5 sm:gap-2 shrink-0"
          >
            <Plus className="h-4 w-4 shrink-0" />
            <span className="hidden sm:inline">Nuevo Producto</span>
            <span className="sm:hidden">Nuevo</span>
          </Link>
        </div>
      </div>

      {/* Barra de Filtros y Búsqueda */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <CatalogFilterTabs
          counts={{
            active: activeCount,
            inactive: inactiveCount,
            total: totalCount,
          }}
        />
        <CatalogSearchBar />
      </div>

      {/* Lista / Tabla de Productos */}
      {products.length === 0 ? (
        <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 p-12 text-center text-zinc-500">
          <div className="max-w-sm mx-auto flex flex-col items-center justify-center space-y-3">
            {query ? (
              <>
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <SearchX className="w-6 h-6" />
                </div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Sin resultados
                </p>
                <p className="text-xs text-zinc-400">
                  No se encontró ningún producto que coincida con &quot;{query}&quot;.
                </p>
              </>
            ) : currentTab === "inactive" ? (
              <>
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <PackageX className="w-6 h-6" />
                </div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  No hay productos inactivos
                </p>
                <p className="text-xs text-zinc-400">
                  Todos los productos de tu catálogo están activos y listos para venta.
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400">
                  <PackagePlus className="w-6 h-6" />
                </div>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  Catálogo vacío
                </p>
                <p className="text-xs text-zinc-400">
                  Comienza agregando tu primer producto o importa tu catálogo mediante CSV.
                </p>
              </>
            )}
          </div>
        </div>
      ) : (
        <>
          {/* Vista Móvil: Filas Ultra-Compactas (Máxima Densidad, Sin Negro) */}
          <div className="flex flex-col gap-2.5 md:hidden">
            {products.map((product) => {
              const isActive = (product as any).isActive as boolean;

              return (
                <div
                  key={product.id}
                  className={`bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm transition-all ${
                    !isActive ? "opacity-60 bg-zinc-50/50" : ""
                  }`}
                >
                  {/* Fila 1: Nombre y Precio */}
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="font-bold text-sm tracking-tight text-zinc-900 dark:text-white truncate">
                      {product.nombre}
                    </h3>

                    <span className="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 shrink-0">
                      ${Number(product.precio_publico).toFixed(2)}
                    </span>
                  </div>

                  {/* Fila 2: SKU · Costo a la izquierda y Acciones compactas a la derecha */}
                  <div className="flex items-center justify-between gap-2 mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-900">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      <span>SKU: {product.codigo_interno || "—"}</span>
                      <span className="text-zinc-300 dark:text-zinc-700">·</span>
                      <span>
                        Costo:{" "}
                        <strong className="font-semibold text-zinc-700 dark:text-zinc-300">
                          ${Number(product.costo).toFixed(2)}
                        </strong>
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <Link
                        href={`/dashboard/catalog/${product.id}`}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-lg text-zinc-600 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors"
                        title="Editar producto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>

                      <ToggleProductButton
                        productId={product.id}
                        productName={product.nombre}
                        isActive={isActive}
                        className={`inline-flex items-center justify-center h-7 w-7 rounded-lg transition-colors ${
                          isActive
                            ? "bg-zinc-100 text-zinc-600 hover:bg-red-50 hover:text-red-600 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:bg-red-950/40 dark:hover:text-red-400"
                            : "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                        }`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </ToggleProductButton>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vista Escritorio: Tabla de Productos */}
          <div className="hidden md:block rounded-2xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-950 overflow-hidden relative">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-zinc-500 dark:text-zinc-400 min-w-[700px]">
                <thead className="text-xs text-zinc-600 uppercase bg-zinc-50/80 dark:bg-zinc-900/50 dark:text-zinc-400 border-b border-zinc-200 dark:border-zinc-800 tracking-wider">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      SKU / Código
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">
                      Precio
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold text-right">
                      Costo
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold text-center">
                      Estado
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold text-center">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {products.map((product) => {
                    const isActive = (product as any).isActive as boolean;

                    return (
                      <tr
                        key={product.id}
                        className={`hover:bg-zinc-50/60 dark:hover:bg-zinc-900/40 transition-colors ${
                          !isActive ? "bg-zinc-50/30 opacity-75" : ""
                        }`}
                      >
                        <td className="px-6 py-4 font-mono text-xs text-zinc-500 font-medium">
                          {product.codigo_interno || "—"}
                        </td>
                        <td className="px-6 py-4 font-bold text-zinc-900 dark:text-white">
                          {product.nombre}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-zinc-900 dark:text-zinc-100">
                          ${Number(product.precio_publico).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-right text-zinc-400 font-mono text-xs">
                          ${Number(product.costo).toFixed(2)}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                              isActive
                                ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900"
                                : "bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400 border border-zinc-200 dark:border-zinc-800"
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                isActive ? "bg-emerald-500" : "bg-zinc-400"
                              }`}
                            />
                            {isActive ? "Activo" : "Inactivo"}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <Link
                              href={`/dashboard/catalog/${product.id}`}
                              className="inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-lg text-xs font-bold bg-zinc-100 text-zinc-700 hover:bg-zinc-200 transition-colors dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700 shadow-sm"
                            >
                              <Edit2 className="w-3 h-3" />
                              <span>Editar</span>
                            </Link>

                            <ToggleProductButton
                              productId={product.id}
                              productName={product.nombre}
                              isActive={isActive}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Paginación */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center sm:justify-end gap-2 pt-2">
          {page > 1 && (
            <Link
              href={`/dashboard/catalog?page=${page - 1}${query ? `&q=${query}` : ""}${
                currentTab !== "active" ? `&tab=${currentTab}` : ""
              }`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold shadow-sm transition-colors hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Anterior
            </Link>
          )}
          <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 px-4">
            Página {page} de {totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/dashboard/catalog?page=${page + 1}${query ? `&q=${query}` : ""}${
                currentTab !== "active" ? `&tab=${currentTab}` : ""
              }`}
              className="inline-flex h-9 items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold shadow-sm transition-colors hover:bg-zinc-100 text-zinc-700 dark:border-zinc-800 dark:bg-black dark:text-zinc-200 dark:hover:bg-zinc-800"
            >
              Siguiente
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

