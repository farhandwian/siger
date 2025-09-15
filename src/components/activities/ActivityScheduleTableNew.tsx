'use client'

import React, { useMemo } from 'react'
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

  // Memoize sequential weeks to avoid recalculating on every render
  const sequentialWeeks = useMemo(() => {
    // Use tanggalSpmk or fallback to tanggalKontrak or current year start
    const startDate = project?.tanggalSpmk || project?.tanggalKontrak || `${currentYear}-01-01`
    return generateSequentialWeeks(startDate, 20)
  }, [project?.tanggalSpmk, project?.tanggalKontrak, currentYear])

  // Create lookup maps for faster data access
  const scheduleDataMaps = useMemo(() => {
    const planMap = new Map<string, number | null>()
    const actualMap = new Map<string, number | null>()
    
    if (activities) {
      activities.forEach(activity => {
        activity.subActivities?.forEach(subActivity => {
          // Create maps for schedule plans
          subActivity.schedulePlans?.forEach(plan => {
            const key = `${activity.id}-${subActivity.id}-${plan.month}-${plan.week}-${plan.year}-plan`
            planMap.set(key, plan.percentage)
          })
          
          // Create maps for realizations
          subActivity.realization?.forEach(actual => {
            const key = `${activity.id}-${subActivity.id}-${actual.month}-${actual.week}-${actual.year}-actual`
            actualMap.set(key, actual.percentage)
          })
        })
      })
    }
    
    return { planMap, actualMap }
  }, [activities])

  // Function to get schedule value from activity data using optimized lookup
  const getScheduleValue = (
    activityId: string,
    subActivityId: string | null,
    weekNumber: number,
    type: 'plan' | 'actual'
  ): number | null => {
    if (!activities) return null

    // Check if we have the sequential week data
    if (!sequentialWeeks[weekNumber - 1]) return null

    // Get the month and week from the sequential week
    const sequentialWeek = sequentialWeeks[weekNumber - 1]
    const month = sequentialWeek.month
    const week = sequentialWeek.weekInMonth

    if (subActivityId) {
      // Use the pre-built maps for O(1) lookup instead of array.find()
      const key = `${activityId}-${subActivityId}-${month}-${week}-${currentYear}-${type}`
      const value = type === 'plan'
        ? scheduleDataMaps.planMap.get(key)
        : scheduleDataMaps.actualMap.get(key)
      return value !== undefined ? value : null
    } else {
      // For activity level, we might need to aggregate sub-activity data
      // For now, return null as activities don't have direct schedules
      return null
    }
  }

  // Memoize cumulative values to avoid recalculating on every render
  const cumulativeValues = useMemo(() => {
    if (!activities) return new Map<string, number>()
    
    const cumulatives = new Map<string, number>()
    
    // Pre-calculate all cumulative values
    for (let i = 0; i < sequentialWeeks.length; i++) {
      const currentWeek = sequentialWeeks[i]
      const key = `${currentWeek.month}-${currentWeek.weekInMonth}`
      
      // Calculate cumulative sum up to and including the current week
      let cumulativePlan = 0
      let cumulativeActual = 0
      
      // Sum all sub-activities for all weeks up to current week
      for (let j = 0; j <= i; j++) {
        const week = sequentialWeeks[j]
        const weekTotalPlan = activities.reduce((total, activity) => {
          const subActivityTotal = activity.subActivities?.reduce((subTotal, subActivity) => {
            const value = getScheduleValue(
              activity.id,
              subActivity.id,
              week.weekNumber,
              'plan'
            )
            return subTotal + (value || 0)
          }, 0) || 0
          return total + subActivityTotal
        }, 0)
        
        const weekTotalActual = activities.reduce((total, activity) => {
          const subActivityTotal = activity.subActivities?.reduce((subTotal, subActivity) => {
            const value = getScheduleValue(
              activity.id,
              subActivity.id,
              week.weekNumber,
              'actual'
            )
            return subTotal + (value || 0)
          }, 0) || 0
          return total + subActivityTotal
        }, 0)
        
        cumulativePlan += weekTotalPlan
        cumulativeActual += weekTotalActual
      }
      
      cumulatives.set(`${key}-plan`, cumulativePlan)
      cumulatives.set(`${key}-actual`, cumulativeActual)
      cumulatives.set(`${key}-deviation`, cumulativeActual - cumulativePlan)
    }
    
    return cumulatives
  }, [activities, sequentialWeeks, scheduleDataMaps])

  // Function to get cumulative values using pre-calculated data
  const getCumulativeValueForWeek = (
    month: number,
    week: number,
    type: 'plan' | 'actual' | 'deviation'
  ): number => {
    if (!activities) return 0
    
    const key = `${month}-${week}-${type}`
    const value = cumulativeValues.get(key)
    return value !== undefined ? value : 0
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
