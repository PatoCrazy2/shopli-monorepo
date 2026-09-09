"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { KeyRound, ScanBarcode, ShoppingBag, Receipt } from "lucide-react";

interface PosChapter {
  id: string;
  tag: string;
  title: string;
  subtitle: string;
  metric: string;
  startSec: number;
  endSec: number;
  icon: React.ComponentType<{ className?: string }>;
  positionClass: string;
}

const CHAPTERS: PosChapter[] = [
  {
    id: "shift",
    tag: "SYS.01 // CAJA",
    title: "Apertura de Caja",
    subtitle: "Arqueo inicial con conciliación en tiempo real sin descuadres.",
    metric: "FONDO CONTROLADO",
    startSec: 0,
    endSec: 6,
    icon: KeyRound,
    positionClass: "lg:top-2 lg:-left-76 xl:-left-84",
  },
  {
    id: "catalog",
    tag: "SYS.02 // TÁCTIL",
    title: "Venta por Pantalla & Carrito",
    subtitle: "Cuadrícula ágil de productos y cálculo instantáneo offline-first.",
    metric: "LATENCIA: < 10ms",
    startSec: 6,
    endSec: 23,
    icon: ShoppingBag,
    positionClass: "lg:bottom-2 lg:-left-76 xl:-left-84",
  },
  {
    id: "scan",
    tag: "SYS.03 // SCANNER",
    title: "Venta por Escáner",
    subtitle: "Lectura óptica de códigos de barra continua sin pausas ni esperas.",
    metric: "DETECCIÓN: LÁSER 60FPS",
    startSec: 23,
    endSec: 36,
    icon: ScanBarcode,
    positionClass: "lg:top-2 lg:-right-76 xl:-right-84",
  },
  {
    id: "ticket",
    tag: "SYS.04 // RECIBOS",
    title: "Tickets & Conciliación",
    subtitle: "Impresión térmica inmediata y cierre de corte blindado.",
    metric: "COMPROBANTE INSTANTÁNEO",
    startSec: 36,
    endSec: 46.5,
    icon: Receipt,
    positionClass: "lg:bottom-2 lg:-right-76 xl:-right-84",
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
  const [unlockedChapters, setUnlockedChapters] = useState<Record<string, boolean>>({
    shift: true, // El primer capítulo siempre arranca activo
  });

  const isScreenOnRef = useRef(false);
  const isSettledRef = useRef(false);

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

      // Detección del capítulo activo
      const active = CHAPTERS.find((ch) => time >= ch.startSec && time < ch.endSec);
      if (active && active.id !== activeChapterId) {
        setActiveChapterId(active.id);
      }

      // Desbloqueo secuencial de badges al avanzar el video
      setUnlockedChapters((prev) => {
        let updated = false;
        const next = { ...prev };
        CHAPTERS.forEach((ch) => {
          if (time >= ch.startSec && !next[ch.id]) {
            next[ch.id] = true;
            updated = true;
          }
        });
        return updated ? next : prev;
      });
    }
  };

  const handleSeekTo = (startSec: number, targetId: string) => {
    if (videoRef.current) {
      videoRef.current.currentTime = startSec;
      setActiveChapterId(targetId);
      if (videoRef.current.paused) {
        videoRef.current.play().catch(() => {});
      }
      // Al hacer clic directo en un capítulo, se desbloquean él y los anteriores
      setUnlockedChapters((prev) => {
        const next = { ...prev };
        let found = false;
        CHAPTERS.forEach((ch) => {
          if (!found) {
            next[ch.id] = true;
          }
          if (ch.id === targetId) {
            found = true;
          }
        });
        return next;
      });
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
              className="absolute pointer-events-none w-[220px] sm:w-[260px] h-[35px] -bottom-8 rounded-[100%] bg-black/95 blur-2xl will-change-transform"
              style={{
                boxShadow: "0 25px 60px 20px rgba(0, 0, 0, 0.95)",
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
                className="relative h-[48vh] sm:h-[52vh] max-h-[460px] aspect-[2620/5416] will-change-transform"
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
                      loop
                      preload="auto"
                      onTimeUpdate={handleTimeUpdate}
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

            {/* ----------------- SPATIAL HUD BADGES (DESKTOP: Posiciones Satélite) ----------------- */}
            {/* TODO: Próxima fase: Rediseño visual profundo de los badges satelitales */}
            {CHAPTERS.map((ch) => {
              const Icon = ch.icon;
              const isUnlocked = isSettled && unlockedChapters[ch.id];
              const isActive = activeChapterId === ch.id;

              return (
                <button
                  key={ch.id}
                  onClick={() => handleSeekTo(ch.startSec, ch.id)}
                  className={`hidden lg:flex absolute flex-col text-left w-72 p-4 rounded-2xl border transition-all duration-500 cursor-pointer select-none overflow-hidden ${
                    ch.positionClass
                  } ${
                    isUnlocked
                      ? "opacity-100 translate-y-0 pointer-events-auto scale-100"
                      : "opacity-0 translate-y-6 pointer-events-none scale-95"
                  } ${
                    isActive
                      ? "bg-[#0b0b10]/95 border-white/30 shadow-[0_15px_40px_rgba(0,0,0,0.9),0_0_25px_rgba(255,255,255,0.08),inset_0_1px_1px_rgba(255,255,255,0.2)]"
                      : "bg-[#08080c]/65 border-white/[0.08] hover:border-white/20 hover:bg-[#0b0b10]/80 opacity-60 hover:opacity-100"
                  }`}
                >
                  {/* Encabezado del Badge: Micro-Tag Técnico + Estado Pulsante */}
                  <div className="flex items-center justify-between w-full mb-2.5">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all duration-300 ${
                          isActive
                            ? "bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                            : "bg-white/[0.05] text-neutral-400"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-[11px] font-mono font-semibold tracking-wider text-neutral-400">
                        {ch.tag}
                      </span>
                    </div>

                    {isActive && (
                      <span className="flex items-center gap-1.5 text-[9px] font-mono font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/25 shadow-[0_0_10px_rgba(52,211,153,0.15)]">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        EN VIVO
                      </span>
                    )}
                  </div>

                  {/* Título y Subtítulo de Hardware UI */}
                  <h3
                    className={`text-sm font-semibold tracking-tight transition-colors duration-300 ${
                      isActive ? "text-white" : "text-neutral-300"
                    }`}
                  >
                    {ch.title}
                  </h3>
                  <p className="text-[11px] text-neutral-400 line-clamp-2 mt-1 leading-relaxed">
                    {ch.subtitle}
                  </p>

                  {/* Métrica de Hardware */}
                  <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-neutral-500">
                    <span>{ch.metric}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* ----------------- SELECTOR DE CAPÍTULOS PARA MÓVIL / TABLET (< lg) ----------------- */}
        <div
          className={`lg:hidden relative z-20 flex items-center justify-center gap-1.5 mt-4 px-2 w-full max-w-md transition-all duration-700 ${
            isSettled ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
          }`}
        >
          {CHAPTERS.map((ch) => {
            const Icon = ch.icon;
            const isUnlocked = isSettled && unlockedChapters[ch.id];
            const isActive = activeChapterId === ch.id;
            return (
              <button
                key={ch.id}
                onClick={() => handleSeekTo(ch.startSec, ch.id)}
                className={`flex-1 flex flex-col items-center p-2 rounded-xl border transition-all duration-300 text-center ${
                  isUnlocked ? "opacity-100" : "opacity-40"
                } ${
                  isActive
                    ? "bg-[#0e0e14] border-white/30 text-white shadow-[0_0_15px_rgba(255,255,255,0.08)]"
                    : "bg-[#08080c]/80 border-white/[0.08] text-neutral-400 hover:text-white"
                }`}
              >
                <Icon className={`w-4 h-4 mb-1 ${isActive ? "text-white" : "text-neutral-400"}`} />
                <span className="text-[9px] font-mono leading-tight line-clamp-1">{ch.title}</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
