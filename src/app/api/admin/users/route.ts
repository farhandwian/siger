import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createProtectedHandler, getUserFromRequest, ApiErrors } from '@/lib/api-auth'
import { UserRole } from '@prisma/client'

// Force Node.js runtime for this API route to support bcryptjs
export const runtime = 'nodejs'

/**
 * Admin Users API
 * Provides CRUD operations for user management
 * Only accessible by ADMIN_SISTEM role users
 */

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.enum(['true', 'false', 'all']).default('all'),
})

const CreateUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  username: z.string().min(3, 'Username must be at least 3 characters'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.nativeEnum(UserRole).default(UserRole.PPK),
  isActive: z.boolean().default(true),
})

const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  role: z.nativeEnum(UserRole).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

/**
 * GET /api/admin/users
 * Retrieve users with filtering and pagination
 */
export const GET = createProtectedHandler(
  ['ADMIN_SISTEM'], // Only system admins can view users
  async (req: NextRequest) => {
    const { searchParams } = new URL(req.url)
    const query = QuerySchema.parse(Object.fromEntries(searchParams))

    // Build where clause
    let where: any = {}

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { username: { contains: query.search, mode: 'insensitive' } },
      ]
    }

    if (query.role) {
      where.role = query.role
    }

    if (query.isActive !== 'all') {
      where.isActive = query.isActive === 'true'
    }

    try {
      const [users, total] = await Promise.all([
        prisma.user.findMany({
          where,
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            role: true,
            isActive: true,
            lastLoginAt: true,
            createdAt: true,
            updatedAt: true,
          },
          skip: (query.page - 1) * query.limit,
          take: query.limit,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.user.count({ where }),
      ])

      return NextResponse.json({
        success: true,
        data: users,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      })
    } catch (error) {
      console.error('Users fetch error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * POST /api/admin/users
 * Create a new user
 */
export const POST = createProtectedHandler(
  ['ADMIN_SISTEM'], // Only system admins can create users
  async (req: NextRequest, user) => {
    try {
      const body = await req.json()
      const validatedData = CreateUserSchema.parse(body)

      // Check if user already exists
      const existingUser = await prisma.user.findFirst({
        where: {
          OR: [{ email: validatedData.email }, { username: validatedData.username }],
        },
      })

      if (existingUser) {
        return NextResponse.json(
          {
            success: false,
            error: 'User with this email or username already exists',
            code: 'USER_EXISTS',
          },
          { status: 400 }
        )
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(validatedData.password, 12)

      // Create user
      const newUser = await prisma.user.create({
        data: {
          ...validatedData,
          password: hashedPassword,
        },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
          createdAt: true,
        },
      })

      console.log(`User created by ${user.email}:`, newUser.email)

      return NextResponse.json(
        {
          success: true,
          data: newUser,
          message: 'User created successfully',
        },
        { status: 201 }
      )
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(ApiErrors.validationError(error.errors), { status: 400 })
      }

      console.error('User creation error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * PATCH /api/admin/users
 * Batch update users (for bulk operations)
 */
export async function PATCH(req: NextRequest) {
  const user = getUserFromRequest(req)

  if (!user || user.role !== UserRole.ADMIN_SISTEM) {
    return NextResponse.json(ApiErrors.forbidden, { status: 403 })
  }

  try {
    const body = await req.json()
    const { userIds, updates } = body

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'User IDs are required',
        },
        { status: 400 }
      )
    }

    const validatedUpdates = UpdateUserSchema.partial().parse(updates)

    // If password is being updated, hash it
    if (validatedUpdates.password) {
      validatedUpdates.password = await bcrypt.hash(validatedUpdates.password, 12)
    }

    // Update users
    const updatedUsers = await prisma.user.updateMany({
      where: {
        id: { in: userIds },
      },
      data: validatedUpdates,
    })

    console.log(`Bulk user update by ${user.email}: ${updatedUsers.count} users updated`)

    return NextResponse.json({
      success: true,
      data: { updatedCount: updatedUsers.count },
      message: `${updatedUsers.count} users updated successfully`,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(ApiErrors.validationError(error.errors), { status: 400 })
    }

    console.error('Bulk user update error:', error)
    return NextResponse.json(ApiErrors.internalError, { status: 500 })
  }
}
