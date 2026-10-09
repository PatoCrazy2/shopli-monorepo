# Arquitectura Futura: Módulo de Compras e Ingreso de Mercancía

Este documento define la arquitectura y estrategia de implementación para el futuro **Módulo de Compras**, diseñado para resolver la necesidad de rastrear la inversión financiera (flujo de efectivo) en mercancía, separándolo de la simple valoración actual del inventario.

## 1. Concepto Central: "POS Inverso"
El ingreso de nueva mercancía al sistema dejará de ser una simple edición manual del catálogo de productos. Se implementará un flujo similar a un Punto de Venta (POS) pero a la inversa:
* El usuario (Dueño o Encargado autorizado) abrirá una interfaz de **"Recepción de Mercancía"**.
* Escaneará o buscará los productos que llegaron en el pedido del proveedor.
* Ingresará las cantidades recibidas y confirmará el **costo unitario** actual (permitiendo detectar fluctuaciones de inflación).
* Al confirmar, el sistema sumará el stock de todos los productos en bloque y generará un registro inmutable de la inversión total.

## 2. Impacto en el Sistema Actual

### A. Catálogo y Edición de Productos
* El campo `stock` en el formulario estándar de creación/edición de productos pasará a ser de **solo lectura** (o estará estrictamente bloqueado tras la creación inicial).
* Ya no será posible agregar mercancía "silenciosamente" desde el catálogo.

### B. Módulo de Ajustes de Inventario
* El submódulo de *Ajustes* cambiará su propósito para ser **exclusivo de excepciones**.
* Se eliminarán motivos como "Ingreso de Mercancía" o "Compra".
* Los únicos motivos válidos para un ajuste manual serán:
  1. Merma / Daño
  2. Caducidad
  3. Robo o Extravío
  4. Corrección por Auditoría (Conteo físico)

### C. Analíticas y Reportes Financieros
* **Flujo de Efectivo (Cashflow Real):** Se agregará la capacidad de calcular la utilidad real neta: `Ingresos (Ventas) - Gastos Operativos (Renta, Nómina) - Compras (Inversión en Mercancía)`.
* **Métricas de Rotación:** Nueva comparativa de `Compras vs Ventas` mensuales para detectar sobre-inventariado.
* **Valorización Actual:** El KPI de "Valor de Inventario Actual" (`stock actual * costo en catálogo`) se mantendrá intacto, funcionando de manera paralela y en tiempo real.

## 3. Estrategia de Migración: "Línea de Arena"
Para manejar los datos históricos de inventario registrados antes de esta actualización, se aplicará la estrategia de **Línea de Arena (Line in the Sand)**:
* **Sin retroactividad financiera:** No se intentará inferir ni calcular cuánto se gastó en mercancía en meses anteriores.
* **Inicio Limpio:** A partir del día de despliegue del nuevo módulo, los reportes de "Inversión en Compras" iniciarán desde $0. 
* **Preservación de Stock:** El número de stock existente en la base de datos se respetará totalmente; los productos mantendrán sus cantidades, simplemente el registro financiero de compras comenzará a auditarse desde ese momento en adelante.

## 4. Estructura Sugerida de Base de Datos (Borrador Prisma)
Cuando se implemente, se requerirán entidades similares a estas en `packages/db`:

```prisma
model Compra {
  id          String   @id @default(uuid())
  empresa_id  String
  sucursal_id String
  usuario_id  String   // Quien recibió la mercancía
  total       Float    // Total invertido en la factura
  fecha       DateTime @default(now())
  notas       String?

  detalles    CompraDetalle[]
}

model CompraDetalle {
  id             String  @id @default(uuid())
  compra_id      String
  producto_id    String
  cantidad       Int
  costo_unitario Float   // El costo exacto en el momento de la compra
  subtotal       Float
}
```
