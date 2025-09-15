-- AlterTable
ALTER TABLE "public"."projects" 
ADD COLUMN IF NOT EXISTS "lokasi_proyek" TEXT,
ADD COLUMN IF NOT EXISTS "peta_pekerjaan" JSONB,
ADD COLUMN IF NOT EXISTS "tanggal_spmk" TEXT;

-- CreateTable
CREATE TABLE "public"."action_plan_schedules" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT,
    "sub_activity_id" TEXT,
    "month" INTEGER NOT NULL,
    "year" INTEGER NOT NULL,
    "week" INTEGER NOT NULL,
    "plan_percentage" DOUBLE PRECISION DEFAULT 0,
    "actual_percentage" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "action_plan_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "public"."wilayah" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("kode")
);

-- CreateIndex
CREATE UNIQUE INDEX "action_plan_schedules_activity_id_month_year_week_key" ON "public"."action_plan_schedules"("activity_id", "month", "year", "week");

-- CreateIndex
CREATE UNIQUE INDEX "action_plan_schedules_sub_activity_id_month_year_week_key" ON "public"."action_plan_schedules"("sub_activity_id", "month", "year", "week");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "wilayah_nama_idx" ON "public"."wilayah"("nama");

-- AddForeignKey
ALTER TABLE "public"."action_plan_schedules" ADD CONSTRAINT "action_plan_schedules_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."action_plan_schedules" ADD CONSTRAINT "action_plan_schedules_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;
