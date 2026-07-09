-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "parent_id" TEXT,
ADD COLUMN     "variante_nombre" TEXT;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "Producto"("id") ON DELETE CASCADE ON UPDATE CASCADE;
