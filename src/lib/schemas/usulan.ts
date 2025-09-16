import { z } from 'zod'

// Schema for LingkupUsulan coordinates
export const CoordinateSchema = z.object({
  type: z.enum(['Point', 'Polygon', 'LineString']),
  coordinates: z.union([
    z.tuple([z.number(), z.number()]), // Point: [lng, lat]
    z.array(z.tuple([z.number(), z.number()])), // LineString: [[lng, lat], ...]
    z.array(z.array(z.tuple([z.number(), z.number()]))), // Polygon: [[[lng, lat], ...]]
  ]),
})

// Schema for ActivityProposal response
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
  lingkupUsulan: z.array(
    z.object({
      id: z.string(),
      namaLingkupUsulan: z.string(),
      nomenkaltur: z.string().nullable(),
      koordinatGeoJson: CoordinateSchema.nullable(),
      perimeter: z.number().nullable(),
      area: z.number().nullable(),
    })
  ),
  readinessCriteria: z.array(
    z.object({
      id: z.string(),
      dokumenType: z.string(),
      keterangan: z.string().nullable(),
      fileName: z.string().nullable(),
      filePath: z.string().nullable(),
      fileSize: z.number().nullable(),
      uploadedAt: z.date().nullable(),
    })
  ),
})

// Schema for category breakdown in proposals
export const CategoryBreakdownSchema = z.object({
  totalUsulan: z.number(),
  totalAnggaran: z.number(),
  totalOutcome: z.number(),
})

// Schema for activity proposals summary
export const ActivityProposalSummarySchema = z.object({
  total: z.number(),
  menungguVerifikasi: z.number(),
  diterima: z.number(),
  ditolak: z.number(),
  totalAnggaran: z.number(),
  categoryBreakdown: z.record(CategoryBreakdownSchema),
})

// Schema for activity proposals response
export const ActivityProposalsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActivityProposalSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
  summary: ActivityProposalSummarySchema,
})

// Schema for project summary
export const ProjectSummarySchema = z.object({
  totalProyek: z.number(),
  totalKontrak: z.number(),
  progressRataRata: z.number(),
  deviasiRataRata: z.number(),
  statusDistribution: z.record(z.number()),
  progressDetails: z
    .array(
      z.object({
        id: z.string(),
        name: z.string().nullable(),
        progress: z.number(),
        deviation: z.number(),
        target: z.number(),
        contractValue: z.string().nullable(),
        lastUpdated: z.date(),
      })
    )
    .optional(),
})

// Schema for project summary response
export const ProjectSummaryResponseSchema = z.object({
  success: z.literal(true),
  data: ProjectSummarySchema,
  meta: z.object({
    lastUpdated: z.string(),
    projectCount: z.number(),
  }),
})

// Schema for map marker data
export const MapMarkerSchema = z.object({
  id: z.string(),
  name: z.string(),
  coordinates: z.tuple([z.number(), z.number()]), // [lng, lat]
  progress: z.number().nullable(),
  status: z.enum(['usulan', 'pelaksanaan']),
  category: z.string().optional(),
  type: z.enum(['Point', 'Polygon', 'LineString']).optional(),
})

// Schema for map data response
export const MapDataResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    usulan: z.array(MapMarkerSchema),
    pelaksanaan: z.array(MapMarkerSchema),
  }),
  meta: z.object({
    usulanCount: z.number(),
    pelaksanaanCount: z.number(),
    lastUpdated: z.string(),
  }),
})

// Schema for query parameters
export const ActivityProposalsQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  status: z.string().optional(),
  kategoriKegiatan: z.string().optional(),
  tahun: z.string().optional(),
})

export const ProjectSummaryQuerySchema = z.object({
  includeProgress: z.coerce.boolean().default(true),
})

// Type exports for TypeScript
export type ActivityProposal = z.infer<typeof ActivityProposalSchema>
export type ActivityProposalSummary = z.infer<typeof ActivityProposalSummarySchema>
export type ActivityProposalsResponse = z.infer<typeof ActivityProposalsResponseSchema>
export type ProjectSummary = z.infer<typeof ProjectSummarySchema>
export type ProjectSummaryResponse = z.infer<typeof ProjectSummaryResponseSchema>
export type MapMarker = z.infer<typeof MapMarkerSchema>
export type MapDataResponse = z.infer<typeof MapDataResponseSchema>
export type ActivityProposalsQuery = z.infer<typeof ActivityProposalsQuerySchema>
export type ProjectSummaryQuery = z.infer<typeof ProjectSummaryQuerySchema>
export type Coordinate = z.infer<typeof CoordinateSchema>
export type CategoryBreakdown = z.infer<typeof CategoryBreakdownSchema>
