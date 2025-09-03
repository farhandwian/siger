import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { UpdateProjectFieldSchema } from '@/lib/schemas'
import { z } from 'zod'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate request body using Zod
    const validatedData = UpdateProjectFieldSchema.parse(body)
    const { projectId, fieldName, value } = validatedData

    // Get current project data to store as old value for audit
    const currentProject = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!currentProject) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      )
    }

    const oldValue = currentProject[fieldName as keyof typeof currentProject] as string | null

    // Update project in database
    const updatedProject = await prisma.project.update({
      where: { id: projectId },
      data: { [fieldName]: value },
    })

    // Create audit log
    await prisma.projectAuditLog.create({
      data: {
        projectId,
        fieldName,
        oldValue: oldValue || '',
        newValue: value,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      data: {
        projectId,
        fieldName,
        oldValue,
        newValue: value,
        updatedAt: updatedProject.updatedAt,
      },
    })
  } catch (error) {
    console.error('Error updating project:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle other errors
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const projectId = searchParams.get('projectId')

    if (!projectId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project ID is required',
        },
        { status: 400 }
      )
    }

    // Validate project ID format (should be a valid CUID)
    const projectIdSchema = z.string().cuid('Invalid project ID format')

    try {
      projectIdSchema.parse(projectId)
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID format',
        },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id: projectId },
    })

    if (!project) {
      return NextResponse.json(
        {
          success: false,
          error: 'Project not found',
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    console.error('Error fetching project:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
