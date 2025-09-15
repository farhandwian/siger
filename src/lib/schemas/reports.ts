import { z } from 'zod'

/**
 * Schema for Weekly Report data structure
 * Represents a weekly report generated for a project
 */
export const WeeklyReportSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  projectName: z.string(), // Denormalized for easier display
  weekNumber: z.number().min(1).max(53),
  startDate: z.string(), // ISO date string
  endDate: z.string(), // ISO date string
  reportPeriod: z.string(), // Formatted display string like "Minggu ke-1 | 10-24 Agustus 2025"
  filePath: z.string().optional(), // Path to the report file
  fileUrl: z.string().optional(), // URL for downloading the report
  status: z.enum(['draft', 'published', 'archived']).default('published'),
  createdAt: z.string(), // ISO timestamp
  updatedAt: z.string(), // ISO timestamp
})

export type WeeklyReport = z.infer<typeof WeeklyReportSchema>

/**
 * Schema for pagination metadata
 */
export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
})

export type Pagination = z.infer<typeof PaginationSchema>

/**
 * Response schema for reports API with pagination
 */
export const WeeklyReportsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(WeeklyReportSchema),
  pagination: PaginationSchema,
})

export type WeeklyReportsResponse = z.infer<typeof WeeklyReportsResponseSchema>

/**
 * Query parameters schema for filtering and searching reports
 */
export const ReportQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(), // Search by project name
  projectId: z.string().optional(), // Filter by specific project
  startDate: z.string().optional(), // Filter by period start date (ISO string)
  endDate: z.string().optional(), // Filter by period end date (ISO string)
  weekNumber: z.coerce.number().min(1).max(53).optional(), // Filter by week number
  status: z.enum(['draft', 'published', 'archived']).optional(),
})

export type ReportQuery = z.infer<typeof ReportQuerySchema>

/**
 * Base schema for weekly report data (without validation refinements)
 */
const BaseWeeklyReportSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  weekNumber: z.number().min(1).max(53),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Start date must be in YYYY-MM-DD format'),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'End date must be in YYYY-MM-DD format'),
  status: z.enum(['draft', 'published']).default('draft'),
})

/**
 * Schema for creating a new weekly report
 */
export const CreateWeeklyReportSchema = BaseWeeklyReportSchema.refine(
  data => new Date(data.startDate) <= new Date(data.endDate),
  {
    message: 'Start date must be before or equal to end date',
    path: ['endDate'],
  }
)

export type CreateWeeklyReport = z.infer<typeof CreateWeeklyReportSchema>

/**
 * Schema for updating an existing weekly report
 */
export const UpdateWeeklyReportSchema = BaseWeeklyReportSchema.partial().extend({
  id: z.string().min(1, 'Report ID is required'),
})

export type UpdateWeeklyReport = z.infer<typeof UpdateWeeklyReportSchema>

/**
 * Schema for project dropdown options
 */
export const ProjectOptionSchema = z.object({
  id: z.string(),
  name: z.string(),
  location: z.string().optional(),
})

export type ProjectOption = z.infer<typeof ProjectOptionSchema>

/**
 * Response schema for project options API
 */
export const ProjectOptionsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ProjectOptionSchema),
})

export type ProjectOptionsResponse = z.infer<typeof ProjectOptionsResponseSchema>

/**
 * Error response schema for API endpoints
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
})

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>
