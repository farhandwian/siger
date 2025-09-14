// Schema for Action Plan Schedule data
import { z } from 'zod'

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

export type ActionPlanSchedule = z.infer<typeof ActionPlanScheduleSchema>
export type ActionPlanScheduleWithRelations = z.infer<typeof ActionPlanScheduleWithRelationsSchema>

export const CreateActionPlanScheduleSchema = ActionPlanScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateActionPlanScheduleSchema = CreateActionPlanScheduleSchema.partial()

// Schema for API responses
export const ActionPlanScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ActionPlanScheduleWithRelationsSchema),
})

export const SingleActionPlanScheduleResponseSchema = z.object({
  success: z.literal(true),
  data: ActionPlanScheduleWithRelationsSchema,
})
