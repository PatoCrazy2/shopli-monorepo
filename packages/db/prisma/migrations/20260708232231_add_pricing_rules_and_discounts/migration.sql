-- AlterTable
ALTER TABLE "Detalle_Venta" ADD COLUMN     "descuento_manual" DECIMAL(10,2) NOT NULL DEFAULT 0,
ADD COLUMN     "nota_descuento" TEXT;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "min_cantidad_mayoreo" INTEGER,
ADD COLUMN     "precio_mayoreo" DECIMAL(10,2);
