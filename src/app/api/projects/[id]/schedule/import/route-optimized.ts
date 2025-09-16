import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id: projectId } = await params
    const body = await request.json()
    const { csvData } = body

    if (!csvData) {
      return NextResponse.json({ success: false, error: 'No CSV data provided' }, { status: 400 })
    }

    // Parse CSV data
    const { activities } = parseCSV(csvData)
    console.log(`Processing ${activities.length} activities`)

    // Verify project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json({ success: false, error: 'Project not found' }, { status: 404 })
    }

    // Process import in smaller chunks to avoid transaction timeouts
    let totalActivityCount = 0
    let totalSubActivityCount = 0
    let totalScheduleCount = 0
    let totalUpdatedActivities = 0
    let totalUpdatedSubActivities = 0
    let totalUpdatedSchedules = 0

    // Process activities in chunks of 10
    const CHUNK_SIZE = 10
    const activityChunks = []

    for (let i = 0; i < activities.length; i += CHUNK_SIZE) {
      activityChunks.push(activities.slice(i, i + CHUNK_SIZE))
    }

    // Process each chunk in separate transactions
    for (let chunkIndex = 0; chunkIndex < activityChunks.length; chunkIndex++) {
      const chunk = activityChunks[chunkIndex]
      console.log(
        `Processing chunk ${chunkIndex + 1}/${activityChunks.length} with ${chunk.length} activities`
      )

      const result = await prisma.$transaction(
        async tx => {
          let activityCount = 0
          let subActivityCount = 0
          let scheduleCount = 0
          let updatedActivities = 0
          let updatedSubActivities = 0
          let updatedSchedules = 0

          const activityMap = new Map<string, string>()

          // Get existing activities for this chunk
          const chunkActivityNames = chunk.filter(a => a.type === 'activity').map(a => a.name)
          const existingActivities = await tx.activity.findMany({
            where: {
              projectId,
              name: { in: chunkActivityNames },
            },
            select: { id: true, name: true },
          })
          const existingActivityMap = new Map(existingActivities.map(a => [a.name, a.id]))

          // Create new activities in this chunk
          const newActivities = chunk.filter(
            a => a.type === 'activity' && !existingActivityMap.has(a.name)
          )

          for (const activityData of newActivities) {
            const activity = await tx.activity.create({
              data: {
                projectId,
                name: activityData.name,
                order: totalActivityCount + activityCount,
              },
            })
            existingActivityMap.set(activityData.name, activity.id)
            activityCount++
          }

          // Set up activity map for all activities (existing + new)
          for (const activityData of chunk) {
            if (activityData.type === 'activity') {
              const activityId = existingActivityMap.get(activityData.name)
              if (activityId) {
                activityMap.set(activityData.name, activityId)
              }
            }
          }

          // Count updated activities
          updatedActivities = chunkActivityNames.filter(name =>
            existingActivities.some(existing => existing.name === name)
          ).length

          // Process sub-activities for this chunk
          const subActivitiesData = chunk.filter(a => a.type === 'subActivity')

          for (const activityData of subActivitiesData) {
            const parentActivityId = activityData.parentActivity
              ? activityMap.get(activityData.parentActivity)
              : null

            if (!parentActivityId) {
              console.warn(`Parent activity not found: ${activityData.parentActivity}`)
              continue
            }

            // Check if sub-activity exists
            let subActivity = await tx.subActivity.findFirst({
              where: {
                activityId: parentActivityId,
                name: activityData.name,
              },
            })

            if (subActivity) {
              // Update existing sub-activity
              subActivity = await tx.subActivity.update({
                where: { id: subActivity.id },
                data: {
                  satuan: activityData.satuan,
                  volumeKontrak: activityData.volumeKontrak,
                  volumeMC0: activityData.volumeMC0,
                  bobotMC0: activityData.bobotMC0,
                  weight: activityData.bobotMC0 || 0,
                },
              })
              updatedSubActivities++
            } else {
              // Create new sub-activity
              subActivity = await tx.subActivity.create({
                data: {
                  activityId: parentActivityId,
                  name: activityData.name,
                  satuan: activityData.satuan,
                  volumeKontrak: activityData.volumeKontrak,
                  volumeMC0: activityData.volumeMC0,
                  bobotMC0: activityData.bobotMC0,
                  weight: activityData.bobotMC0 || 0,
                  order: subActivityCount,
                },
              })
              subActivityCount++
            }

            // Process schedules using batch operations
            if (activityData.scheduleData && activityData.scheduleData.length > 0) {
              // Get existing schedules for this sub-activity
              const existingSchedules = await tx.schedule.findMany({
                where: { subActivityId: subActivity.id },
                select: { id: true, month: true, year: true, week: true },
              })

              const existingScheduleMap = new Map(
                existingSchedules.map(s => [`${s.month}-${s.year}-${s.week}`, s.id])
              )

              const scheduleCreates = []
              const scheduleUpdates = []

              for (const scheduleData of activityData.scheduleData) {
                // Skip zero values
                if (scheduleData.planPercentage === 0 && scheduleData.actualPercentage === 0) {
                  continue
                }

                const scheduleKey = `${scheduleData.month}-${scheduleData.year}-${scheduleData.week}`
                const existingId = existingScheduleMap.get(scheduleKey)

                if (existingId) {
                  scheduleUpdates.push({
                    id: existingId,
                    planPercentage: scheduleData.planPercentage,
                    actualPercentage: scheduleData.actualPercentage,
                  })
                } else {
                  scheduleCreates.push({
                    subActivityId: subActivity.id,
                    month: scheduleData.month,
                    year: scheduleData.year,
                    week: scheduleData.week,
                    planPercentage: scheduleData.planPercentage,
                    actualPercentage: scheduleData.actualPercentage,
                  })
                }
              }

              // Batch update schedules
              if (scheduleUpdates.length > 0) {
                await Promise.all(
                  scheduleUpdates.map(update =>
                    tx.schedule.update({
                      where: { id: update.id },
                      data: {
                        planPercentage: update.planPercentage,
                        actualPercentage: update.actualPercentage,
                      },
                    })
                  )
                )
                updatedSchedules += scheduleUpdates.length
              }

              // Batch create schedules
              if (scheduleCreates.length > 0) {
                try {
                  await tx.schedule.createMany({
                    data: scheduleCreates,
                    skipDuplicates: true,
                  })
                  scheduleCount += scheduleCreates.length
                } catch (error) {
                  // Handle duplicates individually if batch fails
                  for (const createData of scheduleCreates) {
                    try {
                      await tx.schedule.create({ data: createData })
                      scheduleCount++
                    } catch (individualError: any) {
                      if (individualError.code === 'P2002') {
                        // Update existing instead
                        const existing = await tx.schedule.findFirst({
                          where: {
                            subActivityId: createData.subActivityId,
                            month: createData.month,
                            year: createData.year,
                            week: createData.week,
                          },
                        })
                        if (existing) {
                          await tx.schedule.update({
                            where: { id: existing.id },
                            data: {
                              planPercentage: createData.planPercentage,
                              actualPercentage: createData.actualPercentage,
                            },
                          })
                          updatedSchedules++
                        }
                      }
                    }
                  }
                }
              }
            }
          }

          return {
            activityCount,
            subActivityCount,
            scheduleCount,
            updatedActivities,
            updatedSubActivities,
            updatedSchedules,
          }
        },
        {
          maxWait: 30000, // 30 seconds per chunk
          timeout: 45000, // 45 seconds per chunk
        }
      )

      // Add chunk results to totals
      totalActivityCount += result.activityCount
      totalSubActivityCount += result.subActivityCount
      totalScheduleCount += result.scheduleCount
      totalUpdatedActivities += result.updatedActivities
      totalUpdatedSubActivities += result.updatedSubActivities
      totalUpdatedSchedules += result.updatedSchedules

      console.log(`Chunk ${chunkIndex + 1} completed:`, result)
    }

    console.log(`CSV import completed successfully:`, {
      projectId,
      created: {
        activities: totalActivityCount,
        subActivities: totalSubActivityCount,
        schedules: totalScheduleCount,
      },
      updated: {
        activities: totalUpdatedActivities,
        subActivities: totalUpdatedSubActivities,
        schedules: totalUpdatedSchedules,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        created: {
          activities: totalActivityCount,
          subActivities: totalSubActivityCount,
          schedules: totalScheduleCount,
        },
        updated: {
          activities: totalUpdatedActivities,
          subActivities: totalUpdatedSubActivities,
          schedules: totalUpdatedSchedules,
        },
        summary: {
          totalProcessed: activities.length,
          chunksProcessed: activityChunks.length,
        },
      },
    })
  } catch (error) {
    console.error('CSV import error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to import CSV data' },
      { status: 500 }
    )
  }
}
