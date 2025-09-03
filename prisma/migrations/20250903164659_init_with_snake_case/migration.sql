/*
  Warnings:

  - You are about to drop the column `changedAt` on the `project_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `fieldName` on the `project_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `newValue` on the `project_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `oldValue` on the `project_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `project_audit_logs` table. All the data in the column will be lost.
  - You are about to drop the column `akhirKontrak` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `alatData` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `bangunanDeviasi` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `bangunanProgress` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `bangunanTarget` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `fisikDeviasi` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `fisikProgress` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `fisikTarget` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `jenisPaket` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `jenisPengadaan` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `keuanganDeviasi` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `keuanganProgress` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `keuanganTarget` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `masaKontrak` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `materialData` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `nilaiKontrak` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `nomorKontrak` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `outputData` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `paguAnggaran` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `pembayaranTerakhir` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `penyediaJasa` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `saluranDeviasi` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `saluranProgress` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `saluranTarget` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `tanggalKontrak` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `tenagaKerjaData` on the `projects` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `projects` table. All the data in the column will be lost.
  - Added the required column `field_name` to the `project_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `project_id` to the `project_audit_logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updated_at` to the `projects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "public"."project_audit_logs" DROP CONSTRAINT "project_audit_logs_projectId_fkey";

-- AlterTable
ALTER TABLE "public"."project_audit_logs" DROP COLUMN "changedAt",
DROP COLUMN "fieldName",
DROP COLUMN "newValue",
DROP COLUMN "oldValue",
DROP COLUMN "projectId",
ADD COLUMN     "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "field_name" TEXT NOT NULL,
ADD COLUMN     "new_value" TEXT,
ADD COLUMN     "old_value" TEXT,
ADD COLUMN     "project_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."projects" DROP COLUMN "akhirKontrak",
DROP COLUMN "alatData",
DROP COLUMN "bangunanDeviasi",
DROP COLUMN "bangunanProgress",
DROP COLUMN "bangunanTarget",
DROP COLUMN "createdAt",
DROP COLUMN "fisikDeviasi",
DROP COLUMN "fisikProgress",
DROP COLUMN "fisikTarget",
DROP COLUMN "jenisPaket",
DROP COLUMN "jenisPengadaan",
DROP COLUMN "keuanganDeviasi",
DROP COLUMN "keuanganProgress",
DROP COLUMN "keuanganTarget",
DROP COLUMN "masaKontrak",
DROP COLUMN "materialData",
DROP COLUMN "nilaiKontrak",
DROP COLUMN "nomorKontrak",
DROP COLUMN "outputData",
DROP COLUMN "paguAnggaran",
DROP COLUMN "pembayaranTerakhir",
DROP COLUMN "penyediaJasa",
DROP COLUMN "saluranDeviasi",
DROP COLUMN "saluranProgress",
DROP COLUMN "saluranTarget",
DROP COLUMN "tanggalKontrak",
DROP COLUMN "tenagaKerjaData",
DROP COLUMN "updatedAt",
ADD COLUMN     "akhir_kontrak" TEXT,
ADD COLUMN     "alat_data" JSONB,
ADD COLUMN     "bangunan_deviasi" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "bangunan_progress" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "bangunan_target" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "fisik_deviasi" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "fisik_progress" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "fisik_target" DOUBLE PRECISION DEFAULT 100,
ADD COLUMN     "jenis_paket" TEXT,
ADD COLUMN     "jenis_pengadaan" TEXT,
ADD COLUMN     "keuangan_deviasi" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "keuangan_progress" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "keuangan_target" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "masa_kontrak" TEXT,
ADD COLUMN     "material_data" JSONB,
ADD COLUMN     "nilai_kontrak" TEXT,
ADD COLUMN     "nomor_kontrak" TEXT,
ADD COLUMN     "output_data" JSONB,
ADD COLUMN     "pagu_anggaran" TEXT,
ADD COLUMN     "pembayaran_terakhir" TEXT,
ADD COLUMN     "penyedia_jasa" TEXT,
ADD COLUMN     "saluran_deviasi" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saluran_progress" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "saluran_target" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "tanggal_kontrak" TEXT,
ADD COLUMN     "tenaga_kerja_data" JSONB,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL;

-- AddForeignKey
ALTER TABLE "public"."project_audit_logs" ADD CONSTRAINT "project_audit_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
