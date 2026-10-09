---
trigger: always_on
---

# ShopLI - Architecture & Stack

## Stack Tecnológico (The Speed & Power Stack)
- **Gestión de Monorepo:** Turborepo + pnpm.
- **Frontend Admin (Dashboard):** Next.js 14+ (App Router).
- **Frontend POS (Cliente):** Vite + React (PWA Offline-First).
- **Base de Datos & ORM:** PostgreSQL (Neon en producción, Docker local) + Prisma.
- **Autenticación:** NextAuth.js (Auth.js).
- **Sincronización:** Dixie.js en cliente POS.
- **Estilos y UI:** Tailwind CSS + Shadcn/UI.

## Patrones de Desarrollo
- **Backend/Admin:** Priorizar React Server Components (RSC) y Server Actions en el Dashboard de Next.js. Las APIs deben usarse primariamente para servir datos al cliente POS.
- **Cliente POS (Offline-First):** La app de Vite asume desconexión constante. Todas las transacciones de ventas y consultas de inventario se resuelven contra la base de datos local (Dixie.js) y se sincronizan en background hacia el servidor central.

## Arquitectura Backend y Base de Datos
- **Next.js como API Central:** No existe un servidor backend separado (como Express o Nest). La aplicación `apps/admin` expone endpoints REST a través de `app/api/...` exclusivamente para servir a la aplicación cliente Vite (`apps/pos`).
- **Paquete de Base de Datos:** Todo el esquema de PostgreSQL, migraciones, seeders y el cliente de Prisma deben aislarse en un workspace independiente llamado `packages/db`.
- **Exportación Estricta:** El paquete `packages/db` debe exportar obligatoriamente la instancia de `PrismaClient` y todos los tipos/enums generados (ej. `UserRole`) para ser consumidos con seguridad de tipos por Next.js.

## Sincronización y Resolución de Conflictos
- El servidor es la fuente de verdad final.
- Las ventas generadas offline reciben UUID en cliente.
- En caso de conflicto de inventario:
  - Se prioriza el primer registro sincronizado.
- La sincronización debe ser idempotente.

## Arquitectura POS
- UI renderiza
- Hooks manejan estado
- Lógica compleja se abstrae
- Nada de lógica de negocio dentro de JSX

## Estándares de PWA y Service Worker (Admin & POS)
- **Start URL Limpio:** Debe apuntar directamente a una ruta renderizable final (ej. `/dashboard/inicio`), evitando rutas intermedias con redirecciones HTTP 307.
- **Identificador de App Inmutable:** El `id` del manifest debe conservarse intacto (`/dashboard`) para no fragmentar o desinstalar la PWA existente en dispositivos móviles/desktop.
- **Resiliencia de Navegación:** Toda petición de navegación interceptada por el Service Worker debe contar con un timeout controlado (5-6s mediante `AbortController`) y fallback fluido a caché o `/offline.html` para evitar congelamiento de WebView (especialmente en iOS WebKit tras suspensión nocturna o cold start de BD).
- **Aislamiento de Redirecciones:** Respuestas con `redirected === true` jamás deben almacenarse en `CacheStorage` para evitar servir pantallas de auth o redirección bajo rutas protegidas.
- **Registro y Ciclo de Vida:** Utilizar `updateViaCache: "none"` en el registro del Service Worker y disparar `registration.update()` en eventos `visibilitychange` para forzar actualizaciones inmediatas al volver a primer plano.