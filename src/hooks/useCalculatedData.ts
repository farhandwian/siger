import { useMemo } from 'react'
import { useActivitiesWithSchedules, useProject } from '@/hooks/useActivityQueries'

export interface CalculatedData {
  getCalculatedValueForWeek: (
    weekNumber: number,
    type: 'total-plan' | 'total-action-plan' | 'total-realization' | 'cumulative-plan' | 'cumulative-action-plan' | 'cumulative-realization' | 'deviation-plan' | 'deviation-action-plan'
  ) => number
  calculatedValues: Map<string, number>
  isLoading: boolean
}

/**
 * Hook to calculate both total and cumulative values for activities and action plans
 * This data is calculated once when the project page loads and can be shared across tabs
 * 
 * Types supported:
 * - total-plan: Sum of plan values for a specific week only
 * - total-action-plan: Sum of action plan values for a specific week only  
 * - total-realization: Sum of realization values for a specific week only
 * - cumulative-plan: Running total of plan values up to and including the specified week
 * - cumulative-action-plan: Running total of action plan values up to and including the specified week
 * - cumulative-realization: Running total of realization values up to and including the specified week
 * - deviation-plan: Difference between cumulative realization and cumulative plan
 * - deviation-action-plan: Difference between cumulative realization and cumulative action plan
 */
export function useCalculatedData(projectId: string): CalculatedData {
  const { data: activities, isLoading: activitiesLoading } = useActivitiesWithSchedules(projectId)
  const { data: project, isLoading: projectLoading } = useProject(projectId)

  // Pre-calculate both total and cumulative values using embedded schedule data
  const calculatedValues = useMemo(() => {
    const values = new Map<string, number>()

    if (!activities) return values

    let cumulativePlan = 0
    let cumulativeActionPlan = 0
    let cumulativeRealization = 0
    
    // Calculate values for each week in sequence
    // Use project's numberOfWeeks if available, fallback to 20
    const maxWeeks = project?.numberOfWeeks || 20
    for (let week = 1; week <= maxWeeks; week++) {
      let weekTotalPlan = 0
      let weekTotalActionPlan = 0
      let weekTotalRealization = 0
      
      // Sum all sub-activities for current week using embedded schedule data
      activities.forEach(activity => {
        activity.subActivities?.forEach(subActivity => {
          // Find schedule for this week directly from embedded data
          const schedule = subActivity.schedules?.find(s => s.weekNumber === week)
          if (schedule) {
            weekTotalPlan += schedule.plan || 0
            weekTotalActionPlan += schedule.actionPlan || 0
            weekTotalRealization += schedule.realization || 0
          }
        })
      })
      
      // Update cumulative totals
      cumulativePlan += weekTotalPlan
      cumulativeActionPlan += weekTotalActionPlan
      cumulativeRealization += weekTotalRealization

      // Store total values (per-week values)
      values.set(`${week}-total-plan`, weekTotalPlan)
      values.set(`${week}-total-action-plan`, weekTotalActionPlan)
      values.set(`${week}-total-realization`, weekTotalRealization)

      // Store cumulative values (running totals)
      values.set(`${week}-cumulative-plan`, cumulativePlan)
      values.set(`${week}-cumulative-action-plan`, cumulativeActionPlan)
      values.set(`${week}-cumulative-realization`, cumulativeRealization)

      // Store deviation values (cumulative realization vs cumulative plan/action plan)
      values.set(`${week}-deviation-plan`, cumulativeRealization - cumulativePlan)
      values.set(`${week}-deviation-action-plan`, cumulativeRealization - cumulativeActionPlan)

      // Legacy keys for backward compatibility
      values.set(`${week}-plan`, cumulativePlan)
      values.set(`${week}-actionPlan`, cumulativeActionPlan)
      values.set(`${week}-actual`, cumulativeRealization)
    }

    return values
  }, [activities, project?.numberOfWeeks])

  const getCalculatedValueForWeek = (
    weekNumber: number,
    type: 'total-plan' | 'total-action-plan' | 'total-realization' | 'cumulative-plan' | 'cumulative-action-plan' | 'cumulative-realization' | 'deviation-plan' | 'deviation-action-plan'
  ): number => {
    const key = `${weekNumber}-${type}`
    return calculatedValues.get(key) || 0
  }

  return {
    getCalculatedValueForWeek,
    calculatedValues,
    isLoading: activitiesLoading || projectLoading
  }
}
