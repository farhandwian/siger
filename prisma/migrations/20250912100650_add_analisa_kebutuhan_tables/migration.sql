-- CreateTable
CREATE TABLE "public"."kategori_kebutuhan" (
    "id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kategori_kebutuhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."kebutuhan" (
    "id" TEXT NOT NULL,
    "kategori_kebutuhan_id" TEXT NOT NULL,
    "nama" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "kebutuhan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."analisa_kebutuhan" (
    "id" TEXT NOT NULL,
    "sub_activity_id" TEXT NOT NULL,
    "kebutuhan_id" TEXT NOT NULL,
    "koefisien" DOUBLE PRECISION NOT NULL,
    "stok_harian" DOUBLE PRECISION DEFAULT 0,
    "terpasang" DOUBLE PRECISION DEFAULT 0,
    "total_sisa_stok_hari_ini" DOUBLE PRECISION DEFAULT 0,
    "tanggal" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "analisa_kebutuhan_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "kategori_kebutuhan_nama_key" ON "public"."kategori_kebutuhan"("nama");

-- CreateIndex
CREATE UNIQUE INDEX "analisa_kebutuhan_sub_activity_id_kebutuhan_id_tanggal_key" ON "public"."analisa_kebutuhan"("sub_activity_id", "kebutuhan_id", "tanggal");

-- AddForeignKey
ALTER TABLE "public"."kebutuhan" ADD CONSTRAINT "kebutuhan_kategori_kebutuhan_id_fkey" FOREIGN KEY ("kategori_kebutuhan_id") REFERENCES "public"."kategori_kebutuhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analisa_kebutuhan" ADD CONSTRAINT "analisa_kebutuhan_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."analisa_kebutuhan" ADD CONSTRAINT "analisa_kebutuhan_kebutuhan_id_fkey" FOREIGN KEY ("kebutuhan_id") REFERENCES "public"."kebutuhan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
