import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSucursales } from "./queries";
import { createSucursal } from "./actions";
import { DeactivateBranchButton } from "./_components/deactivate-branch-button";

export default async function BranchesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sucursales = await getSucursales();

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Sucursales</h1>
          <p className="text-zinc-500 mt-2">
            Gestión y alta de los puntos de venta físicos de la red ShopLI.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formulario de Alta */}
        <div className="lg:col-span-1">
          <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-sm sticky top-24">
            <h2 className="text-lg font-bold mb-4">Nueva Sucursal</h2>
            <form action={createSucursal} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="nombre" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Nombre Comercial</label>
                <input
                  type="text"
                  name="nombre"
                  id="nombre"
                  required
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black placeholder:text-zinc-300 transition-all"
                  placeholder="Ej: ShopLI Central"
                />
              </div>
              <div className="space-y-1">
                <label htmlFor="direccion" className="text-[10px] font-black text-zinc-400 uppercase tracking-widest pl-1">Ubicación</label>
                <input
                  type="text"
                  name="direccion"
                  id="direccion"
                  className="flex h-11 w-full rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black placeholder:text-zinc-300 transition-all"
                  placeholder="Calle, Ciudad, Estado"
                />
              </div>
              <button
                type="submit"
                className="w-full h-11 bg-black text-white rounded-lg font-bold text-sm hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98] mt-2"
              >
                Abrir Punto de Venta
              </button>
            </form>
          </div>
        </div>

        {/* Listado de Sucursales Activas */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xs font-black uppercase tracking-[0.2em] text-zinc-400 mb-2 pl-2 flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Operativas actualmente
          </h2>
          {sucursales.length === 0 ? (
            <div className="bg-white border border-zinc-200 rounded-xl p-16 flex flex-col items-center justify-center text-zinc-500 shadow-sm">
                <p className="font-medium text-lg text-zinc-600">No hay sucursales operativas</p>
                <p className="text-sm text-zinc-400 mt-2">Usa el panel lateral para dar de alta una nueva.</p>
            </div>
          ) : (
            sucursales.map((s) => (
              <div key={s.id} className="bg-white border border-zinc-200 rounded-xl p-5 shadow-sm flex items-center justify-between hover:shadow-md transition-all group border-l-4 border-l-zinc-100 hover:border-l-black">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-100 flex items-center justify-center text-zinc-600 font-bold text-xl group-hover:bg-black group-hover:text-white transition-all shadow-inner">
                    {s.nombre[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-zinc-900 group-hover:text-black tracking-tight">{s.nombre}</h3>
                    <p className="text-sm text-zinc-400 font-medium">{s.direccion || "Sin dirección registrada"}</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <DeactivateBranchButton id={s.id} nombre={s.nombre} />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

