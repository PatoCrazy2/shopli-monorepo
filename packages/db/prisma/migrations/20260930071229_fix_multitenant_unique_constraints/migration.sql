-- DropIndex
DROP INDEX "Producto_codigo_interno_key";

-- DropIndex
DROP INDEX "Proveedor_nombre_key";

-- CreateIndex
CREATE UNIQUE INDEX "Producto_empresa_id_codigo_interno_key" ON "Producto"("empresa_id", "codigo_interno");

-- CreateIndex
CREATE UNIQUE INDEX "Proveedor_empresa_id_nombre_key" ON "Proveedor"("empresa_id", "nombre");
