import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { 
  AddendumListResponse,
  AddendumResponse,
  CreateAddendumRequest,
  UpdateAddendumRequest,
  ProjectStatusResponse,
  UpdateProjectStatusRequest,
  AddendumQuery
} from '@/lib/schemas/addendum'
import { projectKeys } from './useProjectQueries'

/**
 * Custom React Query hooks for addendum management
 * Provides data fetching, mutations, and cache management for addendum lifecycle
 */

// Query key factories for consistent cache management
export const addendumKeys = {
  all: ['addendums'] as const,
  lists: () => [...addendumKeys.all, 'list'] as const,
  list: (filters: Partial<AddendumQuery>) => [...addendumKeys.lists(), filters] as const,
  details: () => [...addendumKeys.all, 'detail'] as const,
  detail: (id: string) => [...addendumKeys.details(), id] as const,
  project: (projectId: string) => [...addendumKeys.all, 'project', projectId] as const,
} as const

export const projectStatusKeys = {
  all: ['projectStatus'] as const,
  detail: (projectId: string) => [...projectStatusKeys.all, projectId] as const,
} as const

/**
 * Hook to fetch list of addendums with optional filtering
 * Supports pagination and filtering by project, addendum number
 */
export function useAddendums(params: Partial<AddendumQuery> = {}) {
  return useQuery({
    queryKey: addendumKeys.list(params),
    queryFn: async (): Promise<AddendumListResponse> => {
      const searchParams = new URLSearchParams()
      
      // Add query parameters
      if (params.projectId) searchParams.set('projectId', params.projectId)
      if (params.addendumNumber) searchParams.set('addendumNumber', params.addendumNumber.toString())
      if (params.page) searchParams.set('page', params.page.toString())
      if (params.limit) searchParams.set('limit', params.limit.toString())

      const response = await fetch(`/api/addendums?${searchParams}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch addendums')
      }

      return response.json()
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Hook to fetch a specific addendum by ID
 */
export function useAddendum(addendumId: string | null) {
  return useQuery({
    queryKey: addendumKeys.detail(addendumId || ''),
    queryFn: async (): Promise<AddendumResponse> => {
      if (!addendumId) throw new Error('Addendum ID is required')

      const response = await fetch(`/api/addendums/${addendumId}`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch addendum')
      }

      return response.json()
    },
    enabled: !!addendumId,
    staleTime: 1000 * 60 * 10, // 10 minutes
  })
}

/**
 * Hook to fetch project status and addendum information for schedule editing
 */
export function useProjectStatus(projectId: string | null) {
  return useQuery({
    queryKey: projectStatusKeys.detail(projectId || ''),
    queryFn: async (): Promise<ProjectStatusResponse> => {
      if (!projectId) throw new Error('Project ID is required')

      const response = await fetch(`/api/projects/${projectId}/status`)
      
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to fetch project status')
      }

      return response.json()
    },
    enabled: !!projectId,
    staleTime: 1000 * 60 * 2, // 2 minutes - status can change frequently
  })
}

/**
 * Hook to create a new addendum
 * Invalidates related queries on success
 */
export function useCreateAddendum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (data: CreateAddendumRequest): Promise<AddendumResponse> => {
      const response = await fetch('/api/addendums', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create addendum')
      }

      return response.json()
    },
    onSuccess: (data) => {
      // Invalidate addendum lists to refresh the data
      queryClient.invalidateQueries({ queryKey: addendumKeys.lists() })
      
      // Invalidate project-specific addendums
      queryClient.invalidateQueries({ 
        queryKey: addendumKeys.project(data.data.projectId) 
      })
      
      // Invalidate project status to reflect changes
      queryClient.invalidateQueries({ 
        queryKey: projectStatusKeys.detail(data.data.projectId) 
      })

      // Invalidate project detail to reflect status change
      queryClient.invalidateQueries({ 
        queryKey: projectKeys.detail(data.data.projectId) 
      })

      // Immediately cache the new addendum detail
      queryClient.setQueryData(
        addendumKeys.detail(data.data.id), 
        data
      )
    },
  })
}

/**
 * Hook to update an existing addendum
 * Uses optimistic updates for better UX
 */
export function useUpdateAddendum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      addendumId, 
      data 
    }: { 
      addendumId: string; 
      data: UpdateAddendumRequest 
    }): Promise<AddendumResponse> => {
      const response = await fetch(`/api/addendums/${addendumId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update addendum')
      }

      return response.json()
    },
    onSuccess: (data, variables) => {
      // Update the cached addendum detail
      queryClient.setQueryData(
        addendumKeys.detail(variables.addendumId), 
        data
      )
      
      // Invalidate lists to reflect updated data
      queryClient.invalidateQueries({ queryKey: addendumKeys.lists() })
      
      // Invalidate project status in case status-related fields changed
      queryClient.invalidateQueries({ 
        queryKey: projectStatusKeys.detail(data.data.projectId) 
      })
    },
  })
}

/**
 * Hook to delete an addendum
 * Removes from cache on success
 */
export function useDeleteAddendum() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (addendumId: string): Promise<{ success: boolean }> => {
      const response = await fetch(`/api/addendums/${addendumId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete addendum')
      }

      return response.json()
    },
    onSuccess: (_, addendumId) => {
      // Remove from cache
      queryClient.removeQueries({ queryKey: addendumKeys.detail(addendumId) })
      
      // Invalidate lists to reflect deletion
      queryClient.invalidateQueries({ queryKey: addendumKeys.lists() })
      
      // Note: We don't have the projectId here, so we invalidate all project status queries
      queryClient.invalidateQueries({ queryKey: projectStatusKeys.all })
    },
  })
}

/**
 * Hook to update project status (DRAFT -> KONTRAK -> DRAFT_ADDENDUM cycle)
 * Critical for schedule editing permissions
 */
export function useUpdateProjectStatus() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      projectId, 
      data 
    }: { 
      projectId: string; 
      data: UpdateProjectStatusRequest 
    }): Promise<ProjectStatusResponse> => {
      const response = await fetch(`/api/projects/${projectId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update project status')
      }

      return response.json()
    },
    onSuccess: (_, variables) => {
      // Invalidate project status to refetch updated data
      queryClient.invalidateQueries({ 
        queryKey: projectStatusKeys.detail(variables.projectId) 
      })
      
      // This status change affects schedule editing permissions
      // So we need to invalidate any schedule-related queries as well
      queryClient.invalidateQueries({ 
        queryKey: ['schedules', variables.projectId] 
      })
    },
  })
}

/**
 * Helper hook to check if schedule plans can be edited for a specific project and week
 * Uses the project status to determine permissions
 */
export function useCanEditSchedulePlan(projectId: string | null, weekNumber: number) {
  const { data: statusData, isLoading } = useProjectStatus(projectId)
  
  if (isLoading || !statusData?.success) {
    return { canEdit: false, isLoading }
  }

  const { status, currentAddendum } = statusData.data
  
  let canEdit = false
  
  switch (status) {
    case 'DRAFT':
      canEdit = true
      break
    case 'KONTRAK':
      canEdit = false
      break
    case 'DRAFT_ADDENDUM':
      canEdit = currentAddendum ? weekNumber >= currentAddendum.weekNumber : false
      break
  }

  return { 
    canEdit, 
    isLoading: false, 
    status, 
    currentAddendum,
    editableFromWeek: currentAddendum?.weekNumber || null
  }
}
