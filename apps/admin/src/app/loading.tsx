import Image from "next/image";

export default function GlobalLoading() {
  return (
    <div className="flex h-dvh w-dvw items-center justify-center bg-white">
      <div className="flex flex-col items-center gap-4">
        {/* Usamos el logo principal con un efecto de latido suave */}
        <Image
          src="/shopli_snbg.svg"
          alt="Cargando ShopLI..."
          width={120}
          height={120}
          className="animate-pulse opacity-80"
          priority
        />
        <div className="h-1 w-24 overflow-hidden rounded-full bg-gray-100">
          <div className="h-full w-full animate-pulse rounded-full bg-slate-300" />
        </div>
      </div>
    </div>
  );
}
