---
trigger: model_decision
description: Aplica esta regla cuando trabajes en el frontend, crees o modifiques componentes de UI, layouts, o escribas estilos con Tailwind CSS y Shadcn UI en las aplicaciones POS o Admin.
---

# ShopLI - UI & UX Rules

## 1. Filosofía de Diseño y Estética Visual
- **Estilo Apple (Clean & Crisp):** La interfaz prioriza el espacio en blanco (whitespace), grises muy suaves para fondos secundarios (`bg-gray-50` o `bg-zinc-50`), y un contraste altísimo para el texto. Sombras muy sutiles solo para elevar elementos interactivos (tarjetas o modales).
- **Minimalist Mode (Único Tema):** No se mantendrán variables complejas de temas. El esquema es estrictamente minimalista.
- **Color de Acento:** Negro puro (`#000000` o `bg-black`). Los botones de acción principal (Primary Buttons) deben ser negros con texto blanco. No se usan colores vibrantes para acciones primarias, salvo para estados de error (rojo) o advertencias (amarillo).
- **Tipografía:** **Geist** (Geist Sans). Debe configurarse como la fuente base (`font-sans`) en todo el ecosistema (`packages/ui`, `admin`, `pos`).

## 2. Geometría y Sistema de Componentes (Shadcn/UI)
- **Bordes (Border Radius):** Ligeramente redondeados para un estándar moderno y amigable. En la configuración global de Shadcn (`components.json` y variables CSS), el radio base debe fijarse en `0.5rem` (8px). 
- **Componentes Compartidos:** Todo componente base (botones, inputs, modales) se genera vía Shadcn dentro de `packages/ui` y se exporta para que `apps/admin` y `apps/pos` los consuman.

## 3. Experiencia por Aplicación (POS vs Admin)
- **Frontend POS (Cliente Vite):**
  - **Touch-Friendly:** Es una PWA pensada para pantallas táctiles. Los botones, inputs y áreas de clic (tap targets) deben ser grandes (mínimo `h-12` o 48px de alto).
  - **Flujo de Venta:** Menos es más. Reducir al máximo los clics necesarios para cobrar.
  - **Feedback de Venta Exitosa:** Al finalizar un cobro, se debe bloquear la pantalla con un **Modal Grande y céntrico** que indique el éxito de la operación. El cajero *debe* presionar "OK" (o Enter) explícitamente para limpiar el carrito y volver a la pantalla de ventas.
- **Frontend Admin (Dashboard Next.js):**
  - **Baja Densidad de Datos:** Priorizar el "aire" en la interfaz. Las métricas deben ser gigantes (ej. `text-5xl`), los gráficos deben tener márgenes amplios, y las tablas deben tener un `padding` generoso (no usar tablas compactas). El dueño debe poder escanear la salud del negocio de un vistazo sin sentirse abrumado.

## 4. Rendimiento Perceptual y Animaciones
- **Velocidad Absoluta (Zero-Animations):** La aplicación debe sentirse ultra rápida. **Regla estricta:** Deshabilitar transiciones y animaciones innecesarias. Clics, apertura de modales, cambios de pestaña y renderizado de listas deben ser *instantáneos*. (Evitar clases como `transition-all`, `duration-200`, `animate-in` salvo casos extremadamente justificados).

## 5. Experiencia Offline-First (RxDB / PowerSync)
- **Indicador de Conexión (El Semáforo Sutil):** El estado de la red NO debe ser intrusivo. Se utilizará un pequeño indicador visual (tipo semáforo: círculo verde/amarillo/rojo) en la barra de navegación superior (esquina).
- **Comportamiento Offline:** Si el semáforo está amarillo/rojo (sin internet o sincronizando), el cajero debe poder seguir operando con total normalidad. La UI no debe bloquearse ni mostrar banners de advertencia gigantes que interrumpan el flujo de trabajo.