import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-gray-50/60 selection:bg-black selection:text-white font-sans text-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl p-8 sm:p-12 shadow-sm border border-gray-100">
        <Link
          href="/login"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-black transition-colors mb-8 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Volver a ShopLI</span>
        </Link>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center">
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
    </main>
  );
}
