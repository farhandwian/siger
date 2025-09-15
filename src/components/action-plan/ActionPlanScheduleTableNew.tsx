'use client'

import React from 'react'
import { UnifiedScheduleTable } from '@/components/shared/UnifiedScheduleTable'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import { useSchedulePlans, useCreateSchedulePlan, useUpdateSchedulePlan } from '@/hooks/useSchedulePlans'
import { useRealizations, useCreateRealization, useUpdateRealization } from '@/hooks/useRealizations'

/**
 * Action Plan Schedule Table Component
 *
 * This component wraps the UnifiedScheduleTable to handle Action Plan Schedules specifically.
 * It provides the necessary data fetching and mutation functions for action plan schedules.
 */
interface ActionPlanTableProps {
  projectId: string
}

export function ActionPlanTableNew({ projectId }: ActionPlanTableProps) {
  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const { data: schedulePlans } = useSchedulePlans({ projectId })
  const { data: realizations } = useRealizations({ projectId })
  
  const createSchedulePlan = useCreateSchedulePlan()
  const updateSchedulePlan = useUpdateSchedulePlan()
  const createRealization = useCreateRealization()
  const updateRealization = useUpdateRealization()

  // Function to get schedule value from separate SchedulePlan and Realization models
  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!subActivityId) return null

    if (type === 'plan') {
      const plan = schedulePlans?.find(p => 
        p.subActivityId === subActivityId && 
        p.weekNumber === weekNumber
      )
      return plan?.percentage || null
    } else {
      const realization = realizations?.find(r => 
        r.subActivityId === subActivityId && 
        r.weekNumber === weekNumber
      )
      return realization?.percentage || null
    }
  }

  // Function to save schedule values to separate models
  const saveScheduleValue = async (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual',
    value: number | null
  ): Promise<void> => {
    if (!subActivityId) {
      throw new Error('SubActivity ID is required for schedule values')
    }

    const scheduleData = {
      subActivityId,
      weekNumber,
      percentage: value || 0,
    }

    if (type === 'plan') {
      // Check if schedule plan already exists
      const existingPlan = schedulePlans?.find(s => 
        s.subActivityId === subActivityId &&
        s.weekNumber === weekNumber
      )

      if (existingPlan) {
        await updateSchedulePlan.mutateAsync({
          id: existingPlan.id,
          data: { percentage: value || 0 }
        })
      } else {
        await createSchedulePlan.mutateAsync(scheduleData)
      }
    } else {
      // Check if realization already exists
      const existingRealization = realizations?.find(r => 
        r.subActivityId === subActivityId &&
        r.weekNumber === weekNumber
      )

      if (existingRealization) {
        await updateRealization.mutateAsync({
          id: existingRealization.id,
          data: { percentage: value || 0 }
        })
      } else {
        await createRealization.mutateAsync(scheduleData)
      }
    }
  }

  // Function to calculate cumulative values for each week
  const getCumulativeValueForWeek = (
    weekNumber: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    if (!activities) return 0

    // Calculate cumulative sum up to and including the target week
    let cumulative = 0

    for (let i = 1; i <= weekNumber; i++) {
      // Sum all sub-activities for this week
      const weekTotal = activities.reduce((total, activity) => {
        const subActivityTotal =
          activity.subActivities?.reduce((subTotal, subActivity) => {
            const value = getScheduleValue(
              activity.id,
              subActivity.id,
              i, // current week number
              type === 'deviation' ? 'actual' : type
            )
            return subTotal + (value || 0)
          }, 0) || 0
        return total + subActivityTotal
      }, 0)

      cumulative += weekTotal
    }

    // For deviation, calculate the difference between cumulative actual and plan
    if (type === 'deviation') {
      const cumulativePlan = getCumulativeValueForWeek(weekNumber, 'plan')
      return cumulative - cumulativePlan
    }

    return cumulative
  }

  return (
    <UnifiedScheduleTable
      projectId={projectId}
      title="Action Plan Schedule"
      activities={activities}
      project={project}
      isLoading={isLoading}
      getScheduleValue={getScheduleValue}
      saveScheduleValue={saveScheduleValue}
      getCumulativeValueForWeek={getCumulativeValueForWeek}
      showAddButton={true}
      showTitle={false} // Don't show title as it's handled by parent component
      showCumulativeSection={true}
      weekCount={20}
    />
  )
}
