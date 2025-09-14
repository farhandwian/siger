// Schema for Action Plan Schedule data
import { z } from 'zod'

// Base schema for Action Plan Schedule
export const ActionPlanScheduleSchema = z.object({
  id: z.string(),
  activityId: z.string().nullable(),
  subActivityId: z.string().nullable(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(5),
  planPercentage: z.number().min(0).max(100).default(0),
  actualPercentage: z.number().min(0).max(100).default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Schema for API responses where dates come as ISO strings
export const ActionPlanScheduleApiSchema = z.object({
  id: z.string(),
  activityId: z.string().nullable(),
  subActivityId: z.string().nullable(),
  month: z.number().min(1).max(12),
  year: z.number().min(2020),
  week: z.number().min(1).max(5),
  planPercentage: z.number().min(0).max(100).default(0),
  actualPercentage: z.number().min(0).max(100).default(0),
  createdAt: z.string().transform((str) => new Date(str)),
  updatedAt: z.string().transform((str) => new Date(str)),
})

// Schema for Action Plan Schedule with related data (includes activity/subActivity details)
export const ActionPlanScheduleWithRelationsSchema = ActionPlanScheduleSchema.extend({
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
export const ActionPlanScheduleWithRelationsApiSchema = ActionPlanScheduleApiSchema.extend({
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

export type ActionPlanSchedule = z.infer<typeof ActionPlanScheduleSchema>
export type ActionPlanScheduleWithRelations = z.infer<typeof ActionPlanScheduleWithRelationsSchema>
export type ActionPlanScheduleApi = z.infer<typeof ActionPlanScheduleApiSchema>
export type ActionPlanScheduleWithRelationsApi = z.infer<typeof ActionPlanScheduleWithRelationsApiSchema>

export const CreateActionPlanScheduleSchema = ActionPlanScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateActionPlanScheduleSchema = CreateActionPlanScheduleSchema.partial()

// Schema for API responses
export const ActionPlanScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActionPlanScheduleWithRelationsApiSchema),
})

export const SingleActionPlanScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: ActionPlanScheduleWithRelationsApiSchema,
})
