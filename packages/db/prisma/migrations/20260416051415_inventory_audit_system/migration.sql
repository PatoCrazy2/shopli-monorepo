-- CreateEnum
CREATE TYPE "AuditStatus" AS ENUM ('OPEN', 'CLOSED');

-- CreateTable
CREATE TABLE "DynamicAudit" (
    "id" TEXT NOT NULL,
    "sucursalId" TEXT NOT NULL,
    "status" "AuditStatus" NOT NULL DEFAULT 'OPEN',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isApplied" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "DynamicAudit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DynamicAuditItem" (
    "id" TEXT NOT NULL,
    "auditId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "initialStock" INTEGER NOT NULL,
    "countedQuantity" INTEGER,
    "countedAt" TIMESTAMP(3),
    "expectedAtCount" INTEGER,
    "difference" INTEGER,

    CONSTRAINT "DynamicAuditItem_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "DynamicAudit" ADD CONSTRAINT "DynamicAudit_sucursalId_fkey" FOREIGN KEY ("sucursalId") REFERENCES "Sucursal"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicAuditItem" ADD CONSTRAINT "DynamicAuditItem_auditId_fkey" FOREIGN KEY ("auditId") REFERENCES "DynamicAudit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicAuditItem" ADD CONSTRAINT "DynamicAuditItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Producto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
