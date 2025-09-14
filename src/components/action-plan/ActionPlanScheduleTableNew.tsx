'use client'

import React from 'react'
import { UnifiedScheduleTable } from '@/components/shared/UnifiedScheduleTable'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import { useSchedulePlans, useCreateSchedulePlan, useUpdateSchedulePlan } from '@/hooks/useSchedulePlans'
import { useRealizations, useCreateRealization, useUpdateRealization } from '@/hooks/useRealizations'
import { generateSequentialWeeks } from '@/utils/dateUtils'

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

  const currentYear = new Date().getFullYear()

  // Function to get schedule value from separate SchedulePlan and Realization models
  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!project?.tanggalSpmk) return null

    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)
    if (!sequentialWeeks[weekNumber - 1]) return null

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    // Find the schedule from appropriate model
    if (type === 'plan') {
      if (!schedulePlans) return null
      
      const schedulePlan = schedulePlans.find(s => {
        return (
          s.subActivityId === (subActivityId || '') &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      })
      
      return schedulePlan?.percentage ?? null
    } else {
      if (!realizations) return null
      
      const realization = realizations.find(r => {
        return (
          r.subActivityId === (subActivityId || '') &&
          r.month === month &&
          r.week === week &&
          r.year === currentYear
        )
      })
      
      return realization?.percentage ?? null
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
    if (!project?.tanggalSpmk) {
      throw new Error('Project SPMK date is required')
    }

    if (!subActivityId) {
      throw new Error('SubActivity ID is required for schedule values')
    }

    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)
    if (!sequentialWeeks[weekNumber - 1]) {
      throw new Error(`Invalid week number: ${weekNumber}`)
    }

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    const scheduleData = {
      subActivityId,
      month,
      year: currentYear,
      week,
      percentage: value || 0,
    }

    if (type === 'plan') {
      // Check if schedule plan already exists
      const existingPlan = schedulePlans?.find(s => 
        s.subActivityId === subActivityId &&
        s.month === month &&
        s.week === week &&
        s.year === currentYear
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
        r.month === month &&
        r.week === week &&
        r.year === currentYear
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
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    if (!activities || !project?.tanggalSpmk) return 0

    // Generate sequential weeks to determine the cutoff point
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)
    const targetWeekIndex = sequentialWeeks.findIndex(
      sw => sw.month === month && sw.weekInMonth === week
    )

    if (targetWeekIndex === -1) return 0

    // Calculate cumulative sum up to and including the target week
    let cumulative = 0

    for (let i = 0; i <= targetWeekIndex; i++) {
      const currentWeek = sequentialWeeks[i]

      // Sum all sub-activities for this week
      const weekTotal = activities.reduce((total, activity) => {
        const subActivityTotal =
          activity.subActivities?.reduce((subTotal, subActivity) => {
            const value = getScheduleValue(
              activity.id,
              subActivity.id,
              currentWeek.weekNumber,
              type === 'deviation' ? 'actual' : type // Use actual for deviation calculation
            )
            return subTotal + (value || 0)
          }, 0) || 0
        return total + subActivityTotal
      }, 0)

      cumulative += weekTotal
    }

    // For deviation, calculate the difference between cumulative actual and plan
    if (type === 'deviation') {
      const cumulativePlan = getCumulativeValueForWeek(month, week, 'plan')
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
