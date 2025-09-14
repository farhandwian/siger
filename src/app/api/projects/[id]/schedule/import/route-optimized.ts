import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseCSV } from '@/lib/csv-parser'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const projectId = params.id
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
    let totalSchedulePlanCount = 0
    let totalUpdatedActivities = 0
    let totalUpdatedSubActivities = 0
    let totalUpdatedSchedulePlans = 0

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
          let scheduleplanCount = 0
          let updatedActivities = 0
          let updatedSubActivities = 0
          let updatedSchedulePlans = 0

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

            // Process scheduleplans using batch operations
            if (activityData.scheduleplanData && activityData.scheduleplanData.length > 0) {
              // Get existing scheduleplans for this sub-activity
              const existingSchedulePlans = await tx.scheduleplan.findMany({
                where: { subActivityId: subActivity.id },
                select: { id: true, month: true, year: true, week: true },
              })

              const existingSchedulePlanMap = new Map(
                existingSchedulePlans.map(s => [`${s.month}-${s.year}-${s.week}`, s.id])
              )

              const scheduleplanCreates = []
              const scheduleplanUpdates = []

              for (const scheduleplanData of activityData.scheduleplanData) {
                // Skip zero values
                if (scheduleplanData.planPercentage === 0 && scheduleplanData.actualPercentage === 0) {
                  continue
                }

                const scheduleplanKey = `${scheduleplanData.month}-${scheduleplanData.year}-${scheduleplanData.week}`
                const existingId = existingSchedulePlanMap.get(scheduleplanKey)

                if (existingId) {
                  scheduleplanUpdates.push({
                    id: existingId,
                    planPercentage: scheduleplanData.planPercentage,
                    actualPercentage: scheduleplanData.actualPercentage,
                  })
                } else {
                  scheduleplanCreates.push({
                    subActivityId: subActivity.id,
                    month: scheduleplanData.month,
                    year: scheduleplanData.year,
                    week: scheduleplanData.week,
                    planPercentage: scheduleplanData.planPercentage,
                    actualPercentage: scheduleplanData.actualPercentage,
                  })
                }
              }

              // Batch update scheduleplans
              if (scheduleplanUpdates.length > 0) {
                await Promise.all(
                  scheduleplanUpdates.map(update =>
                    tx.scheduleplan.update({
                      where: { id: update.id },
                      data: {
                        planPercentage: update.planPercentage,
                        actualPercentage: update.actualPercentage,
                      },
                    })
                  )
                )
                updatedSchedulePlans += scheduleplanUpdates.length
              }

              // Batch create scheduleplans
              if (scheduleplanCreates.length > 0) {
                try {
                  await tx.scheduleplan.createMany({
                    data: scheduleplanCreates,
                    skipDuplicates: true,
                  })
                  scheduleplanCount += scheduleplanCreates.length
                } catch (error) {
                  // Handle duplicates individually if batch fails
                  for (const createData of scheduleplanCreates) {
                    try {
                      await tx.scheduleplan.create({ data: createData })
                      scheduleplanCount++
                    } catch (individualError: any) {
                      if (individualError.code === 'P2002') {
                        // Update existing instead
                        const existing = await tx.scheduleplan.findFirst({
                          where: {
                            subActivityId: createData.subActivityId,
                            month: createData.month,
                            year: createData.year,
                            week: createData.week,
                          },
                        })
                        if (existing) {
                          await tx.scheduleplan.update({
                            where: { id: existing.id },
                            data: {
                              planPercentage: createData.planPercentage,
                              actualPercentage: createData.actualPercentage,
                            },
                          })
                          updatedSchedulePlans++
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
            scheduleplanCount,
            updatedActivities,
            updatedSubActivities,
            updatedSchedulePlans,
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
      totalSchedulePlanCount += result.scheduleplanCount
      totalUpdatedActivities += result.updatedActivities
      totalUpdatedSubActivities += result.updatedSubActivities
      totalUpdatedSchedulePlans += result.updatedSchedulePlans

      console.log(`Chunk ${chunkIndex + 1} completed:`, result)
    }

    console.log(`CSV import completed successfully:`, {
      projectId,
      created: {
        activities: totalActivityCount,
        subActivities: totalSubActivityCount,
        scheduleplans: totalSchedulePlanCount,
      },
      updated: {
        activities: totalUpdatedActivities,
        subActivities: totalUpdatedSubActivities,
        scheduleplans: totalUpdatedSchedulePlans,
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        projectId,
        created: {
          activities: totalActivityCount,
          subActivities: totalSubActivityCount,
          scheduleplans: totalSchedulePlanCount,
        },
        updated: {
          activities: totalUpdatedActivities,
          subActivities: totalUpdatedSubActivities,
          scheduleplans: totalUpdatedSchedulePlans,
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
