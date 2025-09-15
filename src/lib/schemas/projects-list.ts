import { z } from 'zod'

/**
 * Schema for project progress item from existing /api/projects endpoint
 * Matches the format returned by the existing projects API
 */
export const ProjectProgressItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  budget: z.string(),
  type: z.string(),
  status: z.enum(['on-track', 'at-risk', 'delayed']),
  progress: z.number().min(0).max(100),
  deviation: z.number(),
  target: z.number().min(0).max(100),
})

/**
 * Schema for pagination from existing API
 */
export const PaginationSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
})

/**
 * Schema for projects list API response from existing /api/projects
 * Validates the complete response from /api/projects
 */
export const ProjectsListResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    projects: z.array(ProjectProgressItemSchema),
    pagination: PaginationSchema,
  }),
})

/**
 * Schema for error response from projects API
 */
export const ProjectsListErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
})

/**
 * Union schema for both success and error responses
 */
export const ProjectsListApiResponseSchema = z.union([
  ProjectsListResponseSchema,
  ProjectsListErrorResponseSchema,
])

// Type exports for TypeScript
export type ProjectProgressItem = z.infer<typeof ProjectProgressItemSchema>
export type PaginationData = z.infer<typeof PaginationSchema>
export type ProjectsListResponse = z.infer<typeof ProjectsListResponseSchema>
export type ProjectsListErrorResponse = z.infer<typeof ProjectsListErrorResponseSchema>
export type ProjectsListApiResponse = z.infer<typeof ProjectsListApiResponseSchema>
