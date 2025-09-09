import { useInfiniteQuery } from '@tanstack/react-query'
import type {
  DailySubActivitiesQuery,
  DailySubActivitiesResponse,
  DailySubActivitiesErrorResponse,
} from '@/lib/schemas/daily-sub-activities'

// Hook for infinite scroll daily sub activities
export function useDailySubActivitiesInfinite(
  params: Omit<Partial<DailySubActivitiesQuery>, 'page'> = {}
) {
  return useInfiniteQuery<DailySubActivitiesResponse, DailySubActivitiesErrorResponse>({
    queryKey: ['daily-sub-activities-infinite', params],
    queryFn: async ({ pageParam = 1 }) => {
      const queryParams = new URLSearchParams()

      // Add page parameter
      queryParams.append('page', String(pageParam))

      // Add other parameters
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          queryParams.append(key, String(value))
        }
      })

      const url = `/api/daily-sub-activities/list?${queryParams.toString()}`
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw errorData
      }

      return response.json()
    },
    getNextPageParam: lastPage => {
      // Return next page number if there are more pages, otherwise undefined
      return lastPage.pagination.hasNext ? lastPage.pagination.page + 1 : undefined
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook with default settings optimized for mobile
export function useDailySubActivitiesInfiniteMobile(
  filters: Omit<Partial<DailySubActivitiesQuery>, 'page'> = {}
) {
  return useDailySubActivitiesInfinite({
    limit: 20, // Larger page size for better mobile performance
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    ...filters,
  })
}

// Hook for search with infinite scroll
export function useDailySubActivitiesInfiniteSearch(
  searchQuery: string,
  filters: Omit<Partial<DailySubActivitiesQuery>, 'page' | 'search'> = {}
) {
  return useDailySubActivitiesInfinite({
    ...filters,
    search: searchQuery.trim() || undefined,
    limit: 15, // Slightly smaller for search results
  })
}

// Hook for project-specific infinite scroll
export function useProjectDailySubActivitiesInfinite(
  projectId: string,
  params: Omit<Partial<DailySubActivitiesQuery>, 'page' | 'projectId'> = {}
) {
  return useDailySubActivitiesInfinite({
    ...params,
    projectId,
    limit: 20,
  })
}

// Hook for activity-specific infinite scroll
export function useActivityDailySubActivitiesInfinite(
  activityId: string,
  params: Omit<Partial<DailySubActivitiesQuery>, 'page' | 'activityId'> = {}
) {
  return useDailySubActivitiesInfinite({
    ...params,
    activityId,
    limit: 20,
  })
}
