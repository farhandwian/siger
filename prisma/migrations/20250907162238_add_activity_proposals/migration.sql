-- CreateTable
CREATE TABLE "public"."activity_proposals" (
    "id" TEXT NOT NULL,
    "tahun" TEXT NOT NULL,
    "prioritas" TEXT NOT NULL,
    "kategori_kegiatan" TEXT NOT NULL,
    "jenis_daerah_irigasi" TEXT,
    "daerah_irigasi" TEXT,
    "outcome" DOUBLE PRECISION DEFAULT 0,
    "kebutuhan_anggaran" DOUBLE PRECISION DEFAULT 0,
    "anggaran_per_hektar" DOUBLE PRECISION DEFAULT 0,
    "ip_existing" DOUBLE PRECISION DEFAULT 0,
    "ip_rencana" DOUBLE PRECISION DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'Draft',
    "readiness_level" TEXT NOT NULL DEFAULT '0%',
    "submitted_by" TEXT,
    "reviewed_by" TEXT,
    "approved_by" TEXT,
    "review_notes" TEXT,
    "submitted_at" TIMESTAMP(3),
    "reviewed_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "activity_proposals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."lingkup_usulan" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "nama_lingkup_usulan" TEXT NOT NULL,
    "nomenkaltur" TEXT,
    "koordinat_geojson" JSONB,
    "perimeter" DOUBLE PRECISION,
    "area" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lingkup_usulan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."readiness_criteria" (
    "id" TEXT NOT NULL,
    "proposal_id" TEXT NOT NULL,
    "dokumen_type" TEXT NOT NULL,
    "keterangan" TEXT,
    "file_name" TEXT,
    "file_path" TEXT,
    "file_size" INTEGER,
    "uploaded_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "readiness_criteria_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."lingkup_usulan" ADD CONSTRAINT "lingkup_usulan_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."activity_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."readiness_criteria" ADD CONSTRAINT "readiness_criteria_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "public"."activity_proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
