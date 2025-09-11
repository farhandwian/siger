import { z } from 'zod'

// Daily Sub Activity base schema
export const DailySubActivitySchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  userId: z.string(),
  koordinat: z.any().nullable(), // JSON GPS coordinates
  catatanKegiatan: z.string().nullable(), // Activity notes
  file: z.any().nullable(), // JSON files array
  progresRealisasiPerHari: z.number().nullable(), // Daily progress
  tanggalProgres: z.string(), // Progress date (YYYY-MM-DD)
  createdAt: z.string(), // ISO date string
  updatedAt: z.string(), // ISO date string
})

// Daily Sub Activity with relations
export const DailySubActivityWithRelationsSchema = DailySubActivitySchema.extend({
  subActivity: z.object({
    id: z.string(),
    name: z.string(),
    satuan: z.string().nullable(),
    volumeKontrak: z.number().nullable(),
    weight: z.number(),
    order: z.number(),
    activity: z.object({
      id: z.string(),
      name: z.string(),
      order: z.number(),
      project: z.object({
        id: z.string(),
        pekerjaan: z.string().nullable(),
        penyediaJasa: z.string().nullable(),
      }),
    }),
  }),
  user: z.object({
    id: z.string(),
    name: z.string(),
    username: z.string(),
    email: z.string(),
  }),
})

// Query parameters for list daily sub activities
export const DailySubActivitiesQuerySchema = z.object({
  // Pagination
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),

  // Sorting
  sortBy: z.enum(['updatedAt', 'createdAt', 'tanggalProgres']).default('updatedAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),

  // Search
  search: z.string().optional(), // Search by sub activity name

  // Filters
  projectId: z.string().optional(),
  activityId: z.string().optional(),
  subActivityId: z.string().optional(),
  // userId: z.string().default('cmfb8i5yo0000vpgc5p776720'), // Fixed user ID - TEMPORARILY DISABLED
  userId: z.string().optional(), // User ID filter - temporarily optional

  // Date filters
  tanggalProgres: z.string().optional(), // YYYY-MM-DD format - exact date filter
  startDate: z.string().optional(), // YYYY-MM-DD format
  endDate: z.string().optional(), // YYYY-MM-DD format
})

// Response schema for list daily sub activities
export const DailySubActivitiesResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(DailySubActivityWithRelationsSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),
  filters: z.object({
    projectId: z.string().optional(),
    activityId: z.string().optional(),
    subActivityId: z.string().optional(),
    userId: z.string().optional(), // Made optional since it's temporarily disabled
    search: z.string().optional(),
    tanggalProgres: z.string().optional(),
    startDate: z.string().optional(),
    endDate: z.string().optional(),
    sortBy: z.string(),
    sortOrder: z.string(),
  }),
})

// Error response schema
export const DailySubActivitiesErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string(),
  details: z.any().optional(),
})

// Type exports
export type DailySubActivity = z.infer<typeof DailySubActivitySchema>
export type DailySubActivityWithRelations = z.infer<typeof DailySubActivityWithRelationsSchema>
export type DailySubActivitiesQuery = z.infer<typeof DailySubActivitiesQuerySchema>
export type DailySubActivitiesResponse = z.infer<typeof DailySubActivitiesResponseSchema>
export type DailySubActivitiesErrorResponse = z.infer<typeof DailySubActivitiesErrorResponseSchema>
