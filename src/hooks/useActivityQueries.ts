import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type {
  Activity,
  SubActivity,
  UpdateActivitySchema,
  UpdateSubActivitySchema,
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

// Define project type
type Project = {
  id: string
  tanggalKontrak?: string | null
  akhirKontrak?: string | null
  // other project fields...
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
      const response = await apiClient.put<{ data: any }>('/activities/schedule', data)
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
      const response = await apiClient.get<Project>(`/projects/${projectId}`)
      return response
    },
    enabled: !!projectId,
  })
}
