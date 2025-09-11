import { NextRequest } from 'next/server'
import { UserRole } from '@/lib/auth'

/**
 * Utility functions for API route protection
 * Provides common patterns for authentication and authorization in API routes
 */

export interface AuthenticatedUser {
  id: string
  email: string
  role: UserRole
}

/**
 * Extract user information from request headers (set by middleware)
 */
export function getUserFromRequest(req: NextRequest): AuthenticatedUser | null {
  const userId = req.headers.get('x-user-id')
  const userEmail = req.headers.get('x-user-email')
  const userRole = req.headers.get('x-user-role')

  if (!userId || !userEmail || !userRole) {
    return null
  }

  return {
    id: userId,
    email: userEmail,
    role: userRole as UserRole,
  }
}

/**
 * Check if user has required role
 */
export function hasRole(user: AuthenticatedUser, allowedRoles: UserRole[]): boolean {
  return allowedRoles.includes(user.role)
}

/**
 * Check if user can access resource (basic ownership or admin)
 */
export function canAccessResource(user: AuthenticatedUser, resourceOwnerId?: string): boolean {
  // Admins can access everything
  if (user.role === 'ADMIN') return true

  // If no owner specified, allow access
  if (!resourceOwnerId) return true

  // Check if user owns the resource
  return user.id === resourceOwnerId
}

/**
 * Create standardized API error responses
 */
export const ApiErrors = {
  unauthorized: {
    success: false,
    error: 'Authentication required',
    code: 'UNAUTHORIZED',
  },
  forbidden: {
    success: false,
    error: 'Insufficient permissions',
    code: 'FORBIDDEN',
  },
  notFound: {
    success: false,
    error: 'Resource not found',
    code: 'NOT_FOUND',
  },
  validationError: (details: any) => ({
    success: false,
    error: 'Validation failed',
    code: 'VALIDATION_ERROR',
    details,
  }),
  internalError: {
    success: false,
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
  },
}

/**
 * Higher-order function to create protected API routes
 */
export function createProtectedHandler<T extends any[]>(
  allowedRoles: UserRole[],
  handler: (req: NextRequest, user: AuthenticatedUser, ...args: T) => Promise<Response>
) {
  return async (req: NextRequest, ...args: T): Promise<Response> => {
    const user = getUserFromRequest(req)

    if (!user) {
      return Response.json(ApiErrors.unauthorized, { status: 401 })
    }

    if (!hasRole(user, allowedRoles)) {
      return Response.json(ApiErrors.forbidden, { status: 403 })
    }

    try {
      return await handler(req, user, ...args)
    } catch (error) {
      console.error('API Error:', error)
      return Response.json(ApiErrors.internalError, { status: 500 })
    }
  }
}
