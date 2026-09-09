"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

export default function PhoneShowcaseSection() {
  const sectionRef = useRef<HTMLElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isSettled, setIsSettled] = useState(false);
  const [isScreenOn, setIsScreenOn] = useState(false);

  useEffect(() => {
    let animationFrameId: number;

    const handleScroll = () => {
      if (!sectionRef.current) return;
      const rect = sectionRef.current.getBoundingClientRect();
      const totalScrollable = rect.height - window.innerHeight;
      if (totalScrollable <= 0) return;

      const current = -rect.top;
      const progress = Math.min(Math.max(current / totalScrollable, 0), 1);

      setScrollProgress(progress);

      const settledThreshold = 0.44;
      const settled = progress >= settledThreshold;
      setIsSettled(settled);

      if (settled) {
        setIsScreenOn(true);
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => {
            // Manejo de restricciones de autoplay
          });
        }
      } else if (progress < 0.32) {
        setIsScreenOn(false);
        if (videoRef.current && !videoRef.current.paused) {
          videoRef.current.pause();
        }
      }
    };

    const onScroll = () => {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = requestAnimationFrame(handleScroll);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    handleScroll();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Curva de interpolación suave (cubic ease-out) para la trayectoria 3D
  // El teléfono viaja y gira durante el primer 44% del recorrido de scroll
  const turnPhase = Math.min(scrollProgress / 0.44, 1);
  const easedTurn = 1 - Math.pow(1 - turnPhase, 3);

  // Parámetros de transformación 3D:
  // Inicia mostrando la cara trasera (180deg) desde la derecha (+42vw),
  // y gira con profundidad hasta ponerse 100% de frente (0deg) en el centro (0vw).
  const translateX = (1 - easedTurn) * 42; // De 42vw a 0
  const translateY = (1 - easedTurn) * 16; // De 16px a 0
  const rotateY = (1 - easedTurn) * 180; // De 180deg (dorso) a 0deg (frente)
  const rotateZ = (1 - easedTurn) * -10; // De -10deg a 0deg
  const scale = 0.85 + easedTurn * 0.15; // De 0.85 a 1.00
  const opacity = 0.25 + easedTurn * 0.75; // De 0.25 a 1.00

  return (
    <section
      ref={sectionRef}
      id="capacidades"
      className="relative z-20 w-full h-[280vh] bg-[#050507]"
    >
      {/* Viewport Fijo: La pantalla se detiene por completo mientras el teléfono hace su recorrido */}
      <div className="sticky top-0 h-screen w-full flex flex-col items-center justify-center overflow-hidden px-4 sm:px-6 lg:px-8">
        {/* Luz ambiental de fondo de lujo (Glow difuso que se ilumina al encenderse el teléfono) */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden flex items-center justify-center">
          <div
            className="w-[500px] h-[500px] sm:w-[750px] sm:h-[750px] bg-gradient-to-tr from-white/[0.04] via-neutral-300/[0.03] to-transparent rounded-full blur-[140px] transition-all duration-700"
            style={{
              opacity: isScreenOn ? 0.9 : 0.3 + easedTurn * 0.4,
              transform: `scale(${isScreenOn ? 1.08 : 0.95})`,
            }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[600px] bg-white/[0.025] rounded-full blur-[90px] transition-opacity duration-700"
            style={{ opacity: isScreenOn ? 0.8 : 0.2 + easedTurn * 0.4 }}
          />
        </div>

        {/* Encabezado cinemático: Fijo y estable */}
        <div className="relative z-10 text-center max-w-2xl mx-auto mb-4 sm:mb-6 select-none pointer-events-none">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-white/10 bg-white/[0.03] backdrop-blur-md text-xs text-neutral-300 mb-2 sm:mb-3 tracking-wide">
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

        {/* Escenario de Perspectiva 3D: Cámara fija con perspectiva profunda */}
        <div
          className="relative z-10 flex items-center justify-center w-full max-w-4xl"
          style={{
            perspective: "1200px",
            perspectiveOrigin: "50% 50%",
          }}
        >
          {/* Capa 1 (Envolvente 2D): Maneja la opacidad y la sombra proyectada SIN aplanar el espacio 3D */}
          <div
            className="relative flex items-center justify-center"
            style={{
              opacity,
              filter: `drop-shadow(0 35px 70px rgba(0, 0, 0, 0.95)) drop-shadow(0 0 ${
                isScreenOn ? 35 : 15
              }px rgba(255, 255, 255, ${isScreenOn ? 0.08 : 0.02}))`,
              transition: "filter 0.5s ease-out",
            }}
          >
            {/* Capa 2: Contenedor 3D Puro (Preserve-3D absoluto sin filtros ni máscaras) */}
            <div
              className="relative h-[50vh] sm:h-[54vh] max-h-[480px] aspect-[2620/5416] will-change-transform"
              style={{
                transformStyle: "preserve-3d",
                transform: `translateX(${translateX}vw) translateY(${translateY}px) rotateX(${
                  (1 - easedTurn) * 8
                }deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
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

              {/* ----------------- CARA TRASERA (iphone-back.png con cámaras) ----------------- */}
              <div
                className="absolute inset-0 pointer-events-none select-none"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateY(180deg) translateZ(6px)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  visibility: rotateY > 85 ? "visible" : "hidden",
                  zIndex: rotateY > 85 ? 20 : 1,
                }}
              >
                <div className="relative w-full h-full scale-[1.08] -translate-x-[0.6%]">
                  <Image
                    src="/iphone-back.png"
                    alt="iPhone 16 Titanium Back"
                    fill
                    priority
                    className="object-contain pointer-events-none select-none"
                  />
                </div>
                {/* Reflejo metálico trasero sobre el titanio */}
                <div className="absolute inset-0 rounded-[44px] bg-gradient-to-tr from-transparent via-white/[0.04] to-transparent pointer-events-none" />
              </div>

              {/* ----------------- CARA FRONTAL (mockup.png + pantalla + video) ----------------- */}
              <div
                className="absolute inset-0"
                style={{
                  transformStyle: "preserve-3d",
                  transform: "rotateY(0deg) translateZ(6px)",
                  backfaceVisibility: "hidden",
                  WebkitBackfaceVisibility: "hidden",
                  visibility: rotateY <= 95 ? "visible" : "hidden",
                  zIndex: rotateY <= 95 ? 20 : 1,
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

                {/* Chasis Frontal PNG con Dynamic Island y Biseles */}
                <Image
                  src="/mockup.png"
                  alt="ShopLI POS iPhone 16 Front Frame"
                  fill
                  priority
                  className="pointer-events-none select-none z-30 object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
