-- AlterTable
ALTER TABLE "public"."analisa_kebutuhan" ADD COLUMN     "hasil" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "hasil_analisa_kebutuhan" DOUBLE PRECISION DEFAULT 0,
ADD COLUMN     "satuan_hasil" TEXT,
ADD COLUMN     "satuan_hasil_analisa_kebutuhan" TEXT;
