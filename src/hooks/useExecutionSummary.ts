import { useQuery } from '@tanstack/react-query'
import { ExecutionSummary } from '@/app/api/projects/execution-summary/route'

/**
 * Hook to fetch execution summary data for pelaksanaan section
 * Returns real project metrics: total projects, contract value, progress, deviation
 */
export function useExecutionSummary() {
  return useQuery({
    queryKey: ['execution-summary'],
    queryFn: async (): Promise<ExecutionSummary> => {
      const response = await fetch('/api/projects/execution-summary', {
        cache: 'no-store',
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: Failed to fetch execution summary`)
      }

      const json = await response.json()

      if (!json.success) {
        throw new Error(json.error || 'Failed to fetch execution summary')
      }

      return json.data
    },
    staleTime: 30_000, // 30 seconds
    refetchOnWindowFocus: false,
  })
}
