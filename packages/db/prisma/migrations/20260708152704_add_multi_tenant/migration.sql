-- CreateTable
CREATE TABLE "Empresa" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empresa_pkey" PRIMARY KEY ("id")
);

-- Seed Default Empresa (Protein Bar Club Zacatlan)
INSERT INTO "Empresa" ("id", "nombre", "createdAt", "updatedAt")
VALUES ('d3b07384-d113-49d6-a23d-4c3d82345678', 'Protein Bar Club Zacatlan', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- AlterTable (Add columns as nullable first)
ALTER TABLE "Producto" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "Proveedor" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "Sucursal" ADD COLUMN "empresa_id" TEXT;
ALTER TABLE "User" ADD COLUMN "empresa_id" TEXT;

-- Migration: Associate all existing records to the default Empresa
UPDATE "Producto" SET "empresa_id" = 'd3b07384-d113-49d6-a23d-4c3d82345678' WHERE "empresa_id" IS NULL;
UPDATE "Proveedor" SET "empresa_id" = 'd3b07384-d113-49d6-a23d-4c3d82345678' WHERE "empresa_id" IS NULL;
UPDATE "Sucursal" SET "empresa_id" = 'd3b07384-d113-49d6-a23d-4c3d82345678' WHERE "empresa_id" IS NULL;
UPDATE "User" SET "empresa_id" = 'd3b07384-d113-49d6-a23d-4c3d82345678' WHERE "empresa_id" IS NULL;

-- AlterTable (Enforce NOT NULL constraint now that columns are fully populated)
ALTER TABLE "Producto" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "Proveedor" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "Sucursal" ALTER COLUMN "empresa_id" SET NOT NULL;
ALTER TABLE "User" ALTER COLUMN "empresa_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sucursal" ADD CONSTRAINT "Sucursal_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Proveedor" ADD CONSTRAINT "Proveedor_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Producto" ADD CONSTRAINT "Producto_empresa_id_fkey" FOREIGN KEY ("empresa_id") REFERENCES "Empresa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
