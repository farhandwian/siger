import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  UpdateAddendumSchema,
  AddendumResponseSchema
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
 * GET /api/addendums/[id]
 * Retrieve a specific addendum by ID
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

    const { id } = params

    // Fetch the addendum
    const addendum = await prisma.addendums.findUnique({
      where: { id },
      include: {
        project: {
          select: {
            id: true,
            pekerjaan: true
          }
        }
      }
    })

    if (!addendum) {
      return NextResponse.json(
        { success: false, error: 'Addendum not found' },
        { status: 404 }
      )
    }

    const response = {
      success: true as const,
      data: addendum
    }

    // Validate response before sending
    const validatedResponse = AddendumResponseSchema.parse(response)
    return NextResponse.json(validatedResponse)

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error fetching addendum:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch addendum' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/addendums/[id]
 * Update an existing addendum
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

    const { id } = params

    // Parse and validate request body
    const body = await request.json()
    const validatedData = UpdateAddendumSchema.parse(body)

    // Check if addendum exists
    const existingAddendum = await prisma.addendums.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    })

    if (!existingAddendum) {
      return NextResponse.json(
        { success: false, error: 'Addendum not found' },
        { status: 404 }
      )
    }

    // Update the addendum
    const addendum = await prisma.addendums.update({
      where: { id },
      data: {
        ...(validatedData.title && { title: validatedData.title }),
        ...(validatedData.description !== undefined && { description: validatedData.description }),
        ...(validatedData.effectiveDate && { effectiveDate: validatedData.effectiveDate }),
        // Note: weekNumber update will be enabled after migration
        // ...(validatedData.weekNumber && { weekNumber: validatedData.weekNumber }),
      }
    })

    const response = {
      success: true as const,
      data: addendum
    }

    // Validate response before sending
    const validatedResponse = AddendumResponseSchema.parse(response)
    return NextResponse.json(validatedResponse)

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error updating addendum:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to update addendum' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/addendums/[id]
 * Delete an addendum
 */
export async function DELETE(
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

    const { id } = params

    // Check if addendum exists
    const existingAddendum = await prisma.addendums.findUnique({
      where: { id },
      select: { id: true, projectId: true }
    })

    if (!existingAddendum) {
      return NextResponse.json(
        { success: false, error: 'Addendum not found' },
        { status: 404 }
      )
    }

    // Delete the addendum
    await prisma.addendums.delete({
      where: { id }
    })

    return NextResponse.json({
      success: true,
      data: { message: 'Addendum deleted successfully' }
    })

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error deleting addendum:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete addendum' },
      { status: 500 }
    )
  }
}
