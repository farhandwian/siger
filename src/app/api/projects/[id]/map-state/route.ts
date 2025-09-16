import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'

// GET /api/projects/[id]/map-state
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = await params
    const project = await prisma.project.findUnique({
      where: { id: id },
      select: { petaPekerjaan: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Extract map state from petaPekerjaan or return defaults
    const mapState = {
      center: { lat: -5.397, lng: 105.297 },
      zoom: 12,
    }

    if (project.petaPekerjaan && typeof project.petaPekerjaan === 'object') {
      const petaData = project.petaPekerjaan as any
      if (petaData.center) {
        mapState.center = petaData.center
      }
      if (typeof petaData.zoom === 'number') {
        mapState.zoom = petaData.zoom
      }
    }

    return NextResponse.json({
      success: true,
      data: mapState,
    })
  } catch (error) {
    console.error('Error fetching map state:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT /api/projects/[id]/map-state
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json()
    const { center, zoom } = body

    // Validate input
    if (!center || typeof zoom !== 'number') {
      return NextResponse.json({ error: 'Invalid input data' }, { status: 400 })
    }

    const { id } = await params
    
    // Get existing petaPekerjaan data
    const project = await prisma.project.findUnique({
      where: { id },
      select: { petaPekerjaan: true },
    })

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    // Merge map state with existing petaPekerjaan data
    const updatedPetaPekerjaan = {
      ...(project.petaPekerjaan as object || {}),
      center: {
        lat: center.lat,
        lng: center.lng,
      },
      zoom: zoom,
      updatedAt: new Date().toISOString(),
    }

    // Update project with new map state
    await prisma.project.update({
      where: { id },
      data: {
        petaPekerjaan: updatedPetaPekerjaan,
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Map state updated successfully',
      data: {
        center: updatedPetaPekerjaan.center,
        zoom: updatedPetaPekerjaan.zoom,
      },
    })
  } catch (error) {
    console.error('Error updating map state:', error)

    // Handle Prisma not found error
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 })
    }

    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}