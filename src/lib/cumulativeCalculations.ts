import type { Activity } from '@/lib/schemas'

export interface WeekData {
  month: number
  week: number
  plan: number
  actual: number
  deviation: number
}

export interface CumulativeWeekData extends WeekData {
  cumulativePlan: number
  cumulativeActual: number
  cumulativeDeviation: number
}

/**
 * Calculate cumulative values for all weeks based on activity schedules
 * This replaces the database-stored cumulative data with client-side calculations
 */
export function calculateCumulativeData(
  activities: Activity[] | undefined,
  months: Array<{ month: number; weeks: Array<{ week: number }> }>,
  year: number
): CumulativeWeekData[] {
  if (!activities || activities.length === 0) {
    return []
  }

  // First, collect all weekly data from activities
  const weeklyData: WeekData[] = []

  // Generate all weeks from months
  for (const monthData of months) {
    for (const weekData of monthData.weeks) {
      const weekPlanTotal = calculateWeekTotal(
        activities,
        monthData.month,
        weekData.week,
        year,
        'plan'
      )
      const weekActualTotal = calculateWeekTotal(
        activities,
        monthData.month,
        weekData.week,
        year,
        'actual'
      )

      weeklyData.push({
        month: monthData.month,
        week: weekData.week,
        plan: weekPlanTotal,
        actual: weekActualTotal,
        deviation: weekPlanTotal - weekActualTotal,
      })
    }
  }

  // Calculate cumulative values
  const cumulativeData: CumulativeWeekData[] = []
  let cumulativePlan = 0
  let cumulativeActual = 0

  for (const weekData of weeklyData) {
    cumulativePlan += weekData.plan
    cumulativeActual += weekData.actual
    const cumulativeDeviation = cumulativePlan - cumulativeActual

    cumulativeData.push({
      ...weekData,
      cumulativePlan,
      cumulativeActual,
      cumulativeDeviation,
    })
  }

  return cumulativeData
}

/**
 * Calculate total percentage for a specific week across all sub-activities
 */
function calculateWeekTotal(
  activities: Activity[],
  month: number,
  week: number,
  year: number,
  type: 'plan' | 'actual'
): number {
  let total = 0

  for (const activity of activities) {
    if (activity.subActivities && activity.subActivities.length > 0) {
      for (const subActivity of activity.subActivities) {
        const schedule = subActivity.schedules?.find(
          s => s.month === month && s.week === week && s.year === year
        )

        if (schedule) {
          const value = type === 'plan' ? schedule.planPercentage : schedule.actualPercentage
          if (value !== null && value !== undefined) {
            total += value
          }
        }
      }
    }
  }

  return total
}

/**
 * Get cumulative value for a specific week
 */
export function getCumulativeValue(
  cumulativeData: CumulativeWeekData[],
  month: number,
  week: number,
  type: 'plan' | 'actual' | 'deviation'
): number {
  const data = cumulativeData.find(d => d.month === month && d.week === week)

  if (!data) return 0

  switch (type) {
    case 'plan':
      return data.cumulativePlan
    case 'actual':
      return data.cumulativeActual
    case 'deviation':
      return data.cumulativeDeviation
    default:
      return 0
  }
}
