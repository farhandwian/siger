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
): Promise<CumulativeCalculation> {
  console.log(`Calculating cumulative for project ${projectId} up to ${targetMonth}-${targetWeek}`)

  // Get all schedules for the project up to the target date (including target week)
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

  console.log(`Found ${schedules.length} schedules for cumulative calculation`)

  // Calculate total cumulative values up to target week
  let cumulativePlan = 0
  let cumulativeActual = 0

  schedules.forEach(schedule => {
    console.log(
      `Schedule: ${schedule.month}-${schedule.week}, plan: ${schedule.planPercentage}, actual: ${schedule.actualPercentage}`
    )
    cumulativePlan += schedule.planPercentage || 0
    cumulativeActual += schedule.actualPercentage || 0
  })

  const result = {
    month: targetMonth,
    week: targetWeek,
    cumulativePlan,
    cumulativeActual,
    cumulativeDeviation: cumulativePlan - cumulativeActual,
  }

  console.log(`Cumulative result for ${targetMonth}-${targetWeek}:`, result)
  return result
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
    console.log(
      'Updating cumulative data for project:',
      projectId,
      'month:',
      changedMonth,
      'week:',
      changedWeek
    )

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

      console.log(`Processing week ${month}-${week}, cumulative data:`, cumulativeData)

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
          cumulativePlan: cumulativeData.cumulativePlan,
          cumulativeActual: cumulativeData.cumulativeActual,
          cumulativeDeviation: cumulativeData.cumulativeDeviation,
          updatedAt: new Date(),
        },
        create: {
          projectId,
          month,
          year: new Date().getFullYear(),
          week,
          cumulativePlan: cumulativeData.cumulativePlan,
          cumulativeActual: cumulativeData.cumulativeActual,
          cumulativeDeviation: cumulativeData.cumulativeDeviation,
        },
      })
    }

    console.log('Cumulative data update completed')
  } catch (error) {
    console.error('Error updating cumulative data:', error)
    throw error
  }
}
