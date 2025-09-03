-- CreateTable
CREATE TABLE "public"."projects" (
    "id" TEXT NOT NULL,
    "penyediaJasa" TEXT,
    "pekerjaan" TEXT,
    "jenisPaket" TEXT,
    "jenisPengadaan" TEXT,
    "paguAnggaran" TEXT,
    "nilaiKontrak" TEXT,
    "nomorKontrak" TEXT,
    "spmk" TEXT,
    "masaKontrak" TEXT,
    "tanggalKontrak" TEXT,
    "akhirKontrak" TEXT,
    "pembayaranTerakhir" TEXT,
    "fisikProgress" DOUBLE PRECISION DEFAULT 0,
    "fisikDeviasi" DOUBLE PRECISION DEFAULT 0,
    "fisikTarget" DOUBLE PRECISION DEFAULT 100,
    "saluranProgress" DOUBLE PRECISION DEFAULT 0,
    "saluranDeviasi" DOUBLE PRECISION DEFAULT 0,
    "saluranTarget" DOUBLE PRECISION DEFAULT 0,
    "bangunanProgress" DOUBLE PRECISION DEFAULT 0,
    "bangunanDeviasi" DOUBLE PRECISION DEFAULT 0,
    "bangunanTarget" DOUBLE PRECISION DEFAULT 0,
    "keuanganProgress" DOUBLE PRECISION DEFAULT 0,
    "keuanganDeviasi" DOUBLE PRECISION DEFAULT 0,
    "keuanganTarget" DOUBLE PRECISION DEFAULT 0,
    "outputData" JSONB,
    "tenagaKerjaData" JSONB,
    "alatData" JSONB,
    "materialData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."project_audit_logs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "fieldName" TEXT NOT NULL,
    "oldValue" TEXT,
    "newValue" TEXT,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_audit_logs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."project_audit_logs" ADD CONSTRAINT "project_audit_logs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "public"."projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
