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

// Schema for API responses where dates come as ISO strings
export const ActionPlanApiSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  weekNumber: z.number().min(1, 'Week number must be at least 1'),
  percentage: z.number().min(0).max(100).default(0),
  createdAt: z.string().transform(str => new Date(str)),
  updatedAt: z.string().transform(str => new Date(str)),
})

// Schema for Action Plan Schedule with related data (subActivity removed for performance)
// Use subActivityId to map relationships on the client side
export const ActionPlanWithRelationsSchema = ActionPlanSchema

// Schema for API responses with relations where dates come as ISO strings
// Use subActivityId to map relationships on the client side  
export const ActionPlanWithRelationsApiSchema = ActionPlanApiSchema

export type ActionPlan = z.infer<typeof ActionPlanSchema>
export type ActionPlanWithRelations = z.infer<typeof ActionPlanWithRelationsSchema>
export type ActionPlanApi = z.infer<typeof ActionPlanApiSchema>
export type ActionPlanWithRelationsApi = z.infer<
  typeof ActionPlanWithRelationsApiSchema
>

export const CreateActionPlanSchema = ActionPlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateActionPlanSchema = CreateActionPlanSchema.partial()

// Schema for API responses
export const ActionPlanResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActionPlanWithRelationsApiSchema),
})

export const SingleActionPlanResponseSchema = z.object({
  success: z.literal(true),
  data: ActionPlanWithRelationsApiSchema,
})

// Schema for bulk operations
export const BulkActionPlanSchema = z.object({
  actionPlans: z.array(CreateActionPlanSchema),
})

// Add SchedulePlan and Realization schemas that follow the same pattern
export const SchedulePlanSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(6),
  percentage: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const RealizationSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(6),
  percentage: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const CreateSchedulePlanSchema = SchedulePlanSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const CreateRealizationSchema = RealizationSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Optimized response schemas for API endpoints
// Note: SchedulePlanWithRelations now excludes subActivity to improve performance
// Use subActivityId to map relationships on the client side
export const SchedulePlanWithRelationsSchema = SchedulePlanSchema

// Note: RealizationWithRelations now excludes subActivity to improve performance
// Use subActivityId to map relationships on the client side
export const RealizationWithRelationsSchema = RealizationSchema

export type SchedulePlan = z.infer<typeof SchedulePlanSchema>
export type Realization = z.infer<typeof RealizationSchema>
export type SchedulePlanWithRelations = z.infer<typeof SchedulePlanWithRelationsSchema>
export type RealizationWithRelations = z.infer<typeof RealizationWithRelationsSchema>
