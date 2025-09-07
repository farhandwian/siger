import { z } from 'zod'

// Base schemas
export const LingkupUsulanSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  namaLingkupUsulan: z.string(),
  nomenkaltur: z.string().nullable(),
  koordinatGeoJson: z.any().nullable(),
  perimeter: z.number().nullable(),
  area: z.number().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const ReadinessCriteriaSchema = z.object({
  id: z.string(),
  proposalId: z.string(),
  dokumenType: z.string(),
  keterangan: z.string().nullable(),
  fileName: z.string().nullable(),
  filePath: z.string().nullable(),
  fileSize: z.number().nullable(),
  uploadedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const ActivityProposalSchema = z.object({
  id: z.string(),
  tahun: z.string(),
  prioritas: z.string(),
  kategoriKegiatan: z.string(),
  jenisDaerahIrigasi: z.string().nullable(),
  daerahIrigasi: z.string().nullable(),
  outcome: z.number().nullable(),
  kebutuhanAnggaran: z.number().nullable(),
  anggaranPerHektar: z.number().nullable(),
  ipExisting: z.number().nullable(),
  ipRencana: z.number().nullable(),
  status: z.string(),
  readinessLevel: z.string(),
  submittedBy: z.string().nullable(),
  reviewedBy: z.string().nullable(),
  approvedBy: z.string().nullable(),
  reviewNotes: z.string().nullable(),
  submittedAt: z.date().nullable(),
  reviewedAt: z.date().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  lingkupUsulan: z.array(LingkupUsulanSchema).optional(),
  readinessCriteria: z.array(ReadinessCriteriaSchema).optional(),
})

// Input schemas for API
export const CreateActivityProposalSchema = z.object({
  tahun: z.string(),
  prioritas: z.string(),
  kategoriKegiatan: z.string(),
  jenisDaerahIrigasi: z.string().optional(),
  daerahIrigasi: z.string().optional(),
  outcome: z.number().min(0).optional(),
  kebutuhanAnggaran: z.number().min(0).optional(),
  anggaranPerHektar: z.number().min(0).optional(),
  ipExisting: z.number().min(0).max(100).optional(),
  ipRencana: z.number().min(0).max(100).optional(),
})

export const UpdateActivityProposalSchema = CreateActivityProposalSchema.partial()

export const CreateLingkupUsulanSchema = z.object({
  namaLingkupUsulan: z.string().min(1),
  nomenkaltur: z.string().optional(),
  koordinatGeoJson: z.any().optional(),
  perimeter: z.number().min(0).optional(),
  area: z.number().min(0).optional(),
})

export const UpdateLingkupUsulanSchema = CreateLingkupUsulanSchema.partial()

export const CreateReadinessCriteriaSchema = z.object({
  dokumenType: z.string().min(1),
  keterangan: z.string().optional(),
  fileName: z.string().optional(),
  filePath: z.string().optional(),
  fileSize: z.number().min(0).optional(),
})

// Response schemas
export const ActivityProposalResponseSchema = z.object({
  success: z.literal(true),
  data: ActivityProposalSchema,
})

export const ActivityProposalsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActivityProposalSchema),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
})

// Type exports
export type ActivityProposal = z.infer<typeof ActivityProposalSchema>
export type LingkupUsulan = z.infer<typeof LingkupUsulanSchema>
export type ReadinessCriteria = z.infer<typeof ReadinessCriteriaSchema>
export type CreateActivityProposal = z.infer<typeof CreateActivityProposalSchema>
export type UpdateActivityProposal = z.infer<typeof UpdateActivityProposalSchema>
export type CreateLingkupUsulan = z.infer<typeof CreateLingkupUsulanSchema>
export type UpdateLingkupUsulan = z.infer<typeof UpdateLingkupUsulanSchema>
export type CreateReadinessCriteria = z.infer<typeof CreateReadinessCriteriaSchema>

// Predefined constants for the form
export const KATEGORI_KEGIATAN_OPTIONS = [
  'Fisik',
  'Non-Fisik',
  'Pemeliharaan',
  'Rehabilitasi',
  'Peningkatan',
] as const

export const JENIS_DAERAH_IRIGASI_OPTIONS = ['Teknis', 'Semi Teknis', 'Sederhana', 'Desa'] as const

export const PRIORITAS_OPTIONS = ['1', '2', '3', '4', '5'] as const

export const DOKUMEN_TYPES = [
  'SID / DED / As Built Drawing',
  'Dokumen lingkungan (AMDAL/UKL-UPL/SPPL)',
  'Data sumber air yang masuk formulir usulan kegiatan',
  'KAK',
  'RAB/Back Up Volume, Harga Satuan, SMKK, AHSP',
  'Gambar Area Kerja dan Akses Jalan',
] as const
