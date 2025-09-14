// Schema for Action Plan SchedulePlan data
import { z } from 'zod'

// Base schema for Action Plan SchedulePlan
export const ActionPlanSchema = z.object({
  id: z.string(),
  activityId: z.string().nullable(),
  subActivityId: z.string().nullable(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(10), // Increased from 5 to 10 to support more weeks per month
  planPercentage: z.number().min(0).max(100).default(0),
  actualPercentage: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for API responses where dates come as ISO strings
export const ActionPlanApiSchema = z.object({
  id: z.string(),
  activityId: z.string().nullable(),
  subActivityId: z.string().nullable(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(10), // Increased from 5 to 10 to support more weeks per month
  planPercentage: z.number().min(0).max(100).default(0),
  actualPercentage: z.number().min(0).max(100).default(0),
  createdAt: z.string().transform(str => new Date(str)),
  updatedAt: z.string().transform(str => new Date(str)),
})

// Schema for Action Plan SchedulePlan with related data (includes activity/subActivity details)
export const ActionPlanWithRelationsSchema = ActionPlanSchema.extend({
  activity: z
    .object({
      id: z.string(),
      name: z.string(),
      projectId: z.string(),
    })
    .nullable(),
  subActivity: z
    .object({
      id: z.string(),
      name: z.string(),
      activityId: z.string(),
    })
    .nullable(),
})

// Schema for API responses with relations where dates come as ISO strings
export const ActionPlanWithRelationsApiSchema = ActionPlanApiSchema.extend({
  activity: z
    .object({
      id: z.string(),
      name: z.string(),
      projectId: z.string(),
    })
    .nullable(),
  subActivity: z
    .object({
      id: z.string(),
      name: z.string(),
      activityId: z.string(),
    })
    .nullable(),
})

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
