import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'

// Response schema
const ProgressResponseSchema = z.object({
  current: z.number(),
  total: z.number(),
  deviation: z.number(),
  addendumCount: z.number(),
  lastUpdated: z.string(),
})

type ProgressResponse = z.infer<typeof ProgressResponseSchema>

// Mock data - replace with actual database queries
const generateMockProgressData = (): ProgressResponse => {
  const baseProgress = 90000
  const total = 100000

  // Add some real-time variation (±5%)
  const variation = (Math.random() - 0.5) * 0.1 * baseProgress
  const current = Math.max(0, Math.min(total, baseProgress + variation))

  const deviation = ((current - total) / total) * 100

  return {
    current: Math.round(current),
    total,
    deviation: Math.round(deviation * 100) / 100,
    addendumCount: 1,
    lastUpdated: new Date().toISOString(),
  }
}

export async function GET(request: NextRequest) {
  try {
    // In production, replace this with actual database query
    // const progressData = await prisma.projectProgress.findFirst({
    //   where: { projectId: 'current-project-id' },
    //   orderBy: { createdAt: 'desc' }
    // })

    const mockData = generateMockProgressData()

    // Validate the response
    const validatedData = ProgressResponseSchema.parse(mockData)

    return NextResponse.json({
      success: true,
      data: validatedData,
    })
  } catch (error) {
    console.error('Error fetching progress data:', error)

    return NextResponse.json(
      { success: false, error: 'Failed to fetch progress data' },
      { status: 500 }
    )
  }
}

// For real-time updates, you might want to implement WebSocket or Server-Sent Events
// This endpoint supports CORS for real-time polling
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
