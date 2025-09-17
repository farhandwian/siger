import { useQuery } from '@tanstack/react-query'
import { ProjectsListResponseSchema } from '@/lib/schemas/projects-list'

/**
 * Transformed project data for the component
 * Maps existing API response to component requirements
 */
export interface ComponentProjectData {
  id: string
  title: string
  progress: number
  plannedProgress: number
  type: string
  area: string
  contractValue: string | null
}

/**
 * Hook to fetch projects list for progress display using existing /api/projects endpoint
 * Used by ProgressSeluruhPekerjaan component to show all projects with their progress
 */
export function useProjectsList() {
  return useQuery({
    queryKey: ['projects-list'],
    queryFn: async (): Promise<ComponentProjectData[]> => {
      // Use existing /api/projects endpoint with a large limit to get all projects
      const response = await fetch('/api/projects?limit=100', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch projects list`)
      }

      const json = await response.json()

      // Validate response with Zod schema
      const validatedResponse = ProjectsListResponseSchema.parse(json)

      if (!validatedResponse.success) {
        throw new Error('Failed to fetch projects list')
      }

      // Transform data to match component requirements
      const projects = validatedResponse.data.projects

      return projects.map((project, index) => {
        // Simple mapping for areas - in real implementation, this could be based on location or other criteria
        const areas = ['IRA 1', 'IRA 2', 'IRA III']
        const area = areas[index % areas.length]

        return {
          id: project.id,
          title: project.title,
          progress: project.progress,
          plannedProgress: project.target,
          type: project.type,
          area: area,
          contractValue: project.budget || null,
        }
      })
    },
    staleTime: 30_000, // 30 seconds - data doesn't change frequently
    refetchOnWindowFocus: false, // Don't refetch when window regains focus
    retry: 3, // Retry failed requests 3 times
    retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  })
}
