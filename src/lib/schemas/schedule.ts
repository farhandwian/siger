// Schema for Schedule data - Updated to match new merged Prisma Schedule model
import { z } from 'zod'

// Base schema for Schedule (merged SchedulePlan, ActionPlan, and Realization)
export const ScheduleSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  weekNumber: z.number().min(1, 'Week number must be at least 1'),
  plan: z.number().min(0).max(100).default(0).nullable(),
  actionPlan: z.number().min(0).max(100).default(0).nullable(),
  realization: z.number().min(0).max(100).default(0).nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for API responses where dates come as ISO strings
export const ScheduleApiSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  weekNumber: z.number().min(1, 'Week number must be at least 1'),
  plan: z.number().min(0).max(100).default(0).nullable(),
  actionPlan: z.number().min(0).max(100).default(0).nullable(),
  realization: z.number().min(0).max(100).default(0).nullable(),
  createdAt: z.string().transform(str => new Date(str)),
  updatedAt: z.string().transform(str => new Date(str)),
})

// Schema for Schedule with related data (subActivity removed for performance)
// Use subActivityId to map relationships on the client side
export const ScheduleWithRelationsSchema = ScheduleSchema

// Schema for API responses with relations where dates come as ISO strings
// Use subActivityId to map relationships on the client side  
export const ScheduleWithRelationsApiSchema = ScheduleApiSchema

export type Schedule = z.infer<typeof ScheduleSchema>
export type ScheduleWithRelations = z.infer<typeof ScheduleWithRelationsSchema>
export type ScheduleApi = z.infer<typeof ScheduleApiSchema>
export type ScheduleWithRelationsApi = z.infer<
  typeof ScheduleWithRelationsApiSchema
>

export const CreateScheduleSchema = ScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateScheduleSchema = CreateScheduleSchema.partial()

// Schema for API responses
export const ScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ScheduleWithRelationsApiSchema),
})

export type ScheduleResponse = z.infer<typeof ScheduleResponseSchema>

// Schema for week data structure used in optimized hooks
export const WeekScheduleDataSchema = z.object({
  weekNumber: z.number(),
  plan: z.number().min(0).max(100).nullable(),
  actionPlan: z.number().min(0).max(100).nullable(),
  realization: z.number().min(0).max(100).nullable(),
})

export type WeekScheduleData = z.infer<typeof WeekScheduleDataSchema>

// Schema for cumulative calculation results
export const CumulativeScheduleDataSchema = z.object({
  weekNumber: z.number(),
  cumulativePlan: z.number().min(0).max(100),
  cumulativeActionPlan: z.number().min(0).max(100),
  cumulativeRealization: z.number().min(0).max(100),
  weeklyPlan: z.number().min(0).max(100).nullable(),
  weeklyActionPlan: z.number().min(0).max(100).nullable(),
  weeklyRealization: z.number().min(0).max(100).nullable(),
})

export type CumulativeScheduleData = z.infer<typeof CumulativeScheduleDataSchema>

// Schema for bulk operations
export const BulkScheduleUpdateSchema = z.object({
  subActivityId: z.string(),
  schedules: z.array(z.object({
    weekNumber: z.number().min(1),
    plan: z.number().min(0).max(100).nullable().optional(),
    actionPlan: z.number().min(0).max(100).nullable().optional(),
    realization: z.number().min(0).max(100).nullable().optional(),
  })),
})

export type BulkScheduleUpdate = z.infer<typeof BulkScheduleUpdateSchema>

// Response schema for bulk operations
export const BulkScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    updated: z.number(),
    created: z.number(),
    errors: z.array(z.string()),
  }),
})

export type BulkScheduleResponse = z.infer<typeof BulkScheduleResponseSchema>

// Schema for search and filter parameters
export const ScheduleSearchSchema = z.object({
  subActivityId: z.string().optional(),
  projectId: z.string().optional(),
  weekStart: z.number().min(1).optional(),
  weekEnd: z.number().min(1).optional(),
  hasData: z.boolean().optional(),
})

export type ScheduleSearch = z.infer<typeof ScheduleSearchSchema>

// Schema for pagination parameters
export const SchedulePaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
  sortBy: z.enum(['weekNumber', 'plan', 'actionPlan', 'realization', 'createdAt', 'updatedAt']).default('weekNumber'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type SchedulePagination = z.infer<typeof SchedulePaginationSchema>
