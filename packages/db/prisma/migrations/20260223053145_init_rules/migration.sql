-- CreateEnum
CREATE TYPE "Role" AS ENUM ('DUEÑO', 'ENCARGADO', 'CAJERO');

-- CreateEnum
CREATE TYPE "EstadoTurno" AS ENUM ('ABIERTO', 'CERRADO');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "SyncStatus" AS ENUM ('PENDING', 'SYNCED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CAJERO',
    "pin_hash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sucursal" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "direccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Proveedor" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "contacto" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Proveedor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Producto" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "codigo_interno" TEXT,
    "descripcion" TEXT,
    "costo" DECIMAL(10,2) NOT NULL,
    "precio_publico" DECIMAL(10,2) NOT NULL,
    "categoria" TEXT,
    "proveedor_id" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Producto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Inventario_Sucursal" (
    "id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Inventario_Sucursal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Turno" (
    "id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "estado" "EstadoTurno" NOT NULL DEFAULT 'ABIERTO',
    "monto_inicial" DECIMAL(10,2) NOT NULL,
    "total_ventas" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "fecha_apertura" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cierre" TIMESTAMP(3),

    CONSTRAINT "Turno_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "total" DECIMAL(10,2) NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'COMPLETADA',
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Detalle_Venta" (
    "id" TEXT NOT NULL,
    "venta_id" TEXT NOT NULL,
    "producto_id" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "precio_unitario_historico" DECIMAL(10,2) NOT NULL,

    CONSTRAINT "Detalle_Venta_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_nombre_key" ON "Proveedor"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Producto_codigo_interno_key" ON "Producto"("codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "Inventario_Sucursal_sucursal_id_producto_id_key" ON "Inventario_Sucursal"("sucursal_id", "producto_id");

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario_Sucursal" ADD CONSTRAINT "Inventario_Sucursal_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Inventario_Sucursal" ADD CONSTRAINT "Inventario_Sucursal_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Turno" ADD CONSTRAINT "Turno_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Venta" ADD CONSTRAINT "Venta_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_Venta" ADD CONSTRAINT "Detalle_Venta_venta_id_fkey" FOREIGN KEY ("venta_id") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Detalle_Venta" ADD CONSTRAINT "Detalle_Venta_producto_id_fkey" FOREIGN KEY ("producto_id") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- 1. User: pin_hash obligatorio para Cajero o Encargado
ALTER TABLE "User" ADD CONSTRAINT "pin_hash_required" 
CHECK ("role" = 'DUEÑO' OR "pin_hash" IS NOT NULL);

-- 2. Producto: costo y precio_publico >= 0, precio_publico >= costo
ALTER TABLE "Producto" ADD CONSTRAINT "producto_precios_check" 
CHECK ("costo" >= 0 AND "precio_publico" >= "costo");

-- 3. Inventario_Sucursal: cantidad >= 0
ALTER TABLE "Inventario_Sucursal" ADD CONSTRAINT "inventario_cantidad_check" 
CHECK ("cantidad" >= 0);

-- 4. Turnos: Un usuario solo puede tener 1 turno ABIERTO
CREATE UNIQUE INDEX "Turno_usuario_id_abierto_key" 
ON "Turno"("usuario_id") WHERE "estado" = 'ABIERTO';

-- 5. Turnos: reglas de fecha y dinero
ALTER TABLE "Turno" ADD CONSTRAINT "turno_cierre_check" 
CHECK ("estado" = 'ABIERTO' OR ("fecha_cierre" > "fecha_apertura" AND "fecha_cierre" IS NOT NULL));

ALTER TABLE "Turno" ADD CONSTRAINT "turno_dinero_check" 
CHECK ("monto_inicial" >= 0 AND "total_ventas" >= 0);

-- 6. Ventas: inmutabilidad total y fecha si COMPLETADA
CREATE OR REPLACE FUNCTION check_venta_inmutabilidad() RETURNS trigger AS $$
BEGIN
  IF OLD.estado = 'COMPLETADA' AND (NEW.total <> OLD.total OR NEW.fecha <> OLD.fecha) THEN
    RAISE EXCEPTION 'Venta COMPLETADA no puede modificar total o fecha';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_venta_inmutabilidad
BEFORE UPDATE ON "Venta"
FOR EACH ROW EXECUTE FUNCTION check_venta_inmutabilidad();

-- 7. Detalle_Ventas: inmutabilidad total (sin UPDATE/DELETE)
CREATE OR REPLACE FUNCTION prevent_detalle_update_delete() RETURNS trigger AS $$
BEGIN
  RAISE EXCEPTION 'Operaciones UPDATE y DELETE están prohibidas en Detalle_Venta';
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_prevent_detalle_update
BEFORE UPDATE ON "Detalle_Venta"
FOR EACH ROW EXECUTE FUNCTION prevent_detalle_update_delete();

CREATE TRIGGER trigger_prevent_detalle_delete
BEFORE DELETE ON "Detalle_Venta"
FOR EACH ROW EXECUTE FUNCTION prevent_detalle_update_delete();

-- 8. Detalle_Venta: Cantidad mayor a 0
ALTER TABLE "Detalle_Venta" ADD CONSTRAINT "detalle_cantidad_check" 
CHECK ("cantidad" > 0);
