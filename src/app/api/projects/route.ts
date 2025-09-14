import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { ProjectListQuerySchema } from '@/lib/schemas'
import { z } from 'zod'

// Schema for creating a new project
const CreateProjectSchema = z.object({
  penyediaJasa: z.string().min(1, 'Penyedia jasa is required'),
  pekerjaan: z.string().min(1, 'Pekerjaan is required'),
  jenisPaket: z.string().optional(),
  jenisPengadaan: z.string().optional(),
  paguAnggaran: z
    .string()
    .optional()
    .refine(val => {
      if (!val || val === '') return true
      return /^Rp[\d.,]+$/.test(val)
    }, 'Format pagu anggaran tidak valid'),
  nilaiKontrak: z
    .string()
    .min(1, 'Nilai kontrak is required')
    .refine(val => {
      return /^Rp[\d.,]+$/.test(val)
    }, 'Format nilai kontrak tidak valid'),
  nomorKontrak: z.string().min(1, 'Nomor kontrak is required'),
  tanggalKontrak: z.string().optional(),
  spmk: z.string().optional(),
  tanggalSpmk: z.string().optional(),
  akhirKontrak: z.string().optional(),
  pembayaranTerakhir: z
    .string()
    .optional()
    .refine(val => {
      if (!val || val === '') return true
      return /^Rp[\d.,]+$/.test(val)
    }, 'Format pembayaran terakhir tidak valid'),
  lokasiProyek: z.string().optional(), // Add missing field
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
    }

    // Validate query parameters using Zod
    const validatedParams = ProjectListQuerySchema.parse(queryParams)
    const { page, limit, search } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause for search
    const where: Prisma.ProjectWhereInput = search
      ? {
          OR: [
            { pekerjaan: { contains: search, mode: 'insensitive' } },
            { penyediaJasa: { contains: search, mode: 'insensitive' } },
          ],
        }
      : {}

    // Get projects with pagination
    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          lokasiProyek: true,
          pekerjaan: true,
          penyediaJasa: true,
          nilaiKontrak: true,
          fisikProgress: true,
          fisikDeviasi: true,
          fisikTarget: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
      prisma.project.count({ where }),
    ])

    // Transform data to match the expected format with validation
    const transformedProjects = projects.map(project => {
      const transformed = {
        id: project.id,
        title: project.pekerjaan || '',
        location: project.lokasiProyek || '',
        budget: project.nilaiKontrak || '',
        status: getProjectStatus(project.fisikProgress || 0, project.fisikDeviasi || 0),
        progress: project.fisikProgress || 0,
        deviation: project.fisikDeviasi || 0,
        target: project.fisikTarget || 100,
      }

      // Validate transformed data
      try {
        return {
          id: z.string().parse(transformed.id),
          title: z.string().parse(transformed.title),
          location: z.string().parse(transformed.location),
          budget: z.string().parse(transformed.budget),
          status: z.enum(['on-track', 'at-risk', 'delayed']).parse(transformed.status),
          progress: z.number().min(0).max(100).parse(transformed.progress),
          deviation: z.number().parse(transformed.deviation),
          target: z.number().min(0).max(100).parse(transformed.target),
        }
      } catch (validationError) {
        console.error('Data transformation validation error:', validationError)
        // Return safe defaults if validation fails
        return {
          id: project.id,
          title: project.pekerjaan || 'Unknown Project',
          location: 'Sumatra',
          budget: project.nilaiKontrak || 'Rp0',
          status: 'on-track' as const,
          progress: Math.max(0, Math.min(100, project.fisikProgress || 0)),
          deviation: project.fisikDeviasi || 0,
          target: Math.max(0, Math.min(100, project.fisikTarget || 100)),
        }
      }
    })

    const totalPages = Math.ceil(total / limit)

    return NextResponse.json({
      success: true,
      data: {
        projects: transformedProjects,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      },
    })
  } catch (error) {
    console.error('Error fetching projects:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid query parameters',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch projects',
      },
      { status: 500 }
    )
  }
}

// Helper function to determine project status
function getProjectStatus(progress: number, deviation: number): 'on-track' | 'at-risk' | 'delayed' {
  if (deviation > 20) {
    return 'delayed'
  } else if (deviation > 5) {
    return 'at-risk'
  } else {
    return 'on-track'
  }
}

// POST method to create a new project
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // Validate the request body
    const validatedData = CreateProjectSchema.parse(body)

    // Create new project in database
    const newProject = await prisma.project.create({
      data: {
        penyediaJasa: validatedData.penyediaJasa,
        pekerjaan: validatedData.pekerjaan,
        jenisPaket: validatedData.jenisPaket,
        jenisPengadaan: validatedData.jenisPengadaan,
        paguAnggaran: validatedData.paguAnggaran,
        nilaiKontrak: validatedData.nilaiKontrak,
        nomorKontrak: validatedData.nomorKontrak,
        tanggalKontrak: validatedData.tanggalKontrak,
        spmk: validatedData.spmk,
        tanggalSpmk: validatedData.tanggalSpmk,
        akhirKontrak: validatedData.akhirKontrak,
        pembayaranTerakhir: validatedData.pembayaranTerakhir,
        lokasiProyek: validatedData.lokasiProyek,
        // Initialize default progress values
        fisikProgress: 0,
        fisikDeviasi: 0,
        fisikTarget: 100,
        saluranProgress: 0,
        saluranDeviasi: 0,
        saluranTarget: 0,
        bangunanProgress: 0,
        bangunanDeviasi: 0,
        bangunanTarget: 0,
        keuanganProgress: 0,
        keuanganDeviasi: 0,
        keuanganTarget: 0,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: 'Project created successfully',
        data: {
          id: newProject.id,
          pekerjaan: newProject.pekerjaan,
          penyediaJasa: newProject.penyediaJasa,
          nilaiKontrak: newProject.nilaiKontrak,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating project:', error)

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid project data',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message,
          })),
        },
        { status: 400 }
      )
    }

    // Handle Prisma errors
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Database error occurred',
          code: error.code,
        },
        { status: 500 }
      )
    }

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create project',
      },
      { status: 500 }
    )
  }
}
