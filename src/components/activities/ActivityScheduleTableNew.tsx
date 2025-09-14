'use client'

import React from 'react'
import { UnifiedSchedulePlanTable } from '@/components/shared/UnifiedSchedulePlanTable'
import { useActivities, useUpdateSchedulePlan, useProject } from '@/hooks/useActivityQueries'
import { generateSequentialWeeks } from '@/utils/dateUtils'

/**
 * Activity SchedulePlan Table Component
 *
 * This component wraps the UnifiedSchedulePlanTable to handle Activity SchedulePlans specifically.
 * It provides the necessary data fetching and mutation functions for activity scheduleplans.
 */
interface SchedulePlanTableProps {
  projectId: string
}

export function SchedulePlanTableNew({ projectId }: SchedulePlanTableProps) {
  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const updateSchedulePlanMutation = useUpdateSchedulePlan()

  const currentYear = new Date().getFullYear()

  // Function to get scheduleplan value from activity data
  const getSchedulePlanValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!activities || !project?.tanggalSpmk) return null

    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)
    if (!sequentialWeeks[weekNumber - 1]) return null

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return null

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    if (subActivityId) {
      const subActivity = activity.subActivities?.find(sa => sa.id === subActivityId)
      const scheduleplan = subActivity?.scheduleplans?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      const value = type === 'plan' ? scheduleplan?.planPercentage : scheduleplan?.actualPercentage
      return value !== undefined ? value : null
    } else {
      const scheduleplan = activity.scheduleplans?.find(
        s => s.month === month && s.week === week && s.year === currentYear
      )
      const value = type === 'plan' ? scheduleplan?.planPercentage : scheduleplan?.actualPercentage
      return value !== undefined ? value : null
    }
  }

  // Function to save scheduleplan values
  const saveSchedulePlanValue = async (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual',
    value: number | null
  ): Promise<void> => {
    if (!project?.tanggalSpmk) {
      throw new Error('Project SPMK date is required')
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

    await updateSchedulePlanMutation.mutateAsync({
      activityId: subActivityId ? undefined : activityId,
      subActivityId: subActivityId || undefined,
      month,
      year: currentYear,
      week,
      [type === 'plan' ? 'planPercentage' : 'actualPercentage']: value,
    })
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
            const value = getSchedulePlanValue(
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
    <UnifiedSchedulePlanTable
      projectId={projectId}
      title="Activity SchedulePlan"
      activities={activities}
      project={project}
      isLoading={isLoading}
      getSchedulePlanValue={getSchedulePlanValue}
      saveSchedulePlanValue={saveSchedulePlanValue}
      getCumulativeValueForWeek={getCumulativeValueForWeek}
      showAddButton={true}
      showTitle={false} // Don't show title as it's handled by parent component
      showCumulativeSection={true}
      weekCount={20}
    />
  )
}
