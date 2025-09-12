import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
  const { id } = params
    const project = await prisma.project.findUnique({
      where: { id: id },
      select: { petaPekerjaan: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      data: project.petaPekerjaan,
    })
  } catch (error) {
    console.error('Error fetching project area:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { coordinates } = body

    // Validate coordinates array
    if (!Array.isArray(coordinates)) {
      return NextResponse.json({ error: 'Coordinates must be an array' }, { status: 400 })
    }

    // Validate each coordinate is an object with lat and lng
    for (const coord of coordinates) {
      if (
        typeof coord !== 'object' ||
        typeof coord.lat !== 'number' ||
        typeof coord.lng !== 'number'
      ) {
        return NextResponse.json(
          { error: 'Each coordinate must have valid lat and lng numbers' },
          { status: 400 }
        )
      }
    }

    // Update project with new polygon coordinates
    const { id } = params
    // If params is a function or a promise in Next.js, ensure it's awaited by the framework; we still extract id here
    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        petaPekerjaan: {
          type: 'polygon',
          coordinates: coordinates,
          updatedAt: new Date().toISOString(),
        },
      },
      select: { petaPekerjaan: true },
    })

    return NextResponse.json({
      success: true,
      message: 'Project area updated successfully',
      data: updatedProject.petaPekerjaan,
    })
  } catch (error) {
    console.error('Error updating project area:', error)

    // Handle Prisma not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    // Remove polygon data from project
    await prisma.project.update({
      where: { id },
      data: {
        petaPekerjaan: Prisma.JsonNull,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Project area removed successfully',
    })
  } catch (error) {
    console.error('Error removing project area:', error)

    // Handle Prisma not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
