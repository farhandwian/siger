import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { prisma } from '@/lib/prisma'
import { UserRole } from '@/lib/auth'

// Force Node.js runtime for this API route to support bcryptjs and jsonwebtoken
export const runtime = 'nodejs'

/**
 * Mobile Login API
 * Provides JWT token authentication for mobile applications
 * Validates credentials and returns JWT token for API access
 */

const MobileLoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  deviceInfo: z.object({
    deviceId: z.string().optional(),
    platform: z.enum(['ios', 'android']).optional(),
    version: z.string().optional(),
  }).optional(),
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const validatedData = MobileLoginSchema.parse(body)
    const { email, password, deviceInfo } = validatedData

    // Find and validate user with organizational context
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        password: true,
        role: true,
        isActive: true,
        balaiId: true,
        departmentId: true,
        // Include project assignments for PPK and VENDOR users
        projectAssignments: {
          where: { isActive: true },
          select: {
            projectId: true,
            role: true,
            project: {
              select: {
                id: true,
                pekerjaan: true,
                lokasiProyek: true
              }
            }
          }
        },
        // Include balai info if user belongs to one
        balai: {
          select: {
            id: true,
            name: true,
            code: true
          }
        },
        // Include department info if user belongs to one
        department: {
          select: {
            id: true,
            name: true,
            code: true,
            balai: {
              select: {
                id: true,
                name: true,
                code: true
              }
            }
          }
        }
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid credentials' },
        { status: 401 }
      )
    }

    // Generate JWT token for mobile with organizational context
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET environment variable is not set')
    }

    // Extract project IDs for PPK and VENDOR users
    const projectIds = user.projectAssignments?.map(assignment => assignment.projectId) || []

    // Set token expiration based on role (shorter for vendors)
    const expiresIn = user.role === 'VENDOR' ? '24h' : '30d'

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        balaiId: user.balaiId,
        departmentId: user.departmentId,
        projectIds: projectIds.length > 0 ? projectIds : undefined,
      },
      process.env.NEXTAUTH_SECRET,
      { expiresIn }
    )

    // Update last login and mobile sync timestamps
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        lastLoginAt: new Date(),
        lastMobileSync: new Date(),
        deviceInfo: deviceInfo || undefined
      },
    })

    // Log device info if provided (for audit purposes)
    if (deviceInfo) {
      console.log('Mobile login:', {
        userId: user.id,
        email: user.email,
        role: user.role,
        deviceInfo,
        timestamp: new Date().toISOString(),
      })
    }

    // Prepare response with organizational context
    const responseData = {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        balaiId: user.balaiId,
        departmentId: user.departmentId,
        projectIds: projectIds.length > 0 ? projectIds : undefined,
      },
      expiresIn: user.role === 'VENDOR' ? 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000, // 24h for vendor, 30d for others
      organizational: {
        balai: user.balai,
        department: user.department,
        projects: user.projectAssignments?.map(assignment => ({
          id: assignment.project.id,
          name: assignment.project.pekerjaan,
          location: assignment.project.lokasiProyek,
          assignmentRole: assignment.role
        })) || []
      }
    }

    return NextResponse.json({
      success: true,
      data: responseData,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: 'Invalid input data', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Mobile login error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

/**
 * Token Verification Endpoint
 * Allows mobile apps to verify if their JWT token is still valid
 */
export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization')
    
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid authorization header' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7)
    
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET environment variable is not set')
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET) as {
      userId: string
      email: string
      role: UserRole
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
      },
    })

    if (!user || !user.isActive) {
      return NextResponse.json(
        { success: false, error: 'User not found or inactive' },
        { status: 401 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
    })
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      )
    }

    console.error('Token verification error:', error)
    return NextResponse.json(
      { success: false, error: 'Token verification failed' },
      { status: 500 }
    )
  }
}
