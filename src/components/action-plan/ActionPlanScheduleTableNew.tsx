'use client'

import React from 'react'
import { UnifiedSchedulePlanTable } from '@/components/shared/UnifiedSchedulePlanTable'
import { useActivities, useProject } from '@/hooks/useActivityQueries'
import { useActionPlans, useUpsertActionPlan } from '@/hooks/useActionPlans'
import { generateSequentialWeeks } from '@/utils/dateUtils'

/**
 * Action Plan SchedulePlan Table Component
 *
 * This component wraps the UnifiedSchedulePlanTable to handle Action Plan SchedulePlans specifically.
 * It provides the necessary data fetching and mutation functions for action plan scheduleplans.
 */
interface ActionPlanTableProps {
  projectId: string
}

export function ActionPlanTableNew({ projectId }: ActionPlanTableProps) {
  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const { data: actionPlans } = useActionPlans({ projectId })
  const upsertActionPlanMutation = useUpsertActionPlan()

  const currentYear = new Date().getFullYear()

  // Function to get action plan scheduleplan value
  const getSchedulePlanValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!actionPlans || !project?.tanggalSpmk) return null

    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(project.tanggalSpmk, 20)
    if (!sequentialWeeks[weekNumber - 1]) return null

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    // Find the scheduleplan for this activity/subActivity and week
    const scheduleplan = actionPlans.find(s => {
      if (subActivityId) {
        return (
          s.subActivityId === subActivityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      } else {
        return (
          s.activityId === activityId &&
          s.month === month &&
          s.week === week &&
          s.year === currentYear
        )
      }
    })

    if (!scheduleplan) return null

    const value = type === 'plan' ? scheduleplan.planPercentage : scheduleplan.actualPercentage
    return value !== undefined ? value : null
  }

  // Function to save action plan scheduleplan values
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

    // Upsert approach - let backend handle duplicate detection
    const upsertData: any = {
      activityId: subActivityId ? null : activityId,
      subActivityId: subActivityId || null,
      month,
      year: currentYear,
      week,
    }

    // Only include the percentage being updated to preserve existing value
    if (type === 'plan') {
      upsertData.planPercentage = value || 0
    } else {
      upsertData.actualPercentage = value || 0
    }

    await upsertActionPlanMutation.mutateAsync(upsertData)
  }

  // Function to calculate cumulative values for each week
  const getCumulativeValueForWeek = (
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    if (!activities || !actionPlans || !project?.tanggalSpmk) return 0

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
      title="Action Plan SchedulePlan"
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
