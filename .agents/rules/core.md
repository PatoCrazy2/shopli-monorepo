---
trigger: always_on
---

# ShopLI - Core Rules & Business Logic

## Reglas Críticas de Negocio y Base de Datos
- **Gestión de Roles:** El esquema de base de datos se limita exclusivamente a tres roles: `DUEÑO`,`CAJERO` y `ENCARGADO`. 
- **Alcance de Cajero:** El rol de `CAJERO` y `ENCARGADO` tienen un alcance global sobre el sistema. Pueden operar en todas las sucursales de la tienda; no existe vinculación ni restricción a una sucursal individual en el esquema.

### Matriz de Permisos por Rol

| Entidad / Acción | DUEÑO | ENCARGADO | CAJERO |
| :--- | :---: | :---: | :---: |
| **Ventas (POS)** | Crear, Leer | Crear, Leer | Crear, Leer |
| **Anular/Eliminar Venta** | Si | Si (Requiere log) | No |
| **Ajustar Inventario** | Si | Si (Requiere log) | No |
| **Crear/Editar Productos** | Si | Si | No |
| **Reportes Financieros** | Globales | Globales | Solo su turno |
| **Gestión de Usuarios** | Sí | No | No |

### Flujos de Interacción de los Actores

* **CAJERO:** Interactúa **exclusivamente** con la aplicación cliente (Vite/PWA). Su flujo principal es la apertura de caja, escaneo/búsqueda de productos, cobro (generación de ventas offline-first) y cierre de caja. No tiene acceso al Dashboard de Next.js.
* **ENCARGADO:** Utiliza tanto la PWA (para ventas o asistir a cajeros) como el Dashboard de Admin. Su interacción se centra en mantener el inventario al día, auditar cierres de caja.
* **DUEÑO:** Interactúa principalmente con el Dashboard (Next.js Admin). Su enfoque es la analítica: lectura de reportes consolidados de todas las sucursales, alta de nuevos cajeros/encargados,guardar contacto de proovedores, cambios masivos de precios y agregar productos .

### Reglas de Sesión por Actor
* **Cajeros compartidos:** Múltiples `CAJEROS` pueden usar el mismo dispositivo físico (POS) cerrando e iniciando sesión, o mediante un PIN rápido, pero cada venta debe estar firmada por el UUID del cajero activo.
* **Sesión Offline:** Un `CAJERO` puede iniciar ventas sin internet si ya tenía una sesión válida guardada en el dispositivo (token activo). Un `DUEÑO` requiere conexión constante para ver reportes en el Admin.

## Herramientas de IA (Antigravity/MCP)
- Todo código generado mediante agentes debe validar contra este documento antes de ser escrito en el sistema de archivos.
- Las migraciones de Prisma se generan localmente contra el contenedor de Docker antes de aplicarse a Neon.

## Testing
- Lógica de negocio debe estar desacoplada de UI.
- Todo cálculo financiero debe tener pruebas unitarias.
- Las migraciones de Prisma deben validarse en entorno local antes de producción.