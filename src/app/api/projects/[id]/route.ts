import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params

    // Validate project ID format
    const projectIdSchema = z.string().min(1, 'Project ID is required')

    try {
      projectIdSchema.parse(id)
    } catch (validationError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project ID',
        },
        { status: 400 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id },
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

    // Validate and sanitize project data before returning
    const sanitizedProject = {
      ...project,
      // Ensure numeric fields are properly formatted
      fisikProgress: project.fisikProgress !== null ? Number(project.fisikProgress) : null,
      fisikDeviasi: project.fisikDeviasi !== null ? Number(project.fisikDeviasi) : null,
      fisikTarget: project.fisikTarget !== null ? Number(project.fisikTarget) : null,
      saluranProgress: project.saluranProgress !== null ? Number(project.saluranProgress) : null,
      saluranDeviasi: project.saluranDeviasi !== null ? Number(project.saluranDeviasi) : null,
      saluranTarget: project.saluranTarget !== null ? Number(project.saluranTarget) : null,
      bangunanProgress: project.bangunanProgress !== null ? Number(project.bangunanProgress) : null,
      bangunanDeviasi: project.bangunanDeviasi !== null ? Number(project.bangunanDeviasi) : null,
      bangunanTarget: project.bangunanTarget !== null ? Number(project.bangunanTarget) : null,
      keuanganProgress: project.keuanganProgress !== null ? Number(project.keuanganProgress) : null,
      keuanganDeviasi: project.keuanganDeviasi !== null ? Number(project.keuanganDeviasi) : null,
      keuanganTarget: project.keuanganTarget !== null ? Number(project.keuanganTarget) : null,
      // Ensure JSON fields are properly parsed
      outputData: project.outputData || [],
      tenagaKerjaData: project.tenagaKerjaData || [],
      alatData: project.alatData || [],
      materialData: project.materialData || [],
    }

    return NextResponse.json({
      success: true,
      data: sanitizedProject,
    })
  } catch (error) {
    console.error('Error fetching project:', error)

    // Handle specific database errors
    if (error instanceof Error) {
      if (error.message.includes('Invalid ID')) {
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid project ID format',
          },
          { status: 400 }
        )
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch project',
      },
      { status: 500 }
    )
  }
}
