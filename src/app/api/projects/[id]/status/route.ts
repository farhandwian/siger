import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  UpdateProjectStatusSchema,
  ProjectStatusResponseSchema
} from '@/lib/schemas/addendum'

// Force Node.js runtime for this API route
export const runtime = 'nodejs'

// Helper function to get user info from request headers (set by middleware)
function getUserFromHeaders(request: NextRequest) {
  return {
    id: request.headers.get('x-user-id'),
    role: request.headers.get('x-user-role'),
    balaiId: request.headers.get('x-user-balai-id'),
    satkerId: request.headers.get('x-user-satker-id'),
  }
}

/**
 * GET /api/projects/[id]/status
 * Get project status and addendum information for schedule editing permissions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check using middleware headers
    const user = getUserFromHeaders(request)
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId } = params

    // Fetch project with current status (will be enabled after migration)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true,
        // status: true, // Will be enabled after migration
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the most recent active addendum for this project
    const currentAddendum = await prisma.addendums.findFirst({
      where: { 
        projectId,
        // isActive: true // Will be enabled after migration
      },
      orderBy: { addendumNumber: 'desc' }
    })

    // For now, default status is DRAFT until migration
    const projectStatus = 'DRAFT' // project.status after migration
    
    // Determine if plans can be edited and from which week
    let canEditPlan = true
    let editableFromWeek: number | null = null

    // This logic will be fully implemented after migration
    // if (projectStatus === 'DRAFT') {
    //   canEditPlan = true
    // } else if (projectStatus === 'KONTRAK') {
    //   canEditPlan = false
    // } else if (projectStatus === 'DRAFT_ADDENDUM' && currentAddendum) {
    //   canEditPlan = true
    //   editableFromWeek = currentAddendum.weekNumber
    // }

    const response = {
      success: true as const,
      data: {
        id: projectId,
        status: projectStatus,
        currentAddendum: currentAddendum || null,
        canEditPlan,
        editableFromWeek,
      }
    }

    // Validate response before sending
    const validatedResponse = ProjectStatusResponseSchema.parse(response)
    return NextResponse.json(validatedResponse)

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error fetching project status:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch project status' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/projects/[id]/status
 * Update project status (DRAFT -> KONTRAK -> DRAFT_ADDENDUM cycle)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Authentication check using middleware headers
    const user = getUserFromHeaders(request)
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { id: projectId } = params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateProjectStatusSchema.parse(body)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Update project status (will be enabled after migration)
    // const updatedProject = await prisma.project.update({
    //   where: { id: projectId },
    //   data: { status: validatedData.status }
    // })

    // For now, return success without actual update
    const response = {
      success: true as const,
      data: {
        id: projectId,
        status: validatedData.status,
        message: 'Status update will be enabled after database migration'
      }
    }

    return NextResponse.json(response)

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error updating project status:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update project status' },
      { status: 500 }
    )
  }
}
