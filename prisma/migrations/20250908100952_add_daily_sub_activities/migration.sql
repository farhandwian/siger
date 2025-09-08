-- CreateTable
CREATE TABLE "public"."daily_sub_activities" (
    "id" TEXT NOT NULL,
    "sub_activity_id" TEXT NOT NULL,
    "koordinat" JSONB,
    "catatan_kegiatan" TEXT,
    "file" JSONB,
    "progres_realisasi_per_hari" DOUBLE PRECISION DEFAULT 0,
    "tanggal_progres" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "daily_sub_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "daily_sub_activities_sub_activity_id_tanggal_progres_key" ON "public"."daily_sub_activities"("sub_activity_id", "tanggal_progres");

-- AddForeignKey
ALTER TABLE "public"."daily_sub_activities" ADD CONSTRAINT "daily_sub_activities_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
