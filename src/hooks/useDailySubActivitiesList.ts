import { useQuery } from '@tanstack/react-query'
import type {
  DailySubActivitiesQuery,
  DailySubActivitiesResponse,
  DailySubActivitiesErrorResponse,
} from '@/lib/schemas/daily-sub-activities'

// Hook for fetching daily sub activities list
export function useDailySubActivitiesList(params: Partial<DailySubActivitiesQuery> = {}) {
  const queryParams = new URLSearchParams()

  // Add all parameters to query string
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      queryParams.append(key, String(value))
    }
  })

  return useQuery<DailySubActivitiesResponse, DailySubActivitiesErrorResponse>({
    queryKey: ['daily-sub-activities-list', params],
    queryFn: async () => {
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
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  })
}

// Hook with default pagination and sorting
export function useDailySubActivitiesListDefault() {
  return useDailySubActivitiesList({
    page: 1,
    limit: 10,
    sortBy: 'updatedAt',
    sortOrder: 'desc',
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}

// Hook with search functionality
export function useDailySubActivitiesSearch(
  searchQuery: string,
  filters: Partial<DailySubActivitiesQuery> = {}
) {
  return useDailySubActivitiesList({
    ...filters,
    search: searchQuery,
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}

// Hook for specific project's daily sub activities
export function useProjectDailySubActivities(
  projectId: string,
  params: Partial<DailySubActivitiesQuery> = {}
) {
  return useDailySubActivitiesList({
    ...params,
    projectId,
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}

// Hook for specific activity's daily sub activities
export function useActivityDailySubActivities(
  activityId: string,
  params: Partial<DailySubActivitiesQuery> = {}
) {
  return useDailySubActivitiesList({
    ...params,
    activityId,
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}

// Hook for specific sub activity's daily activities
export function useSubActivityDailyActivities(
  subActivityId: string,
  params: Partial<DailySubActivitiesQuery> = {}
) {
  return useDailySubActivitiesList({
    ...params,
    subActivityId,
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}

// Hook for date range filtering
export function useDailySubActivitiesDateRange(
  startDate: string,
  endDate: string,
  params: Partial<DailySubActivitiesQuery> = {}
) {
  return useDailySubActivitiesList({
    ...params,
    startDate,
    endDate,
    // userId: 'cmfb8i5yo0000vpgc5p776720', // Default user ID - TEMPORARILY DISABLED
  })
}
