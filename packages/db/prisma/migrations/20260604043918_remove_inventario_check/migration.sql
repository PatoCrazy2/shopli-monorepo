-- Remove negative stock constraint on sucursal inventory
ALTER TABLE "Inventario_Sucursal" DROP CONSTRAINT "inventario_cantidad_check";