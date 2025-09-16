import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  Activity,
  SubActivity,
  Schedule,
  UpdateActivitySchema,
} from '@/lib/schemas'
import { z } from 'zod'

// Define simple types for create operations
type CreateActivityData = {
  name: string
}

type CreateSubActivityData = {
  name: string
  satuan?: string
  volumeKontrak?: number
  volumeMC0?: number
  bobotMC0?: number
  weight: number
}

// Type for activities with schedules
type ActivityWithSchedules = Activity & {
  subActivities?: (SubActivity & {
    schedules?: Schedule[]
  })[]
}

// Query keys factory
export const activityKeys = {
  all: ['activities'] as const,
  lists: () => [...activityKeys.all, 'list'] as const,
  list: (projectId: string) => [...activityKeys.lists(), projectId] as const,
  details: () => [...activityKeys.all, 'detail'] as const,
  detail: (id: string) => [...activityKeys.details(), id] as const,
}

export const projectKeys = {
  all: ['projects'] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Get activities for a project
export function useActivities(projectId: string) {
  return useQuery({
    queryKey: activityKeys.list(projectId),
    queryFn: async () => {
      const response = await apiClient.get<Activity[]>(`/projects/${projectId}/activities`)
      return response
    },
    enabled: !!projectId,
    // Removed automatic refetching to improve performance
    // Data will be refreshed only when user clicks refresh button
  })
}

// Get activities with schedules for a project (returns all weeks)
export function useActivitiesWithSchedules(projectId: string) {
  return useQuery({
    queryKey: [...activityKeys.list(projectId), 'schedules'],
    queryFn: async () => {
      const params = new URLSearchParams({
        includeSchedules: 'true',
      })
      
      const response = await fetch(`/api/projects/${projectId}/activities?${params}`)
      if (!response.ok) throw new Error('Failed to fetch activities with schedules')
      
      const data = await response.json()
      return data.data as Activity[]
    },
    staleTime: 30 * 1000, // 30 seconds for schedule data
    enabled: !!projectId,
  })
}

// Get activity detail
export function useActivityDetail(activityId: string) {
  return useQuery({
    queryKey: activityKeys.detail(activityId),
    queryFn: async () => {
      const response = await apiClient.get<{ data: Activity }>(
        `/projects/1/activities/${activityId}`
      )
      return response.data
    },
    enabled: !!activityId,
  })
}

// Create activity mutation
export function useCreateActivity(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateActivityData) => {
      const response = await apiClient.post<Activity>(`/projects/${projectId}/activities`, data)
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
    },
  })
}

// Update activity mutation
export function useUpdateActivity(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({
      activityId,
      data,
    }: {
      activityId: string
      data: z.infer<typeof UpdateActivitySchema>
    }) => {
      const response = await apiClient.put<Activity>(
        `/projects/${projectId}/activities/${activityId}`,
        data
      )
      return response
    },
    onSuccess: (_, { activityId }) => {
      queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) })
    },
  })
}

// Delete activity mutation
export function useDeleteActivity(projectId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (activityId: string) => {
      await apiClient.delete(`/projects/${projectId}/activities/${activityId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
    },
  })
}

// Create sub-activity mutation
export function useCreateSubActivity(projectId: string, activityId: string) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateSubActivityData) => {
      const response = await apiClient.post<SubActivity>(
        `/projects/${projectId}/activities/${activityId}/sub-activities`,
        data
      )
      return response
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
      queryClient.invalidateQueries({ queryKey: activityKeys.detail(activityId) })
    },
  })
}

// Update schedule mutation
export function useUpdateSchedule() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: {
      activityId?: string
      subActivityId?: string
      month: number
      year: number
      week: number
      planPercentage?: number | null
      actualPercentage?: number | null
    }) => {
      const response = await apiClient.put<{ data: unknown }>('/activities/schedule', data)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: activityKeys.all })
    },
  })
}

// Get project detail
export function useProject(projectId: string) {
  return useQuery({
    queryKey: projectKeys.detail(projectId),
    queryFn: async () => {
      const response = await apiClient.getProject(projectId)
      return response
    },
    enabled: !!projectId,
  })
}

// Response schema for schedule update
const ScheduleUpdateResponseSchema = z.object({
  success: z.literal(true),
  data: z.object({
    id: z.string(),
    weekNumber: z.number(),
    plan: z.number().nullable(),
    actionPlan: z.number().nullable(),
    realization: z.number().nullable(),
    subActivityId: z.string(),
    updatedAt: z.string(),
  }),
})

export type ScheduleValueType = 'plan' | 'actionPlan' | 'realization'

// Hook for updating single schedule value with optimistic updates
export function useUpdateScheduleValue(projectId: string) {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async (payload: {
      scheduleId: string
      valueType: ScheduleValueType
      value: number | null
    }) => {
      const { scheduleId, valueType, value } = payload
      
      const updateData = {
        [valueType]: value
      }

      const response = await fetch(`/api/schedules/${scheduleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update schedule value')
      }
      
      const data = await response.json()
      return ScheduleUpdateResponseSchema.parse(data)
    },

    // Optimistic update - immediately update cache without waiting for server response
    onMutate: async (variables) => {
      const { scheduleId, valueType, value } = variables

      // Cancel outgoing refetches for activities with schedules
      const activitiesQueryKey = [...activityKeys.list(projectId), 'schedules']
      await queryClient.cancelQueries({ queryKey: activitiesQueryKey })

      // Snapshot the previous value
      const previousData = queryClient.getQueryData(activitiesQueryKey)

      // Optimistically update the specific schedule value in activities cache
      queryClient.setQueryData(activitiesQueryKey, (oldData: ActivityWithSchedules[]) => {
        if (!oldData) return oldData

        return oldData.map((activity: ActivityWithSchedules) => ({
          ...activity,
          subActivities: activity.subActivities?.map((subActivity: SubActivity & { schedules?: Schedule[] }) => ({
            ...subActivity,
            schedules: subActivity.schedules?.map((schedule: Schedule) => {
              if (schedule.id === scheduleId) {
                return {
                  ...schedule,
                  [valueType]: value,
                  updatedAt: new Date(),
                }
              }
              return schedule
            }),
          })),
        }))
      })

      // Return context with snapshot for potential rollback
      return { previousData }
    },

    // Rollback on error
    onError: (error, variables, context) => {
      if (context?.previousData) {
        const activitiesQueryKey = [...activityKeys.list(projectId), 'schedules']
        queryClient.setQueryData(activitiesQueryKey, context.previousData)
      }
    },

    // Optional: Refetch to ensure consistency (only if needed)
    onSettled: () => {
      // Only invalidate if you want to periodically sync with server
      // This is much more targeted than invalidating all activities
      // queryClient.invalidateQueries({ 
      //   queryKey: [...activityKeys.list(projectId), 'schedules'] 
      // })
    },
  })
}
