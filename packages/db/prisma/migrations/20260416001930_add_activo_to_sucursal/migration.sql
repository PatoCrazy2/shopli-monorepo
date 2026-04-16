-- CreateEnum
CREATE TYPE "GastoCategoria" AS ENUM ('NOMINA', 'RENTA', 'VARIABLE', 'MERCANCIA', 'CAJA_CHICA');

-- AlterTable
ALTER TABLE "Sucursal" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "Turno" ADD COLUMN     "monto_final" DECIMAL(10,2);

-- CreateTable
CREATE TABLE "Gasto" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "categoria" "GastoCategoria" NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "descripcion" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor_id" TEXT,
    "sync_status" "SyncStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Gasto_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_sucursal_id_fkey" FOREIGN KEY ("sucursal_id") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_proveedor_id_fkey" FOREIGN KEY ("proveedor_id") REFERENCES "Proveedor"("id") ON DELETE SET NULL ON UPDATE CASCADE;
