import Link from "next/link";
import { ArrowLeft, Shield } from "lucide-react";

export default function PrivacyPage() {
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
    </main>
  );
}
