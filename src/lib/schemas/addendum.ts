import { z } from 'zod'

/**
 * Project Status enum for lifecycle management
 * DRAFT: Initial status after project creation, allows plan modifications
 * KONTRAK: Locked status, no plan modifications allowed
 * DRAFT_ADDENDUM: Allows plan modifications from addendum date onwards
 */
export const ProjectStatusSchema = z.enum(['DRAFT', 'KONTRAK', 'DRAFT_ADDENDUM'])
export type ProjectStatus = z.infer<typeof ProjectStatusSchema>

/**
 * Core addendum entity schema for database operations
 * Simplified to focus on lifecycle management essentials
 */
export const AddendumSchema = z.object({
  id: z.string(),
  projectId: z.string(),
  addendumNumber: z.number().int().positive(),
  title: z.string().min(1, 'Title is required'),
  description: z.string().nullable(),
  effectiveDate: z.date(),
  weekNumber: z.number().int().positive(),
  modifiedBy: z.string(),
  approvedBy: z.string().nullable(),
  approvedAt: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export type Addendum = z.infer<typeof AddendumSchema>

/**
 * Schema for creating a new addendum
 */
export const CreateAddendumSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  title: z.string().min(1, 'Title is required').max(255, 'Title too long'),
  description: z.string().max(1000, 'Description too long').optional(),
  effectiveDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }
      return date
    }
    return val
  }),
  weekNumber: z.number().int().positive().min(1, 'Week number must be positive'),
})

export type CreateAddendumRequest = z.infer<typeof CreateAddendumSchema>

/**
 * Schema for updating an existing addendum
 */
export const UpdateAddendumSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title too long').optional(),
  description: z.string().max(1000, 'Description too long').optional(),
  effectiveDate: z.string().or(z.date()).transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val)
      if (isNaN(date.getTime())) {
        throw new Error('Invalid date format')
      }
      return date
    }
    return val
  }).optional(),
  weekNumber: z.number().int().positive().min(1, 'Week number must be positive').optional(),
})

export type UpdateAddendumRequest = z.infer<typeof UpdateAddendumSchema>

/**
 * Schema for approving an addendum
 */
export const ApproveAddendumSchema = z.object({
  approvedBy: z.string().min(1, 'Approver ID is required'),
})

export type ApproveAddendumRequest = z.infer<typeof ApproveAddendumSchema>

/**
 * Schema for updating project status
 */
export const UpdateProjectStatusSchema = z.object({
  status: ProjectStatusSchema,
})

export type UpdateProjectStatusRequest = z.infer<typeof UpdateProjectStatusSchema>

/**
 * API response schemas
 */
export const AddendumListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(AddendumSchema),
  pagination: z.object({
    total: z.number(),
    page: z.number(),
    limit: z.number(),
    totalPages: z.number(),
  }).optional(),
})

export type AddendumListResponse = z.infer<typeof AddendumListResponseSchema>

export const AddendumResponseSchema = z.object({
  success: z.literal(true),
  data: AddendumSchema,
})

export type AddendumResponse = z.infer<typeof AddendumResponseSchema>

export const ProjectStatusResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    status: ProjectStatusSchema,
    currentAddendum: AddendumSchema.nullable(),
    canEditPlan: z.boolean(),
    editableFromWeek: z.number().nullable(),
  }),
})

export type ProjectStatusResponse = z.infer<typeof ProjectStatusResponseSchema>

/**
 * Query parameters for filtering addendums
 */
export const AddendumQuerySchema = z.object({
  projectId: z.string().optional(),
  addendumNumber: z.number().int().positive().optional(),
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(10),
})

export type AddendumQuery = z.infer<typeof AddendumQuerySchema>

/**
 * Helper function to determine if schedule plans can be edited
 * based on project status and addendum information
 */
export const canEditSchedulePlan = (
  projectStatus: ProjectStatus,
  weekNumber: number,
  currentAddendum?: Addendum | null
): boolean => {
  switch (projectStatus) {
    case 'DRAFT':
      return true // All weeks can be edited in draft status
    case 'KONTRAK':
      return false // No editing allowed in contract status
    case 'DRAFT_ADDENDUM':
      // Can edit from the addendum week onwards
      if (!currentAddendum) return false
      return weekNumber >= currentAddendum.weekNumber
    default:
      return false
  }
}
