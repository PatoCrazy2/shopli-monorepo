import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import Hero3DViewer from "@/components/landing/Hero3DViewer";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard/inicio");
  }

  return (
    <main className="relative min-h-screen w-full flex items-center justify-center bg-[#09090b] text-white font-sans overflow-hidden px-6 sm:px-12">
      {/* Background del Hero tal cual es, nítido y a pantalla completa */}
      <div className="absolute inset-0 pointer-events-none select-none z-0">
        <Image
          src="/shopli-hero-readme.webp"
          alt="ShopLI Hero Background"
          fill
          priority
          className="object-cover object-center"
        />
        {/* Overlay tenue para asegurar contraste sin difuminar */}
        <div className="absolute inset-0 bg-[#09090b]/40" />
      </div>

      {/* Contenido Dividido: Propuesta de valor a la izquierda, Objeto 3D GLB a la derecha */}
      <div className="relative z-10 max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center py-12">
        {/* Columna Izquierda: Textos y CTAs (Placeholder) */}
        <div className="flex flex-col items-start max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/15 text-xs font-medium text-neutral-200 mb-6">
            <span>ShopLI Enterprise</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-white leading-[1.1] mb-6">
            El sistema operativo para el comercio moderno.
          </h1>

          <p className="text-base sm:text-lg text-neutral-300 font-normal leading-relaxed mb-8">
            Punto de venta offline-first, conciliación en tiempo real, auditorías ciegas de inventario y gestión multi-sucursal.
          </p>

          <div className="flex flex-wrap items-center gap-4">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-neutral-200 transition-colors shadow-lg cursor-pointer"
            >
              <span>Comenzar ahora</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-black/60 border border-white/20 text-white font-medium text-sm hover:bg-black/80 transition-colors cursor-pointer"
            >
              <span>Iniciar sesión</span>
            </Link>
          </div>
        </div>

        {/* Columna Derecha: Objeto 3D GLB en vivo interactivo */}
        <div className="w-full h-[450px] sm:h-[550px] flex items-center justify-center">
          <Hero3DViewer />
        </div>
      </div>
    </main>
  );
}
