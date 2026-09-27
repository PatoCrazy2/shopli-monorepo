import Image from "next/image";

export default function SalesLoading() {
  return (
    <div className="flex h-full w-full min-h-[60vh] flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/shopli_snbg.svg"
          alt="Cargando ventas..."
          width={90}
          height={90}
          className="animate-pulse opacity-80"
          priority
        />
      </div>
    </div>
  );
}
