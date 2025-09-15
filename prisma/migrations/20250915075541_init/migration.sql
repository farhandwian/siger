-- CreateEnum
CREATE TYPE "public"."UserRole" AS ENUM ('ADMIN_SISTEM', 'ADMIN_BALAI', 'DIRJEN_SDA', 'KABALAI', 'SATKER', 'PPK', 'VENDOR');

-- CreateEnum
CREATE TYPE "public"."ProjectAssignmentRole" AS ENUM ('PPK', 'VENDOR');

-- CreateTable
CREATE TABLE "public"."balai" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "balai_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."satkers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "description" TEXT,
    "balai_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "satkers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "pekerjaan" TEXT,
    "spmk" TEXT,
    "akhir_kontrak" TEXT,
    "alat_data" JSONB,
    "bangunan_deviasi" DOUBLE PRECISION DEFAULT 0,
    "bangunan_progress" DOUBLE PRECISION DEFAULT 0,
    "bangunan_target" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fisik_deviasi" DOUBLE PRECISION DEFAULT 0,
    "fisik_progress" DOUBLE PRECISION DEFAULT 0,
    "fisik_target" DOUBLE PRECISION DEFAULT 100,
    "jenis_paket" TEXT,
    "jenis_pengadaan" TEXT,
    "keuangan_deviasi" DOUBLE PRECISION DEFAULT 0,
    "keuangan_progress" DOUBLE PRECISION DEFAULT 0,
    "keuangan_target" DOUBLE PRECISION DEFAULT 0,
    "masa_kontrak" TEXT,
    "material_data" JSONB,
    "nilai_kontrak" TEXT,
    "nomor_kontrak" TEXT,
    "output_data" JSONB,
    "pagu_anggaran" TEXT,
    "pembayaran_terakhir" TEXT,
    "penyedia_jasa" TEXT,
    "saluran_deviasi" DOUBLE PRECISION DEFAULT 0,
    "saluran_progress" DOUBLE PRECISION DEFAULT 0,
    "saluran_target" DOUBLE PRECISION DEFAULT 0,
    "tanggal_kontrak" TEXT,
    "tenaga_kerja_data" JSONB,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "lokasi_proyek" TEXT,
    "peta_pekerjaan" JSONB,
    "tanggal_spmk" TEXT,
    "satker_id" TEXT,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_audit_logs" (
    "id" TEXT NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "field_name" TEXT NOT NULL,
    "new_value" TEXT,
    "old_value" TEXT,
    "project_id" TEXT NOT NULL,

    CONSTRAINT "project_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."addendums" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "addendum_number" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "old_value" TEXT,
    "new_value" TEXT,
    "change_type" TEXT NOT NULL,
    "effective_date" TIMESTAMP(3),
    "document_path" TEXT,
    "approved_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "addendums_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."activities" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sub_activities" (
    "id" TEXT NOT NULL,
    "activity_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "satuan" TEXT,
    "volume" DOUBLE PRECISION,

    CONSTRAINT "sub_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."schedules" (
    "id" TEXT NOT NULL,
    "sub_activity_id" TEXT NOT NULL,
    "week_number" INTEGER NOT NULL,
    "plan" DOUBLE PRECISION DEFAULT 0,
    "action_plan" DOUBLE PRECISION DEFAULT 0,
    "realization" DOUBLE PRECISION DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "schedules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),
    "password" TEXT NOT NULL,
    "role" "public"."UserRole" NOT NULL DEFAULT 'PPK',
    "balai_id" TEXT,
    "satker_id" TEXT,
    "device_info" JSONB,
    "last_mobile_sync" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "provider_account_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,

    CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "public"."project_assignments" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "role" "public"."ProjectAssignmentRole" NOT NULL,
    "assigned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "assigned_by" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_assignments_pkey" PRIMARY KEY ("id")
);

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
    "user_id" TEXT NOT NULL,

    CONSTRAINT "daily_sub_activities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."wilayah" (
    "kode" TEXT NOT NULL,
    "nama" TEXT NOT NULL,

    CONSTRAINT "wilayah_pkey" PRIMARY KEY ("kode")
);

-- CreateIndex
CREATE UNIQUE INDEX "balai_code_key" ON "public"."balai"("code");

-- CreateIndex
CREATE UNIQUE INDEX "satkers_balai_id_code_key" ON "public"."satkers"("balai_id", "code");

-- CreateIndex
CREATE UNIQUE INDEX "schedules_sub_activity_id_week_number_key" ON "public"."schedules"("sub_activity_id", "week_number");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "public"."users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "accounts_provider_provider_account_id_key" ON "public"."accounts"("provider", "provider_account_id");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_session_token_key" ON "public"."sessions"("session_token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "public"."verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "public"."verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "project_assignments_user_id_project_id_role_key" ON "public"."project_assignments"("user_id", "project_id", "role");

-- CreateIndex
CREATE UNIQUE INDEX "daily_sub_activities_sub_activity_id_tanggal_progres_user_i_key" ON "public"."daily_sub_activities"("sub_activity_id", "tanggal_progres", "user_id");

-- CreateIndex
CREATE INDEX "wilayah_nama_idx" ON "public"."wilayah"("nama");

-- AddForeignKey
ALTER TABLE "public"."satkers" ADD CONSTRAINT "satkers_balai_id_fkey" FOREIGN KEY ("balai_id") REFERENCES "public"."balai"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."projects" ADD CONSTRAINT "projects_satker_id_fkey" FOREIGN KEY ("satker_id") REFERENCES "public"."satkers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_audit_logs" ADD CONSTRAINT "project_audit_logs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."addendums" ADD CONSTRAINT "addendums_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."activities" ADD CONSTRAINT "activities_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sub_activities" ADD CONSTRAINT "sub_activities_activity_id_fkey" FOREIGN KEY ("activity_id") REFERENCES "public"."activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."schedules" ADD CONSTRAINT "schedules_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_balai_id_fkey" FOREIGN KEY ("balai_id") REFERENCES "public"."balai"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."users" ADD CONSTRAINT "users_satker_id_fkey" FOREIGN KEY ("satker_id") REFERENCES "public"."satkers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_assignments" ADD CONSTRAINT "project_assignments_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."project_assignments" ADD CONSTRAINT "project_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_sub_activities" ADD CONSTRAINT "daily_sub_activities_sub_activity_id_fkey" FOREIGN KEY ("sub_activity_id") REFERENCES "public"."sub_activities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."daily_sub_activities" ADD CONSTRAINT "daily_sub_activities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
