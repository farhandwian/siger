/*
  Warnings:

  - You are about to drop the column `weight` on the `activities` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."activities" DROP COLUMN "weight";

-- AlterTable
ALTER TABLE "public"."sub_activities" ADD COLUMN     "bobot_mc0" DOUBLE PRECISION,
ADD COLUMN     "satuan" TEXT,
ADD COLUMN     "volume_kontrak" DOUBLE PRECISION,
ADD COLUMN     "volume_mc0" DOUBLE PRECISION;

-- CreateTable
CREATE TABLE "public"."materials" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "jenis_material" TEXT NOT NULL,
    "volume_satuan" TEXT NOT NULL DEFAULT 'm3',
    "volume_target" DOUBLE PRECISION DEFAULT 0,
    "tanggal_mulai" TEXT,
    "tanggal_selesai" TEXT,
    "waktu_selesai" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "materials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."material_schedules" (
    "id" TEXT NOT NULL,
    "material_id" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "rencana" DOUBLE PRECISION DEFAULT 0,
    "rencana_kumulatif" DOUBLE PRECISION DEFAULT 0,
    "realisasi" DOUBLE PRECISION DEFAULT 0,
    "realisasi_kumulatif" DOUBLE PRECISION DEFAULT 0,
    "tercapai" TEXT DEFAULT 'Y',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "material_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "material_schedules_material_id_date_key" ON "public"."material_schedules"("material_id", "date");

-- AddForeignKey
ALTER TABLE "public"."materials" ADD CONSTRAINT "materials_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."material_schedules" ADD CONSTRAINT "material_schedules_material_id_fkey" FOREIGN KEY ("material_id") REFERENCES "public"."materials"("id") ON DELETE CASCADE ON UPDATE CASCADE;
