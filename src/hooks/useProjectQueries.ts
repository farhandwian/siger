'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, type ProjectListResponse, type ProjectDetailResponse } from '@/lib/api-client'
import { z } from 'zod'
import { ProjectListQuerySchema, UpdateProjectFieldSchema } from '@/lib/schemas'

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (filters: Partial<z.infer<typeof ProjectListQuerySchema>>) =>
    [...projectKeys.lists(), filters] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
}

// Custom hook for fetching projects list
export function useProjects(params: Partial<z.infer<typeof ProjectListQuerySchema>> = {}) {
  return useQuery({
    queryKey: projectKeys.list(params),
    queryFn: () => apiClient.getProjects(params),
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry for validation errors
      if (error?.message?.includes('Invalid') || error?.message?.includes('required')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Custom hook for fetching project detail
export function useProjectDetail(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => apiClient.getProject(id),
    enabled: !!id && typeof id === 'string',
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      // Don't retry for 404 errors
      if (error?.message?.includes('not found') || error?.message?.includes('404')) {
        return false
      }
      return failureCount < 3
    },
  })
}

// Custom hook for updating project field with optimistic updates
export function useUpdateProjectField() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: z.infer<typeof UpdateProjectFieldSchema>) => {
      // Validate data before sending
      const validatedData = UpdateProjectFieldSchema.parse(data)
      return apiClient.updateProjectField(validatedData)
    },

    // Optimistic update
    onMutate: async variables => {
      const { projectId, fieldName, value } = variables

      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: projectKeys.detail(projectId) })

      // Snapshot the previous value
      const previousProject = queryClient.getQueryData(projectKeys.detail(projectId))

      // Optimistically update the project
      queryClient.setQueryData(projectKeys.detail(projectId), (old: any) => {
        if (!old) return old
        return {
          ...old,
          [fieldName]: value,
          updatedAt: new Date().toISOString(),
        }
      })

      // Return context with snapshot
      return { previousProject, projectId }
    },

    // On error, rollback the optimistic update
    onError: (error, variables, context) => {
      if (context?.previousProject) {
        queryClient.setQueryData(projectKeys.detail(context.projectId), context.previousProject)
      }
      console.error('Failed to update project field:', error)
    },

    // Always refetch after success or error
    onSettled: (data, error, variables) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(variables.projectId) })
      // Also invalidate project lists to keep them fresh
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() })
    },

    // Success callback
    onSuccess: (data, variables) => {
      console.log(`Successfully updated ${variables.fieldName} for project ${variables.projectId}`)
    },
  })
}

// Custom hook for prefetching project data
export function usePrefetchProject() {
  const queryClient = useQueryClient()

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: projectKeys.detail(id),
      queryFn: () => apiClient.getProject(id),
      staleTime: 1000 * 60 * 2, // 2 minutes
    })
  }
}

// Custom hook for invalidating project caches
export function useInvalidateProjects() {
  const queryClient = useQueryClient()

  return {
    invalidateAll: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
    invalidateLists: () => queryClient.invalidateQueries({ queryKey: projectKeys.lists() }),
    invalidateProject: (id: string) =>
      queryClient.invalidateQueries({ queryKey: projectKeys.detail(id) }),
  }
}

// Utility hook for checking loading states
export function useProjectsLoadingState(
  params: Partial<z.infer<typeof ProjectListQuerySchema>> = {}
) {
  const { isLoading, isFetching, error } = useProjects(params)

  return {
    isLoading: isLoading || isFetching,
    hasError: !!error,
    error: error?.message || null,
  }
}

// Utility hook for checking project detail loading state
export function useProjectDetailLoadingState(id: string) {
  const { isLoading, isFetching, error } = useProjectDetail(id)

  return {
    isLoading: isLoading || isFetching,
    hasError: !!error,
    error: error?.message || null,
  }
}

// Error boundary helper
export function useProjectError() {
  return {
    isValidationError: (error: Error) => {
      return (
        error.message.includes('validation') ||
        error.message.includes('Invalid') ||
        error.message.includes('required')
      )
    },
    isNetworkError: (error: Error) => {
      return (
        error.message.includes('fetch') ||
        error.message.includes('network') ||
        error.message.includes('connection')
      )
    },
    isNotFoundError: (error: Error) => {
      return error.message.includes('not found') || error.message.includes('404')
    },
  }
}
