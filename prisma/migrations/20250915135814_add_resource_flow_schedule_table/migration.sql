/*
  Warnings:

  - You are about to drop the column `tanggal` on the `analisa_kebutuhan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[sub_activity_id,kebutuhan_id]` on the table `analisa_kebutuhan` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "public"."analisa_kebutuhan_sub_activity_id_kebutuhan_id_tanggal_key";

-- AlterTable
ALTER TABLE "public"."analisa_kebutuhan" DROP COLUMN "tanggal";

-- CreateTable
CREATE TABLE "public"."resource_flow_schedules" (
    "id" TEXT NOT NULL,
    "analisa_kebutuhan_id" TEXT NOT NULL,
    "tanggal" TEXT NOT NULL,
    "rencana" DOUBLE PRECISION DEFAULT 0,
    "realisasi" DOUBLE PRECISION DEFAULT 0,
    "file" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "resource_flow_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "resource_flow_schedules_analisa_kebutuhan_id_tanggal_key" ON "public"."resource_flow_schedules"("analisa_kebutuhan_id", "tanggal");

-- CreateIndex
CREATE UNIQUE INDEX "analisa_kebutuhan_sub_activity_id_kebutuhan_id_key" ON "public"."analisa_kebutuhan"("sub_activity_id", "kebutuhan_id");

-- AddForeignKey
ALTER TABLE "public"."resource_flow_schedules" ADD CONSTRAINT "resource_flow_schedules_analisa_kebutuhan_id_fkey" FOREIGN KEY ("analisa_kebutuhan_id") REFERENCES "public"."analisa_kebutuhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
