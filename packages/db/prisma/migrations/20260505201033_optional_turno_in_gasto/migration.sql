-- DropForeignKey
ALTER TABLE "Gasto" DROP CONSTRAINT "Gasto_turno_id_fkey";

-- AlterTable
ALTER TABLE "Gasto" ALTER COLUMN "turno_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Gasto" ADD CONSTRAINT "Gasto_turno_id_fkey" FOREIGN KEY ("turno_id") REFERENCES "Turno"("id") ON DELETE SET NULL ON UPDATE CASCADE;
