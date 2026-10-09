-- CreateIndex
CREATE INDEX "DynamicAudit_sucursalId_startedAt_idx" ON "DynamicAudit"("sucursalId", "startedAt");

-- CreateIndex
CREATE INDEX "DynamicAuditItem_auditId_idx" ON "DynamicAuditItem"("auditId");
