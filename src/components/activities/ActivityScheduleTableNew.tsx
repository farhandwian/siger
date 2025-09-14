'use client'

import React from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { UnifiedScheduleTable } from '@/components/shared/UnifiedScheduleTable'
import { useActivities, useProject, activityKeys } from '@/hooks/useActivityQueries'
import { generateSequentialWeeks } from '@/utils/dateUtils'

/**
 * Activity Schedule Table Component
 *
 * This component wraps the UnifiedScheduleTable to handle Activity Schedules specifically.
 * It provides the necessary data fetching and mutation functions for activity schedules.
 * Applies the same styling patterns as the reference activity-schedule-table.tsx.ref
 */
interface ScheduleTableProps {
  projectId: string
}

export function ScheduleTableNew({ projectId }: ScheduleTableProps) {
  const { data: activities, isLoading } = useActivities(projectId)
  const { data: project } = useProject(projectId)
  const queryClient = useQueryClient()

  const currentYear = new Date().getFullYear()

  // Function to get schedule value from activity data
  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!activities) return null

    // Use tanggalSpmk or fallback to tanggalKontrak or current year start
    const startDate = project?.tanggalSpmk || project?.tanggalKontrak || `${currentYear}-01-01`
    
    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(startDate, 20)
    if (!sequentialWeeks[weekNumber - 1]) return null

    const activity = activities.find(a => a.id === activityId)
    if (!activity) return null

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    if (subActivityId) {
      const subActivity = activity.subActivities?.find(sa => sa.id === subActivityId)
      if (!subActivity) return null

      if (type === 'plan') {
        // Look for schedule plan data
        const schedulePlan = subActivity.schedulePlans?.find(
          s => s.month === month && s.week === week && s.year === currentYear
        )
        return schedulePlan?.percentage !== undefined ? schedulePlan.percentage : null
      } else {
        // Look for realization data
        const realization = subActivity.realization?.find(
          r => r.month === month && r.week === week && r.year === currentYear
        )
        return realization?.percentage !== undefined ? realization.percentage : null
      }
    } else {
      // For activity level, we might need to aggregate sub-activity data
      // For now, return null as activities don't have direct schedules
      return null
    }
  }

  // Function to save schedule values
  const saveScheduleValue = async (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual',
    value: number | null
  ): Promise<void> => {
    if (!subActivityId) {
      throw new Error('Sub-activity ID is required for schedule updates')
    }

    // Use tanggalSpmk or fallback to tanggalKontrak or current year start
    const startDate = project?.tanggalSpmk || project?.tanggalKontrak || `${currentYear}-01-01`

    // Generate sequential weeks to get the correct mapping
    const sequentialWeeks = generateSequentialWeeks(startDate, 20)
    if (!sequentialWeeks[weekNumber - 1]) {
      throw new Error(`Invalid week number: ${weekNumber}`)
    }

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    // Create the payload for schedule plans or realizations
    const payload = {
      subActivityId,
      month,
      year: currentYear,
      week,
      percentage: value || 0,
    }

    // Use the appropriate API endpoint based on type
    const endpoint = type === 'plan' ? '/api/schedule-plans' : '/api/realizations'
    
    // First try to create, if it fails with 409 (conflict), then update
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok && response.status !== 409) {
        const error = await response.json()
        throw new Error(error.error || `Failed to save ${type} data`)
      }

      // If we get 409, it means the record exists, so we need to update it
      if (response.status === 409) {
        // Find the existing record and update it
        const findResponse = await fetch(`${endpoint}?subActivityId=${subActivityId}&year=${currentYear}&month=${month}&week=${week}`)
        if (findResponse.ok) {
          const findResult = await findResponse.json()
          if (findResult.data && findResult.data.length > 0) {
            const existingRecord = findResult.data[0]
            const updateResponse = await fetch(`${endpoint}/${existingRecord.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ percentage: value || 0 }),
            })

            if (!updateResponse.ok) {
              const error = await updateResponse.json()
              throw new Error(error.error || `Failed to update ${type} data`)
            }
          }
        }
      }
    } catch (error) {
      throw error
    }

    // Invalidate activities query to refresh the data
    // This will trigger a re-fetch of the activities data
    // which includes the updated schedule plans and realizations
    queryClient.invalidateQueries({ queryKey: activityKeys.list(projectId) })
  }

  // Function to calculate cumulative values for each week
  const getCumulativeValueForWeek = (
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    if (!activities) return 0

    // Use tanggalSpmk or fallback to tanggalKontrak or current year start
    const startDate = project?.tanggalSpmk || project?.tanggalKontrak || `${currentYear}-01-01`

    // Generate sequential weeks to determine the cutoff point
    const sequentialWeeks = generateSequentialWeeks(startDate, 20)
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
    <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
      {/* Header with Project Title and Legend - matching reference styling */}
      {/* <div className="border-b border-gray-200 px-4 py-4 lg:px-6 lg:py-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 lg:text-lg">
            Jadwal Kegiatan
          </h3>
          
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: '#BFDBFE' }}
              ></div>
              <span className="text-sm text-gray-600">Rencana</span>
            </div>
            <div className="flex items-center gap-2">
              <div
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: '#FFC928' }}
              ></div>
              <span className="text-sm text-gray-600">Realisasi</span>
            </div>
          </div>
        </div>
      </div> */}

      {/* Main Table Component */}
      <UnifiedScheduleTable
        projectId={projectId}
        title="Activity Schedule"
        activities={activities}
        project={project}
        isLoading={isLoading}
        getScheduleValue={getScheduleValue}
        saveScheduleValue={saveScheduleValue}
        getCumulativeValueForWeek={getCumulativeValueForWeek}
        showAddButton={true}
        showTitle={false} // Don't show title as it's handled above
        showCumulativeSection={true}
        weekCount={20}
      />
    </div>
  )
}
