/*
  Warnings:

  - Added the required column `updatedAt` to the `Detalle_Venta` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Detalle_Venta" ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "Producto" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "isCritical" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Proveedor" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "Sucursal" ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "numero_tel" TEXT,
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "InventoryAudit" (
    "id" TEXT NOT NULL,
    "turno_id" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "sucursal_id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "InventoryAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "expectedStock" INTEGER NOT NULL,
    "countedStock" INTEGER NOT NULL,
    "discrepancy" INTEGER NOT NULL,
    "reason" TEXT,
    "comments" TEXT,
    "resolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AuditItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "InventoryAudit" ADD CONSTRAINT "InventoryAudit_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditItem" ADD CONSTRAINT "AuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "InventoryAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuditItem" ADD CONSTRAINT "AuditItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
