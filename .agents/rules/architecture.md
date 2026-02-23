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
- **Sincronización:** RxDB (o PowerSync) en cliente POS.
- **Estilos y UI:** Tailwind CSS + Shadcn/UI.

## Patrones de Desarrollo
- **Backend/Admin:** Priorizar React Server Components (RSC) y Server Actions en el Dashboard de Next.js. Las APIs deben usarse primariamente para servir datos al cliente POS.
- **Cliente POS (Offline-First):** La app de Vite asume desconexión constante. Todas las transacciones de ventas y consultas de inventario se resuelven contra la base de datos local (RxDB/PowerSync) y se sincronizan en background hacia el servidor central.

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