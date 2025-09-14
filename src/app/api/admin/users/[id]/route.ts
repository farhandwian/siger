import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { createProtectedHandler, ApiErrors } from '@/lib/api-auth'

/**
 * Individual User Management API
 * Handles single user operations (GET, PATCH, DELETE)
 * Only accessible by ADMIN role users
 */

const UpdateUserSchema = z.object({
  name: z.string().min(1, 'Name is required').optional(),
  email: z.string().email('Valid email is required').optional(),
  username: z.string().min(3, 'Username must be at least 3 characters').optional(),
  role: z.enum(['ADMIN', 'MANAGER', 'USER', 'VIEWER']).optional(),
  phoneNumber: z.string().optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
})

interface RouteContext {
  params: { id: string }
}

/**
 * GET /api/admin/users/[id]
 * Get single user details
 */
export const GET = createProtectedHandler(
  ['ADMIN'],
  async (req: NextRequest, user, context: RouteContext) => {
    const { id } = context.params

    try {
      const userData = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          phoneNumber: true,
          isActive: true,
          lastLoginAt: true,
          createdAt: true,
          updatedAt: true,
        },
      })

      if (!userData) {
        return NextResponse.json(ApiErrors.notFound, { status: 404 })
      }

      return NextResponse.json({
        success: true,
        data: userData,
      })
    } catch (error) {
      console.error('User fetch error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * PATCH /api/admin/users/[id]
 * Update single user
 */
export const PATCH = createProtectedHandler(
  ['ADMIN'],
  async (req: NextRequest, user, context: RouteContext) => {
    const { id } = context.params

    try {
      const body = await req.json()
      const validatedData = UpdateUserSchema.parse(body)

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
      })

      if (!existingUser) {
        return NextResponse.json(ApiErrors.notFound, { status: 404 })
      }

      // Check for email/username conflicts (excluding current user)
      if (validatedData.email || validatedData.username) {
        const conflictConditions = []

        if (validatedData.email) {
          conflictConditions.push({ email: validatedData.email })
        }

        if (validatedData.username) {
          conflictConditions.push({ username: validatedData.username })
        }

        const conflictUser = await prisma.user.findFirst({
          where: {
            AND: [{ id: { not: id } }, { OR: conflictConditions }],
          },
        })

        if (conflictUser) {
          return NextResponse.json(
            {
              success: false,
              error: 'Email or username already exists',
              code: 'CONFLICT',
            },
            { status: 409 }
          )
        }
      }

      // Hash password if provided
      const updateData = { ...validatedData }
      if (updateData.password) {
        updateData.password = await bcrypt.hash(updateData.password, 12)
      }

      // Update user
      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
        select: {
          id: true,
          name: true,
          email: true,
          username: true,
          role: true,
          phoneNumber: true,
          isActive: true,
          lastLoginAt: true,
          updatedAt: true,
        },
      })

      console.log(`User updated by ${user.email}: ${updatedUser.email}`)

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully',
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return NextResponse.json(ApiErrors.validationError(error.errors), { status: 400 })
      }

      console.error('User update error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)

/**
 * DELETE /api/admin/users/[id]
 * Delete single user
 */
export const DELETE = createProtectedHandler(
  ['ADMIN'],
  async (req: NextRequest, user, context: RouteContext) => {
    const { id } = context.params

    try {
      // Prevent self-deletion
      if (user.id === id) {
        return NextResponse.json(
          {
            success: false,
            error: 'Cannot delete your own account',
            code: 'SELF_DELETE_FORBIDDEN',
          },
          { status: 400 }
        )
      }

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          role: true,
        },
      })

      if (!existingUser) {
        return NextResponse.json(ApiErrors.notFound, { status: 404 })
      }

      // Check if this is the last admin (prevent system lockout)
      if (existingUser.role === 'ADMIN') {
        const adminCount = await prisma.user.count({
          where: {
            role: 'ADMIN',
            isActive: true,
          },
        })

        if (adminCount <= 1) {
          return NextResponse.json(
            {
              success: false,
              error: 'Cannot delete the last active admin user',
              code: 'LAST_ADMIN_DELETE_FORBIDDEN',
            },
            { status: 400 }
          )
        }
      }

      // Delete user
      await prisma.user.delete({
        where: { id },
      })

      console.log(`User deleted by ${user.email}: ${existingUser.email}`)

      return NextResponse.json({
        success: true,
        message: 'User deleted successfully',
      })
    } catch (error) {
      console.error('User deletion error:', error)
      return NextResponse.json(ApiErrors.internalError, { status: 500 })
    }
  }
)
