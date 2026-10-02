-- CreateIndex
CREATE INDEX "MovimientoInventario_fecha_idx" ON "MovimientoInventario"("fecha" DESC);

-- CreateIndex
CREATE INDEX "MovimientoInventario_sucursal_id_fecha_idx" ON "MovimientoInventario"("sucursal_id", "fecha" DESC);
