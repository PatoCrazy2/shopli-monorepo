import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
              Política de Privacidad
            </h1>
            <p className="text-xs text-gray-400">Última actualización: Septiembre 2026</p>
          </div>
        </div>

        <div className="prose prose-gray max-w-none text-sm text-gray-600 space-y-6 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">1. Información General</h2>
            <p>
              En ShopLI nos comprometemos a proteger la privacidad y la confidencialidad de la información
              de nuestros clientes, usuarios y empresas registradas. Esta Política de Privacidad describe
              cómo recopilamos, utilizamos y protegemos sus datos al operar nuestra plataforma de punto de venta (POS)
              y paneles de administración.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">2. Datos Recopilados</h2>
            <p>
              Recopilamos únicamente la información necesaria para proporcionar nuestros servicios de gestión y analítica comercial:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li><strong>Datos de cuenta:</strong> Nombre, correo electrónico y credenciales seguras.</li>
              <li><strong>Autenticación con Google (OAuth 2.0):</strong> Cuando decide iniciar sesión con Google, recibimos su nombre y dirección de correo electrónico validada por Google para facilitar el acceso con un solo clic. No tenemos acceso a sus contraseñas de Google ni a su información personal externa.</li>
              <li><strong>Datos comerciales:</strong> Nombre del negocio, sucursales, catálogo de productos, registros de ventas y movimientos de inventario requeridos para la operación del punto de venta.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">3. Uso de la Información</h2>
            <p>
              La información recopilada se destina exclusivamente a:
            </p>
            <ul className="list-disc pl-5 mt-2 space-y-1">
              <li>Permitir la sincronización confiable de ventas y operaciones de inventario online/offline.</li>
              <li>Generar reportes analíticos y métricas financieras para el dueño del negocio.</li>
              <li>Garantizar el aislamiento multi-inquilino (*multi-tenant segregation*), impidiendo el acceso a datos entre diferentes empresas.</li>
              <li>Prevenir fraudes y accesos no autorizados a través de controles de seguridad en terminales y sesiones.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">4. Seguridad de los Datos</h2>
            <p>
              Implementamos cifrado en tránsito mediante protocolos HTTPS/TLS modernos, protección criptográfica de contraseñas mediante hashing Bcrypt, tokens firmados con HMAC-SHA256 para terminales POS y almacenamiento protegido en bases de datos empresariales.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">5. Derechos del Usuario</h2>
            <p>
              Usted conserva la propiedad completa de sus datos comerciales. En cualquier momento puede solicitar la consulta, corrección o eliminación de su cuenta y los registros asociados contactando al soporte técnico de ShopLI.
            </p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-gray-900 mb-2">6. Contacto</h2>
            <p>
              Si tiene preguntas o inquietudes sobre esta política de privacidad, puede comunicarse con nosotros a través de los canales oficiales de asistencia de ShopLI.
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
