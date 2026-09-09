"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { KeyRound, ScanBarcode, ShoppingBag, Receipt } from "lucide-react";

interface PosChapter {
  id: string;
  category: string;
  title: string;
  description: string;
  startSec: number;
  endSec: number;
  icon: React.ComponentType<{ className?: string }>;
  iconGradient: string;
  positionClass: string;
}

const CHAPTERS: PosChapter[] = [
  {
    id: "shift",
    category: "Apertura Inmediata",
    title: "Abre tu turno en 2 toques",
    description: "Comienza a cobrar al instante. Elige sucursal, declara tu fondo y listo.",
    startSec: 0,
    endSec: 6,
    icon: KeyRound,
    iconGradient: "from-amber-400/20 via-orange-500/20 to-amber-500/10 text-amber-300 border-amber-400/20",
    positionClass: "lg:top-4 lg:-left-92 xl:-left-104",
  },
  {
    id: "catalog",
    category: "Cobro Móvil",
    title: "Tu teléfono es tu terminal",
    description: "Catálogo táctil ultrafluido y cobro ágil sin invertir en equipo dedicado.",
    startSec: 6,
    endSec: 23,
    icon: ShoppingBag,
    iconGradient: "from-sky-400/20 via-blue-500/20 to-indigo-500/10 text-sky-300 border-sky-400/20",
    positionClass: "lg:bottom-4 lg:-left-92 xl:-left-104",
  },
  {
    id: "scan",
    category: "Escáner con Cámara",
    title: "Escanea con tu cámara",
    description: "Usa códigos de barras comerciales o genera los tuyos desde ShopLI.",
    startSec: 23,
    endSec: 36,
    icon: ScanBarcode,
    iconGradient: "from-emerald-400/20 via-teal-500/20 to-emerald-500/10 text-emerald-300 border-emerald-400/20",
    positionClass: "lg:top-4 lg:-right-92 xl:-right-104",
  },
  {
    id: "ticket",
    category: "Historial & Tickets",
    title: "Ventas e historial al día",
    description: "Consulta cada transacción en segundos y emite comprobantes sin enredos.",
    startSec: 36,
    endSec: 46.5,
    icon: Receipt,
    iconGradient: "from-purple-400/20 via-fuchsia-500/20 to-purple-500/10 text-purple-300 border-purple-400/20",
    positionClass: "lg:bottom-4 lg:-right-92 xl:-right-104",
  },
];

