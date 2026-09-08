import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="relative min-h-screen w-full flex flex-col justify-between items-center bg-[#09090b] text-neutral-100 font-sans selection:bg-black selection:text-white overflow-x-hidden p-6 sm:p-8">
      {/* Background Image idéntico al login con viñeta y ambientación */}
      <div className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden">
        <Image
          src="/shopli-hero-readme.webp"
          alt="ShopLI Background"
          fill
          priority
          className="object-cover object-center opacity-40 brightness-75 scale-105"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#09090b]/60 to-[#09090b]/95" />
        <div className="absolute inset-0 bg-gradient-to-b from-[#09090b]/70 via-[#09090b]/30 to-[#09090b]/90" />
      </div>

      {/* Header / Top Navigation Bar */}
      <header className="relative z-10 w-full max-w-4xl flex items-center justify-between mb-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-neutral-400 hover:text-white transition-colors duration-200 group py-2"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          <span>Volver a ShopLI</span>
        </Link>
      </header>

      {/* Contenedor del texto en blanco */}
      <div className="relative z-10 w-full max-w-4xl mx-auto bg-white rounded-2xl p-8 sm:p-12 shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/20 text-gray-900 my-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center shadow-sm">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Condiciones del Servicio
            </h1>
            <p className="text-xs text-gray-400">Última actualización: Septiembre 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-6 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Aceptación de los Términos</h2>
            <p>
              Al registrarse, acceder o utilizar la plataforma ShopLI (incluyendo el panel de administración
              y las aplicaciones cliente de punto de venta), usted acepta regirse por los presentes Términos
              y Condiciones de Servicio. Si no está de acuerdo con alguna disposición, deberá abstenerse de utilizar el servicio.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Descripción del Servicio</h2>
            <p>
              ShopLI provee una plataforma integral de software como servicio (SaaS) diseñada para la gestión comercial,
              administración de sucursales, control de inventario, auditorías ciegas y facturación en terminales de punto de venta
              con soporte para transacciones offline-first y sincronización en la nube.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Cuentas y Seguridad</h2>
            <p>
              El titular de la cuenta es responsable de mantener la confidencialidad de sus credenciales de acceso,
              así como de las acciones realizadas por los cajeros y encargados autorizados en su empresa. ShopLI implementa
              bloqueos de seguridad progresivos y revocación dinámica de terminales para mitigar accesos no autorizados.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Suscripciones, Pruebas Gratuitas y Pagos</h2>
            <p>
              ShopLI ofrece un período de prueba gratuito (Free Trial) de 14 días con acceso completo a las funciones comerciales,
              seguido de un período de gracia de 3 días. Concluido este periodo, el acceso a la plataforma requiere la contratación
              de un plan activo (Arranque, Crecimiento o Multi-Sucursal) procesado de manera segura a través de pasarelas de pago certificadas (Stripe).
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Propiedad Intelectual y de los Datos</h2>
            <p>
              Todo el código, diseño, arquitectura e interfaces de ShopLI son propiedad exclusiva de la plataforma.
              El usuario conserva en todo momento la titularidad exclusiva sobre sus datos comerciales, productos,
              ventas y registros financieros alojados en el sistema.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Limitación de Responsabilidad</h2>
            <p>
              ShopLI implementa protocolos avanzados de resiliencia y recálculo de inventario, pero no se hace responsable
              por fallos originados por fuerza mayor, manipulación indebida de hardware local o negligencia en el resguardo
              de credenciales por parte del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">7. Modificaciones a los Términos</h2>
            <p>
              Nos reservamos el derecho de actualizar estos términos periódicamente para reflejar mejoras operativas o normativas.
              Las modificaciones sustanciales serán notificadas a través del panel de control de la plataforma.
            </p>
          </section>
        </div>

        <div className="mt-10 pt-6 border-t border-gray-100 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} ShopLI Platform. Todos los derechos reservados.
        </div>
      </div>

      {/* Footer mínimo */}
      <footer className="relative z-10 w-full max-w-4xl py-6 text-center text-xs text-neutral-500">
        ShopLI &copy; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
