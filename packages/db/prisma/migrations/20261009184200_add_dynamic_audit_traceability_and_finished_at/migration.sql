-- AlterTable
ALTER TABLE "DynamicAudit" ADD COLUMN     "finalizadaPorId" TEXT,
ADD COLUMN     "finishedAt" TIMESTAMP(3),
ADD COLUMN     "iniciadaPorId" TEXT;

-- AlterTable
ALTER TABLE "DynamicAuditItem" ADD COLUMN     "contadoPorId" TEXT;

-- AddForeignKey
ALTER TABLE "DynamicAudit" ADD CONSTRAINT "DynamicAudit_iniciadaPorId_fkey" FOREIGN KEY ("iniciadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicAudit" ADD CONSTRAINT "DynamicAudit_finalizadaPorId_fkey" FOREIGN KEY ("finalizadaPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DynamicAuditItem" ADD CONSTRAINT "DynamicAuditItem_contadoPorId_fkey" FOREIGN KEY ("contadoPorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