export default function PhoneShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const chassisRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const ambientGlowRef = useRef<HTMLDivElement>(null);
  const phoneShadowRef = useRef<HTMLDivElement>(null);
  const rearFaceRef = useRef<HTMLDivElement>(null);
  const frontFaceRef = useRef<HTMLDivElement>(null);

  const [isSettled, setIsSettled] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);
  const [activeChapterId, setActiveChapterId] = useState<string>("shift");
  const [hasCompletedCycle, setHasCompletedCycle] = useState(false);

  const isScreenOnRef = useRef(false);
  const isSettledRef = useRef(false);
  const hasCompletedCycleRef = useRef(false);

  useEffect(() => {
    let animationFrameId: number;

    const updateTransforms = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const current = -rect.top;
      const progress = Math.min(Math.max(current / totalScrollable, 0), 1);

      // Curva de interpolación suave (cubic ease-out)
      const turnPhase = Math.min(progress / 0.44, 1);
      const easedTurn = 1 - Math.pow(1 - turnPhase, 3);

      const translateX = (1 - easedTurn) * 42;
      const translateY = (1 - easedTurn) * 16;
      const rotateY = (1 - easedTurn) * 180;
      const rotateZ = (1 - easedTurn) * -10;
      const rotateX = (1 - easedTurn) * 8;
      const scale = 0.85 + easedTurn * 0.15;
      const opacity = 0.25 + easedTurn * 0.75;

      // Mutación directa al DOM del chasis 3D sin provocar re-renders de React
      if (chassisRef.current) {
        chassisRef.current.style.transform = `translateX(${translateX}vw) translateY(${translateY}px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`;
      }

      if (wrapperRef.current) {
        wrapperRef.current.style.opacity = `${opacity}`;
      }

      // Sombra acelerada por GPU en plano inferior
      if (phoneShadowRef.current) {
        phoneShadowRef.current.style.transform = `translateX(${translateX * 0.5}vw) translateY(${translateY + 20}px) scale(${scale * 0.9})`;
        phoneShadowRef.current.style.opacity = `${opacity * 0.85}`;
      }

      // Conmutación de visibilidad de caras para optimizar VRAM de GPU
      if (rearFaceRef.current) {
        rearFaceRef.current.style.visibility = rotateY > 85 ? "visible" : "hidden";
        rearFaceRef.current.style.zIndex = rotateY > 85 ? "20" : "1";
      }
      if (frontFaceRef.current) {
        frontFaceRef.current.style.visibility = rotateY <= 95 ? "visible" : "hidden";
        frontFaceRef.current.style.zIndex = rotateY <= 95 ? "20" : "1";
      }

      const settledThreshold = 0.44;
      const settled = progress >= settledThreshold;

      if (settled !== isSettledRef.current) {
        isSettledRef.current = settled;
        setIsSettled(settled);
      }

      if (settled) {
        if (!isScreenOnRef.current) {
          isScreenOnRef.current = true;
          setIsScreenOn(true);
        }
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            // Manejo de restricciones de autoplay
          });
        }
      } else if (progress < 0.32) {
        if (isScreenOnRef.current) {
          isScreenOnRef.current = false;
          setIsScreenOn(false);
        }
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(updateTransforms);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    updateTransforms();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const time = videoRef.current.currentTime;

      // Al alcanzar el final del video (~46s), se completa el ciclo inicial
      if (time >= 46.0 && !hasCompletedCycleRef.current) {
        hasCompletedCycleRef.current = true;
        setHasCompletedCycle(true);
        // Pausar al completar el ciclo para ahorrar 100% de decoding de video en GPU
        videoRef.current.pause();
      }

      // Detección del capítulo activo
      const active = CHAPTERS.find((ch) => time >= ch.startSec && time < ch.endSec);
      if (active && active.id !== activeChapterId) {
        setActiveChapterId(active.id);
      }
    }
  };

  const handleSeekTo = (startSec: number, targetId: string) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      setActiveChapterId(targetId);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
    }
  };

  return (
    <section
      ref={sectionRef}
      id="capacidades"
      className="relative z-20 w-full h-[280vh] bg-[#050507]"
    >
      {/* Viewport Fijo: La pantalla se detiene por completo mientras el teléfono hace su recorrido */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Luz ambiental de fondo de lujo */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div
            ref={ambientGlowRef}
            className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] bg-gradient-to-tr from-white/[0.04] via-neutral-300/[0.03] to-transparent rounded-full blur-[140px] transition-all duration-700"
            style={{
              opacity: isScreenOn ? 0.9 : 0.4,
              transform: `scale(${isScreenOn ? 1.08 : 0.95})`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[600px] bg-white/[0.025] rounded-full blur-[90px] transition-opacity duration-700"
            style={{ opacity: isScreenOn ? 0.8 : 0.3 }}
          />
        </div>

        {/* Encabezado cinemático: Fijo y estable */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-3 sm:mb-5 select-none pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs text-neutral-300 mb-2 tracking-wide">
            <span
              className={`w-1.5 h-1.5 rounded-full transition-colors duration-500 ${
                isScreenOn ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-neutral-500"
              }`}
            />
            <span>{isScreenOn ? "Punto de Venta Activo" : "Hardware de Alta Precisión"}</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white mb-2">
            Velocidad táctil.{" "}
            <span className="bg-gradient-to-r from-white via-neutral-300 to-neutral-500 bg-clip-text text-transparent">
              Cero fricción.
            </span>
          </h2>
          <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto leading-relaxed hidden xs:block">
            {isScreenOn
              ? "Flujo de venta instantáneo, arqueos ciegos y tickets en milisegundos."
              : "Desplaza para encajar el dispositivo y activar la experiencia del POS."}
          </p>
        </div>

        {/* Escenario Central: Teléfono + Spatial HUD Satelital */}
        <div className="relative z-10 flex items-center justify-center w-full max-w-6xl">
          {/* Escenario de Perspectiva 3D */}
          <div
            className="relative flex items-center justify-center"
            style={{
              perspective: "1200px",
              perspectiveOrigin: "50% 50%",
            }}
          >
            {/* Sombra proyectada en plano base acelerada 100% por GPU (sin filter: drop-shadow) */}
            <div
              ref={phoneShadowRef}
              className="absolute pointer-events-none w-[260px] sm:w-[320px] h-[42px] -bottom-9 rounded-[100%] bg-black/95 blur-2xl will-change-transform"
              style={{
                boxShadow: "0 28px 70px 24px rgba(0, 0, 0, 0.95)",
              }}
            />

            {/* Capa 1: Envolvente de Opacidad */}
            <div
              ref={wrapperRef}
              className="relative flex items-center justify-center will-change-transform"
              style={{ opacity: 0.25 }}
            >
              {/* Capa 2: Contenedor 3D Puro */}
              <div
                ref={chassisRef}
                className="relative h-[50vh] sm:h-[58vh] lg:h-[62vh] max-h-[580px] aspect-[2620/5416] will-change-transform"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "translateX(42vw) translateY(16px) rotateX(8deg) rotateY(180deg) rotateZ(-10deg) scale(0.85)",
                }}
              >
                {/* ----------------- NÚCLEO Y CANTOS DE TITANIO (Grosor 3D de 12px) ----------------- */}
                {/* Canto Izquierdo */}
                <div
                  className="absolute top-[20px] bottom-[20px] -left-[5px] w-[10px] bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 rounded-sm pointer-events-none"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(-90deg) translateZ(5px)",
                    boxShadow: "inset 0 0 4px rgba(255,255,255,0.2)",
                  }}
                />
                {/* Canto Derecho */}
                <div
                  className="absolute top-[20px] bottom-[20px] -right-[5px] w-[10px] bg-gradient-to-r from-neutral-800 via-neutral-600 to-neutral-800 rounded-sm pointer-events-none"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(90deg) translateZ(5px)",
                    boxShadow: "inset 0 0 4px rgba(255,255,255,0.2)",
                  }}
                />
                {/* Núcleo central oscuro */}
                <div
                  className="absolute inset-[3px] rounded-[42px] bg-[#111114] border border-neutral-700/60 pointer-events-none"
                  style={{
                    transform: "translateZ(0px)",
                    boxShadow: "0 0 0 4px #1c1c20, inset 0 0 20px rgba(0,0,0,0.9)",
                  }}
                />

                {/* ----------------- CARA TRASERA (iphone-back.webp con cámaras) ----------------- */}
                <div
                  ref={rearFaceRef}
                  className="absolute inset-0 pointer-events-none select-none"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(180deg) translateZ(6px)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    visibility: "visible",
                    zIndex: 20,
                  }}
                >
                  <div className="relative w-full h-full scale-[1.08] -translate-x-[0.6%]">
                    <Image
                      src="/iphone-back.webp"
                      alt="iPhone 16 Titanium Back"
                      fill
                      className="object-contain pointer-events-none select-none"
                    />
                  </div>
                  {/* Reflejo metálico trasero sobre el titanio */}
                  <div className="absolute inset-0 rounded-[44px] bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
                </div>

                {/* ----------------- CARA FRONTAL (mockup.webp + pantalla + video) ----------------- */}
                <div
                  ref={frontFaceRef}
                  className="absolute inset-0"
                  style={{
                    transformStyle: "preserve-3d",
                    transform: "rotateY(0deg) translateZ(6px)",
                    backfaceVisibility: "hidden",
                    WebkitBackfaceVisibility: "hidden",
                    visibility: "hidden",
                    zIndex: 1,
                  }}
                >
                  {/* Contenedor de Pantalla Calibrado */}
                  <div
                    className="absolute overflow-hidden bg-black z-10"
                    style={{
                      top: "1.64%",
                      bottom: "1.61%",
                      left: "4.08%",
                      right: "4.08%",
                      borderRadius: "7.6%",
                    }}
                  >
                    {/* Video del POS */}
                    <video
                      ref={videoRef}
                      playsInline
                      muted
                      preload="auto"
                      onTimeUpdate={handleTimeUpdate}
                      onEnded={() => {
                        hasCompletedCycleRef.current = true;
                        setHasCompletedCycle(true);
                      }}
                      poster="/pos-demo-poster.webp"
                      className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-700 ${
                        isScreenOn ? "opacity-100" : "opacity-0"
                      }`}
                    >
                      <source src="/pos-demo.webm" type="video/webm" />
                      <source src="/pos-demo.mp4" type="video/mp4" />
                    </video>

                    {/* Pantalla Apagada (OLED en reposo) */}
                    <div
                      className={`absolute inset-0 bg-[#020204] pointer-events-none transition-opacity duration-700 z-20 ${
                        isScreenOn ? "opacity-0" : "opacity-100"
                      }`}
                    >
                      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/[0.03] to-white/[0.07]" />
                    </div>

                    {/* Reflejo de cristal cerámico continuo */}
                    <div className="absolute inset-0 pointer-events-none bg-gradient-to-tr from-transparent via-white/[0.05] to-transparent z-30" />
                  </div>

                  {/* Chasis Frontal WebP con Dynamic Island y Biseles */}
                  <Image
                    src="/mockup.webp"
                    alt="ShopLI POS iPhone 16 Front Frame"
                    fill
                    priority
                    className="pointer-events-none select-none z-30 object-contain"
                  />
                </div>
              </div>
            </div>

            {/* ----------------- SPATIAL BADGES (DESKTOP: Estilo Apple App Icon / Luma / Stripe) ----------------- */}
            {CHAPTERS.map((ch, idx) => {
              const Icon = ch.icon;
              const isActive = activeChapterId === ch.id;
              // Durante el video solo se muestra el activo. Al terminar el ciclo, todos se muestran fijos.
              const isVisible = isSettled && (hasCompletedCycle || isActive);

              return (
                <button
                  key={ch.id}
                  onClick={() => handleSeekTo(ch.startSec, ch.id)}
                  style={{
                    transitionDelay: hasCompletedCycle ? `${idx * 60}ms` : "0ms",
                  }}
                  className={`hidden lg:flex absolute items-center gap-4 text-left w-[330px] xl:w-[360px] p-4 rounded-2xl border transition-all duration-500 cursor-pointer select-none ${
                    ch.positionClass
                  } ${
                    isVisible
                      ? "opacity-100 translate-y-0 scale-100 pointer-events-auto"
                      : "opacity-0 translate-y-4 scale-90 pointer-events-none"
                  } ${
                    isActive
                      ? "bg-[#101017]/95 border-white/20 shadow-[0_20px_45px_rgba(0,0,0,0.85),0_0_25px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.2)] ring-1 ring-white/25"
                      : "bg-[#0b0b10]/75 border-white/[0.07] hover:border-white/15 hover:bg-[#0f0f16]/85 opacity-70 hover:opacity-100"
                  }`}
                >
                  {/* Apple App Icon Squircle */}
                  <div
                    className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center border bg-gradient-to-b shadow-[0_4px_14px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.2)] transition-transform duration-300 ${
                      ch.iconGradient
                    } ${isActive ? "scale-105" : ""}`}
                  >
                    <Icon className="w-6 h-6 stroke-[1.8]" />
                  </div>

                  {/* Contenido Tipográfico Minimalista (Luma / Stripe) */}
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-[11px] font-medium tracking-wider uppercase text-neutral-400 mb-0.5">
                      {ch.category}
                    </span>
                    <h3
                      className={`text-base font-semibold tracking-tight transition-colors duration-300 leading-snug ${
                        isActive ? "text-white" : "text-neutral-200"
                      }`}
                    >
                      {ch.title}
                    </h3>
                    <p className="text-xs text-neutral-400/90 mt-1 leading-relaxed">
                      {ch.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ----------------- SELECTOR DE CAPÍTULOS PARA MÓVIL / TABLET (< lg) ----------------- */}
        <div
          className={`lg:hidden relative z-20 flex items-center justify-center gap-2 mt-4 px-2 w-full max-w-md transition-all duration-500 ${
            isSettled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            const isActive = activeChapterId === ch.id;
            const isVisible = hasCompletedCycle || isActive;

            return (
              <button
                key={ch.id}
                onClick={() => handleSeekTo(ch.startSec, ch.id)}
                className={`flex-1 flex flex-col items-center p-2.5 rounded-2xl border transition-all duration-400 text-center ${
                  isVisible ? "opacity-100 scale-100" : "opacity-35 scale-95"
                } ${
                  isActive
                    ? "bg-[#12121a] border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.06)] ring-1 ring-white/15"
                    : "bg-[#08080c]/80 border-white/[0.07] text-neutral-400 hover:text-white"
                }`}
              >
                <div
                  className={`w-7 h-7 rounded-[10px] flex items-center justify-center border mb-1.5 bg-gradient-to-b ${ch.iconGradient}`}
                >
                  <Icon className="w-3.5 h-3.5 stroke-[1.8]" />
                </div>
                <span className="text-[9px] font-medium leading-tight line-clamp-2 h-6 flex items-center justify-center">{ch.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
