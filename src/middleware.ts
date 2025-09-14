import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/lib/auth'

/**
 * Authentication Middleware
 * Handles both web session authentication (NextAuth.js) and mobile JWT token authentication
 * Protects API routes and web pages based on user roles and permissions
 */

// Protected API routes that require authentication
const protectedApiRoutes = [
  '/api/projects',
  '/api/activities',
  '/api/monitoring',
  '/api/materials',
  '/api/proposals',
  '/api/daily-activities',
]

// Protected web pages that require authentication
const protectedWebPages = [
  '/monitoring-evaluasi',
  '/daftar-usulan',
  '/tambah-usulan',
  '/dashboard',
  '/profile',
]

// Admin-only routes
const adminOnlyRoutes = ['/api/users', '/admin']

// Manager and Admin routes
const managerRoutes = ['/api/projects', '/api/activities/management']

/**
 * Verify mobile JWT token
 */
async function verifyMobileToken(token: string) {
  try {
    if (!process.env.NEXTAUTH_SECRET) {
      throw new Error('NEXTAUTH_SECRET not configured')
    }

    const decoded = jwt.verify(token, process.env.NEXTAUTH_SECRET) as {
      userId: string
      email: string
      role: UserRole
      exp: number
    }

    // Check if token is expired
    if (decoded.exp < Date.now() / 1000) {
      return null
    }

    return decoded
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

/**
 * Check if user has required role for the route
 */
function hasRequiredRole(userRole: UserRole, pathname: string): boolean {
  // Admin has access to everything
  if (userRole === 'ADMIN') return true

  // Check admin-only routes
  if (adminOnlyRoutes.some(route => pathname.startsWith(route))) {
    return false // Only ADMIN can access admin-only routes
  }

  // Check manager routes
  if (managerRoutes.some(route => pathname.startsWith(route))) {
    return ['MANAGER'].includes(userRole)
  }

  // All authenticated users have access to basic protected routes
  return ['USER', 'MANAGER', 'VIEWER'].includes(userRole)
}

export default auth(req => {
  const { pathname } = req.nextUrl
  const isApiRoute = pathname.startsWith('/api/')
  const isAuthRoute = pathname.startsWith('/api/auth/')

  // Skip auth routes
  if (isAuthRoute) {
    return NextResponse.next()
  }

  // Handle API routes
  if (isApiRoute) {
    const isProtected = protectedApiRoutes.some(route => pathname.startsWith(route))

    if (isProtected) {
      // Check for mobile JWT token first
      const authHeader = req.headers.get('authorization')

      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.substring(7)

        return verifyMobileToken(token).then(decoded => {
          if (decoded && hasRequiredRole(decoded.role, pathname)) {
            // Add user info to headers for API routes
            const requestHeaders = new Headers(req.headers)
            requestHeaders.set('x-user-id', decoded.userId)
            requestHeaders.set('x-user-email', decoded.email)
            requestHeaders.set('x-user-role', decoded.role)

            return NextResponse.next({
              request: { headers: requestHeaders },
            })
          }

          return NextResponse.json(
            { success: false, error: 'Authentication required' },
            { status: 401 }
          )
        })
      }

      // Check for web session
      if (req.auth?.user) {
        const userRole = req.auth.user.role as UserRole

        if (hasRequiredRole(userRole, pathname)) {
          // Add user info to headers for API routes
          const requestHeaders = new Headers(req.headers)
          requestHeaders.set('x-user-id', req.auth.user.id)
          requestHeaders.set('x-user-email', req.auth.user.email)
          requestHeaders.set('x-user-role', req.auth.user.role)

          return NextResponse.next({
            request: { headers: requestHeaders },
          })
        }

        return NextResponse.json(
          { success: false, error: 'Insufficient permissions' },
          { status: 403 }
        )
      }

      // No valid authentication found
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }
  }

  // Handle web pages
  const isProtectedPage = protectedWebPages.some(page => pathname.startsWith(page))

  if (isProtectedPage) {
    if (!req.auth?.user) {
      // Redirect to sign in page
      const signInUrl = new URL('/auth/signin', req.url)
      signInUrl.searchParams.set('callbackUrl', pathname)
      return NextResponse.redirect(signInUrl)
    }

    const userRole = req.auth.user.role as UserRole

    if (!hasRequiredRole(userRole, pathname)) {
      // Redirect to unauthorized page
      return NextResponse.redirect(new URL('/auth/unauthorized', req.url))
    }
  }

  return NextResponse.next()
})

// Middleware configuration
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|public|manifest.json|sw.js).*)',
  ],
}
