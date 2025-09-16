import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { ProjectListQuerySchema } from '@/lib/schemas'
import { z } from 'zod'
import { UserRole } from '@/lib/auth'

// Force Node.js runtime for this API route to support bcryptjs and jsonwebtoken
export const runtime = 'nodejs'

/**
 * Enhanced Projects API with Role-Based Access Control
 * Supports organizational scope filtering based on user roles
 */

// Helper function to get user info from request headers (set by middleware)
function getUserFromHeaders(request: NextRequest) {
  return {
    id: request.headers.get('x-user-id'),
    email: request.headers.get('x-user-email'),
    role: request.headers.get('x-user-role') as UserRole,
    balaiId: request.headers.get('x-user-balai-id'),
    satkerId: request.headers.get('x-user-satker-id'),
    projectIds: request.headers.get('x-user-project-ids')
      ? JSON.parse(request.headers.get('x-user-project-ids')!)
      : undefined,
  }
}

// Helper function to build where clause based on user role and scope
function buildProjectWhereClause(user: ReturnType<typeof getUserFromHeaders>, search?: string) {
  const baseWhere: Prisma.ProjectWhereInput = {}

  // Apply search filter if provided
  if (search) {
    baseWhere.OR = [
      { pekerjaan: { contains: search, mode: 'insensitive' } },
      { penyediaJasa: { contains: search, mode: 'insensitive' } },
      { lokasiProyek: { contains: search, mode: 'insensitive' } },
      { nomorKontrak: { contains: search, mode: 'insensitive' } },
    ]
  }

  // Apply role-based filtering
  switch (user.role) {
    case 'ADMIN_SISTEM':
    case 'DIRJEN_SDA':
      // Can see all projects
      return baseWhere

    case 'ADMIN_BALAI':
    case 'KABALAI':
      // Can see projects in their balai
      if (user.balaiId) {
        // Note: This assumes projects are linked to satker which belongs to balai
        // Adjust the relationship based on your actual database schema
        return { ...baseWhere, id: { in: [] } } // Placeholder - implement based on actual relationships
      }
      break

    case 'SATKER':
      // Can see projects in their satker
      if (user.satkerId) {
        // Note: This assumes projects have satkerId field
        // Adjust based on your actual database schema
        return { ...baseWhere, id: { in: [] } } // Placeholder - implement based on actual relationships
      }
      break

    case 'PPK':
    case 'VENDOR':
      // Can only see assigned projects
      if (user.projectIds && user.projectIds.length > 0) {
        return { ...baseWhere, id: { in: user.projectIds } }
      } else {
        // If no projects assigned, return empty result
        return { ...baseWhere, id: 'non-existent-id' }
      }

    default:
      // Unknown role, deny access
      return { ...baseWhere, id: 'non-existent-id' }
  }

  return baseWhere
}

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
    // Get user info from middleware headers
    const user = getUserFromHeaders(request)

    if (!user.id || !user.role) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)

    // Extract and validate query parameters
    const queryParams = {
      page: parseInt(searchParams.get('page') || '1'),
      limit: parseInt(searchParams.get('limit') || '10'),
      search: searchParams.get('search') || undefined,
    }

    const validatedParams = ProjectListQuerySchema.parse(queryParams)
    const { page, limit, search } = validatedParams

    const skip = (page - 1) * limit

    // Build where clause with role-based filtering
    const where = buildProjectWhereClause(user, search)

    // Get projects with pagination and role-based filtering
    const [projects, totalCount] = await Promise.all([
      prisma.project.findMany({
        where,
        select: {
          id: true,
          pekerjaan: true,
          penyediaJasa: true,
          nilaiKontrak: true,
          fisikProgress: true,
          fisikDeviasi: true,
          fisikTarget: true,
          jenisPengadaan: true,
          lokasiProyek: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
      prisma.project.count({ where }),
    ])

    const totalPages = Math.ceil(totalCount / limit)

    // Transform projects to match expected format
    const transformedProjects = projects.map(project => {
      return {
        id: project.id,
        title: project.pekerjaan || '',
        location: project.lokasiProyek || '',
        budget: project.nilaiKontrak || '',
        type: project.jenisPengadaan || 'Umum', // Use jenisPengadaan as type, default to 'Umum'
        status: getProjectStatus(project.fisikProgress || 0, project.fisikDeviasi || 0),
        progress: project.fisikProgress || 0,
        deviation: project.fisikDeviasi || 0,
        target: project.fisikTarget || 100,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        projects: transformedProjects,
        pagination: {
          page,
          limit,
          total: totalCount,
          totalPages,
        },
        userContext: {
          role: user.role,
          balaiId: user.balaiId,
          satkerId: user.satkerId,
          assignedProjectsCount: user.projectIds?.length || 0,
        },
      },
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid query parameters', details: error.errors },
        { status: 400 }
      )
    }

    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Projects API error:', error)
    }
    return NextResponse.json({ success: false, error: 'Failed to fetch projects' }, { status: 500 })
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
    // Log error for debugging in development
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.error('Error creating project:', error)
    }

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
