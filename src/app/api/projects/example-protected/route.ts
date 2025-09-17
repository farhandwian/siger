import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { createProtectedHandler, getUserFromRequest, ApiErrors } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'

/**
 * Protected Projects API Example
 * Demonstrates how to use authentication and authorization in API routes
 * Includes role-based access control and data filtering
 */

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('active'),
})

const CreateProjectSchema = z.object({
  pekerjaan: z.string().min(1, 'Project name is required'),
  penyediaJasa: z.string().optional(),
  jenisPaket: z.string().optional(),
  lokasiProyek: z.string().optional(),
  paguAnggaran: z.string().optional(),
  nilaiKontrak: z.string().optional(),
  nomorKontrak: z.string().optional(),
  tanggalKontrak: z.string().optional(),
  akhirKontrak: z.string().optional(),
})

/**
 * GET /api/projects
 * Retrieve projects with role-based filtering
 */
export const GET = createProtectedHandler(
  ['ADMIN_SISTEM', 'ADMIN_BALAI', 'KABALAI', 'SATKER', 'PPK', 'VENDOR'], // All authenticated users can view projects
  async (req: NextRequest, user) => {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause based on search and status
    const where: any = {}

    if (query.search) {
      where.OR = [
        { pekerjaan: { contains: query.search, mode: 'insensitive' } },
        { penyediaJasa: { contains: query.search, mode: 'insensitive' } },
        { lokasiProyek: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    // Role-based data filtering
    switch (user.role) {
      case UserRole.VENDOR:
        // Vendors can only see projects with progress > 0
        where.fisikProgress = { gt: 0 }
        break
      case UserRole.PPK:
        // PPK see all assigned projects
        break
      case UserRole.SATKER:
      case UserRole.ADMIN_BALAI:
      case UserRole.ADMIN_SISTEM:
        // SATKER, Balai admins and system admins see everything
        break
      case UserRole.KABALAI:
      case UserRole.DIRJEN_SDA:
        // Read-only roles see all projects
        break
    }

    try {
      const [projects, total] = await Promise.all([
        prisma.project.findMany({
          where,
          select: {
            id: true,
            pekerjaan: true,
            penyediaJasa: true,
            jenisPaket: true,
            lokasiProyek: true,
            paguAnggaran: true,
            nilaiKontrak: true,
            fisikProgress: true,
            fisikDeviasi: true,
            fisikTarget: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.project.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: projects,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
        meta: {
          userRole: user.role,
          canEdit: user.role === UserRole.ADMIN_SISTEM || user.role === UserRole.ADMIN_BALAI || user.role === UserRole.SATKER,
          canDelete: user.role === UserRole.ADMIN_SISTEM,
        },
      })
    } catch (error) {
      console.error('Projects fetch error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * POST /api/projects
 * Create new project (SATKER and Admins only)
 */
export const POST = createProtectedHandler(
  ['ADMIN_SISTEM', 'ADMIN_BALAI', 'SATKER'], // Only SATKER and admins can create projects
  async (req: NextRequest, user) => {
    try {
      const body = await req.json()
      const validatedData = CreateProjectSchema.parse(body)

      const project = await prisma.project.create({
        data: {
          ...validatedData,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        select: {
          id: true,
          pekerjaan: true,
          penyediaJasa: true,
          jenisPaket: true,
          lokasiProyek: true,
          paguAnggaran: true,
          nilaiKontrak: true,
          createdAt: true,
        },
      })

      console.log(`Project created by ${user.email}:`, project.id)

      return NextResponse.json(
        {
          success: true,
          data: project,
          message: 'Project created successfully',
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(ApiErrors.validationError(error.errors), { status: 400 })
      }

      console.error('Project creation error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * Alternative approach without the helper function
 * Shows manual authentication checking
 */
export async function PATCH(req: NextRequest) {
  // Manual authentication check
  const user = getUserFromRequest(req)

  if (!user) {
    return NextResponse.json(ApiErrors.unauthorized, { status: 401 })
  }

  if (!['ADMIN', 'MANAGER'].includes(user.role)) {
    return NextResponse.json(ApiErrors.forbidden, { status: 403 })
  }

  try {
    const body = await req.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'Project ID is required' }, { status: 400 })
    }

    const project = await prisma.project.update({
      where: { id },
      data: {
        ...updateData,
        updatedAt: new Date(),
      },
    })

    console.log(`Project updated by ${user.email}:`, project.id)

    return NextResponse.json({
      success: true,
      data: project,
      message: 'Project updated successfully',
    })
  } catch (error) {
    console.error('Project update error:', error)
    return NextResponse.json(ApiErrors.internalError, { status: 500 })
  }
}
