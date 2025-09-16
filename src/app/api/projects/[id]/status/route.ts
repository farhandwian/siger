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

    // Await params before accessing properties (Next.js 15 requirement)
    const { id: projectId } = await params

    // Fetch project with current status (will be enabled after migration)
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { 
        id: true,
        status: true, // Will be enabled after migration
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
      },
      orderBy: { addendumNumber: 'desc' }
    })

    // For now, default status is DRAFT until migration
    const projectStatus = project?.status ?? 'DRAFT' // project.status after migration
    
    // Determine if plans can be edited and from which week
    let canEditPlan = false
    let editableFromWeek: number | null = null

    // This logic will be fully implemented after migration
    if (projectStatus === 'DRAFT') {
      canEditPlan = true
    } else if (projectStatus === 'KONTRAK') {
      canEditPlan = false
    } else if (projectStatus === 'DRAFT_ADDENDUM' && currentAddendum) {
      canEditPlan = true
      editableFromWeek = currentAddendum.weekNumber
    }
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

    // Await params before accessing properties (Next.js 15 requirement)
    const { id: projectId } = await params

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

    // Parse requested status from validated body
    const { status } = validatedData

    // Fetch the latest addendum for this project (if any)
    let currentAddendum = await prisma.addendums.findFirst({
      where: { projectId },
      orderBy: { addendumNumber: 'desc' }
    })

    // Perform update inside a transaction to keep project and addendum changes consistent
    // If moving to DRAFT_ADDENDUM we create a new addendum and mark previous active addendums as inactive
    const updatedProject = await prisma.$transaction(async (tx) => {
      if (status === 'DRAFT_ADDENDUM') {
      // Compute next addendum number
      const nextAddendumNumber = (currentAddendum?.addendumNumber ?? 0) + 1

      // Create the new addendum. If your schema requires additional fields adjust accordingly.
      const created = await tx.addendums.create({
        data: {
        projectId,
        addendumNumber: nextAddendumNumber,
        title: `Addendum ${nextAddendumNumber}`,
        effectiveDate: new Date(),
        weekNumber: 1, // Default to week 1, can be adjusted later
        modifiedBy: user.id ?? '',
        }
      })

      // Update reference for response
      currentAddendum = created

      // Update project status
      return tx.project.update({
        where: { id: projectId },
        data: { status },
        select: { id: true, status: true }
      })
      }

      // For other status transitions, just update the project status
      return tx.project.update({
      where: { id: projectId },
      data: { status },
      select: { id: true, status: true }
      })
    })

    // Determine plan editability based on new status
    const canEditPlan = updatedProject.status === 'DRAFT' || updatedProject.status === 'DRAFT_ADDENDUM'
    const editableFromWeek = updatedProject.status === 'DRAFT_ADDENDUM'
      ? (currentAddendum?.weekNumber ?? null)
      : null

    // Build response object following the established API format
    const response = {
      success: true as const,
      data: {
      id: updatedProject.id,
      status: updatedProject.status,
      currentAddendum: currentAddendum || null,
      canEditPlan,
      editableFromWeek,
      message: 'Project status updated successfully'
      }
    }

    // Validate response shape with Zod before returning
    ProjectStatusResponseSchema.parse(response)

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
