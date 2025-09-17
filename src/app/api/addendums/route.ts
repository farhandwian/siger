import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { 
  CreateAddendumSchema, 
  AddendumListResponseSchema,
  AddendumQuerySchema,
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
 * GET /api/addendums
 * Retrieve list of addendums with optional filtering
 * Supports pagination and filtering by projectId, addendumNumber, changeType, isActive
 */
export async function GET(request: NextRequest) {
  try {
    // Authentication check using middleware headers
    const user = getUserFromHeaders(request)
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url)
    const queryParams = {
      projectId: searchParams.get('projectId') || undefined,
      addendumNumber: searchParams.get('addendumNumber') ? parseInt(searchParams.get('addendumNumber')!) : undefined,
      page: searchParams.get('page') ? parseInt(searchParams.get('page')!) : 1,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 10,
    }

    const validatedQuery = AddendumQuerySchema.parse(queryParams)

    // Build where clause for filtering
    const where: Record<string, unknown> = {}
    if (validatedQuery.projectId) where.projectId = validatedQuery.projectId
    if (validatedQuery.addendumNumber) where.addendumNumber = validatedQuery.addendumNumber

    // Calculate pagination
    const skip = (validatedQuery.page - 1) * validatedQuery.limit
    const take = validatedQuery.limit

    // Fetch addendums with pagination
    const [addendums, total] = await Promise.all([
      prisma.addendums.findMany({
        where,
        skip,
        take,
        orderBy: [
          { projectId: 'asc' },
          { addendumNumber: 'desc' }
        ],
        include: {
          project: {
            select: {
              id: true,
              pekerjaan: true
            }
          }
        }
      }),
      prisma.addendums.count({ where })
    ])

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / validatedQuery.limit)

    const response = {
      success: true as const,
      data: addendums,
      pagination: {
        total,
        page: validatedQuery.page,
        limit: validatedQuery.limit,
        totalPages
      }
    }

    // Validate response before sending
    const validatedResponse = AddendumListResponseSchema.parse(response)
    return NextResponse.json(validatedResponse)

  } catch (error) {
    // Error logging for development 
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error fetching addendums:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to fetch addendums' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/addendums
 * Create a new addendum for a project
 * Automatically determines the next addendum number for the project
 */
export async function POST(request: NextRequest) {
  try {
    // Authentication check using middleware headers
    const user = getUserFromHeaders(request)
    if (!user.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    const validatedData = CreateAddendumSchema.parse(body)

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: validatedData.projectId },
      select: { 
        id: true, 
        pekerjaan: true 
      }
    })

    if (!project) {
      return NextResponse.json(
        { success: false, error: 'Project not found' },
        { status: 404 }
      )
    }

    // Get the next addendum number for this project
    const lastAddendum = await prisma.addendums.findFirst({
      where: { projectId: validatedData.projectId },
      orderBy: { addendumNumber: 'desc' },
      select: { addendumNumber: true }
    })

    // Ensure addendumNumber is treated as number
    const lastNumber = typeof lastAddendum?.addendumNumber === 'number' 
      ? lastAddendum.addendumNumber 
      : parseInt(String(lastAddendum?.addendumNumber || 0))
    
    const nextAddendumNumber = (lastNumber || 0) + 1

    // Create the addendum with updated schema
    const addendum = await prisma.addendums.create({
      data: {
        projectId: validatedData.projectId,
        addendumNumber: nextAddendumNumber, // Now properly as integer
        title: validatedData.title,
        description: validatedData.description || null,
        effectiveDate: validatedData.effectiveDate,
        weekNumber: validatedData.weekNumber,
        modifiedBy: user.id,
      }
    })

    // Update project status to DRAFT_ADDENDUM after creating addendum
    await prisma.project.update({
      where: { id: validatedData.projectId },
      data: { status: 'DRAFT_ADDENDUM' }
    })

    const response = {
      success: true as const,
      data: addendum
    }

    // Validate response before sending
    const validatedResponse = AddendumResponseSchema.parse(response)
    return NextResponse.json(validatedResponse, { status: 201 })

  } catch (error) {
    // Error logging for development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error creating addendum:', error)
    }
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create addendum' },
      { status: 500 }
    )
  }
}
