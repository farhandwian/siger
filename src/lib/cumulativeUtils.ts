import { prisma } from '@/lib/prisma'

export interface CumulativeCalculation {
  month: number
  week: number
  cumulativePlan: number
  cumulativeActual: number
  cumulativeDeviation: number
}

/**
 * Calculate cumulative values for a specific project up to a given month/week
 */
export async function calculateCumulativeData(
  projectId: string,
  targetMonth: number,
  targetWeek: number
): Promise<CumulativeCalculation[]> {
  // Get all schedules for the project up to the target date
  const schedules = await prisma.activitySchedule.findMany({
    where: {
      AND: [
        {
          OR: [
            {
              activity: {
                projectId: projectId,
              },
            },
            {
              subActivity: {
                activity: {
                  projectId: projectId,
                },
              },
            },
          ],
        },
        {
          OR: [
            { month: { lt: targetMonth } },
            {
              AND: [{ month: targetMonth }, { week: { lte: targetWeek } }],
            },
          ],
        },
      ],
    },
    include: {
      activity: true,
      subActivity: {
        include: {
          activity: true,
        },
      },
    },
  })

  // Group by month/week and sum the percentages
  const weeklyTotals = new Map<string, { rencana: number; realisasi: number }>()

  schedules.forEach(schedule => {
    const weekKey = `${schedule.month}-${schedule.week}`

    if (!weeklyTotals.has(weekKey)) {
      weeklyTotals.set(weekKey, { rencana: 0, realisasi: 0 })
    }

    const totals = weeklyTotals.get(weekKey)!
    totals.rencana += schedule.planPercentage || 0
    totals.realisasi += schedule.actualPercentage || 0
  })

  // Calculate cumulative totals
  const cumulativeResults: CumulativeCalculation[] = []
  let cumulativeRencana = 0
  let cumulativeRealisasi = 0

  // Sort weeks chronologically
  const sortedWeeks = Array.from(weeklyTotals.keys()).sort((a, b) => {
    const [monthA, weekA] = a.split('-').map(Number)
    const [monthB, weekB] = b.split('-').map(Number)

    if (monthA !== monthB) return monthA - monthB
    return weekA - weekB
  })

  sortedWeeks.forEach(weekKey => {
    const [month, week] = weekKey.split('-').map(Number)
    const totals = weeklyTotals.get(weekKey)!

    cumulativeRencana += totals.rencana
    cumulativeRealisasi += totals.realisasi

    cumulativeResults.push({
      month,
      week,
      cumulativePlan: cumulativeRencana,
      cumulativeActual: cumulativeRealisasi,
      cumulativeDeviation: cumulativeRencana - cumulativeRealisasi,
    })
  })

  return cumulativeResults
}

/**
 * Update cumulative data for all weeks up to the current week
 */
export async function updateCumulativeDataForProject(
  projectId: string,
  changedMonth: number,
  changedWeek: number
) {
  try {
    console.log('Updating cumulative data for project:', projectId, 'month:', changedMonth, 'week:', changedWeek)
    
    // Get all unique month/week combinations for this project
    const allSchedules = await prisma.activitySchedule.findMany({
      where: {
        OR: [
          {
            activity: {
              projectId: projectId,
            },
          },
          {
            subActivity: {
              activity: {
                projectId: projectId,
              },
            },
          },
        ],
      },
      select: {
        month: true,
        week: true,
      },
      distinct: ['month', 'week'],
    })

    console.log('Found unique schedules:', allSchedules.length)

    // Sort chronologically
    const sortedSchedules = allSchedules.sort((a, b) => {
      if (a.month !== b.month) return a.month - b.month
      return a.week - b.week
    })

    // Recalculate cumulative data for all weeks (not just from changed week)
    for (let i = 0; i < sortedSchedules.length; i++) {
      const { month, week } = sortedSchedules[i]

      const cumulativeData = await calculateCumulativeData(projectId, month, week)
      const currentWeekData = cumulativeData.find(
        data => data.month === month && data.week === week
      )

      console.log(`Processing week ${month}-${week}, cumulative data:`, currentWeekData)

      if (currentWeekData) {
        // Upsert cumulative data
        await prisma.cumulativeSchedule.upsert({
          where: {
            projectId_month_year_week: {
              projectId,
              month,
              year: new Date().getFullYear(),
              week,
            },
          },
          update: {
            cumulativePlan: currentWeekData.cumulativePlan,
            cumulativeActual: currentWeekData.cumulativeActual,
            cumulativeDeviation: currentWeekData.cumulativeDeviation,
            updatedAt: new Date(),
          },
          create: {
            projectId,
            month,
            year: new Date().getFullYear(),
            week,
            cumulativePlan: currentWeekData.cumulativePlan,
            cumulativeActual: currentWeekData.cumulativeActual,
            cumulativeDeviation: currentWeekData.cumulativeDeviation,
          },
        })
      }
    }
    
    console.log('Cumulative data update completed')
  } catch (error) {
    console.error('Error updating cumulative data:', error)
    throw error
  }
}
