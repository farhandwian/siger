import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import jwt from 'jsonwebtoken'
import { UserRole } from '@/lib/auth'

/**
 * Enhanced Authentication Middleware
 * Handles role-based access control for the new organizational structure
 * Supports both web session authentication (NextAuth.js) and mobile JWT token authentication
 */

// Protected API routes that require authentication
const protectedApiRoutes = [
  '/api/projects',
  '/api/activities', 
  '/api/monitoring',
  '/api/materials',
  '/api/proposals',
  '/api/daily-activities',
  '/api/departments',
  '/api/balai',
  '/api/assignments',
]

// Protected web pages that require authentication
const protectedWebPages = [
  '/monitoring-evaluasi',
  '/daftar-usulan', 
  '/tambah-usulan',
  '/dashboard',
  '/profile',
  '/admin',
  '/management',
]

// Routes accessible only by system administrators
const systemAdminRoutes = [
  '/api/users/admin',
  '/api/balai',
  '/api/departments',
  '/admin',
]

// Routes accessible by balai-level administrators  
const balaiAdminRoutes = [
  '/api/users/balai',
  '/management/balai',
]

// Routes for department-level management (SATKER)
const departmentManagementRoutes = [
  '/api/projects/department',
  '/management/department',
]

// Mobile-only routes (PPK and VENDOR access)
const mobileOnlyRoutes = [
  '/api/mobile',
  '/api/daily-activities',
  '/api/projects/progress',
]

/**
 * Check if user has required permissions for the route based on new role system
 */
function hasRequiredPermissions(userRole: UserRole, pathname: string, userContext?: {
  balaiId?: string
  departmentId?: string
  projectIds?: string[]
}): boolean {
  // ADMIN_SISTEM has access to everything
  if (userRole === 'ADMIN_SISTEM') return true

  // Check system admin-only routes
  if (systemAdminRoutes.some(route => pathname.startsWith(route))) {
    return userRole === 'ADMIN_SISTEM'
  }

  // Check balai admin routes
  if (balaiAdminRoutes.some(route => pathname.startsWith(route))) {
    return ['ADMIN_SISTEM', 'ADMIN_BALAI'].includes(userRole)
  }

  // Check department management routes
  if (departmentManagementRoutes.some(route => pathname.startsWith(route))) {
    return ['ADMIN_SISTEM', 'ADMIN_BALAI', 'SATKER'].includes(userRole)
  }

  // Check mobile-only routes (PPK and VENDOR)
  if (mobileOnlyRoutes.some(route => pathname.startsWith(route))) {
    return ['PPK', 'VENDOR'].includes(userRole)
  }

  // Project routes - check based on role and scope
  if (pathname.startsWith('/api/projects')) {
    switch (userRole) {
      case 'ADMIN_SISTEM':
      case 'DIRJEN_SDA':
        return true // Can access all projects
      case 'ADMIN_BALAI':
      case 'KABALAI':
        return !!userContext?.balaiId // Can access projects in their balai
      case 'SATKER':
        return !!userContext?.departmentId // Can access projects in their department
      case 'PPK':
      case 'VENDOR':
        return !!userContext?.projectIds?.length // Can access assigned projects only
      default:
        return false
    }
  }

  // General protected routes - authenticated users with proper roles
  if (protectedWebPages.some(page => pathname.startsWith(page)) ||
      protectedApiRoutes.some(route => pathname.startsWith(route))) {
    return ['ADMIN_SISTEM', 'ADMIN_BALAI', 'DIRJEN_SDA', 'KABALAI', 'SATKER', 'PPK', 'VENDOR'].includes(userRole)
  }

  // Public routes
  return true
}

/**
 * Enhanced mobile token verification with organizational context
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
      balaiId?: string
      departmentId?: string
      projectIds?: string[]
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
          if (decoded) {
            const userContext = {
              balaiId: decoded.balaiId,
              departmentId: decoded.departmentId,
              projectIds: decoded.projectIds,
            }

            if (hasRequiredPermissions(decoded.role, pathname, userContext)) {
              // Add user info to headers for API routes
              const requestHeaders = new Headers(req.headers)
              requestHeaders.set('x-user-id', decoded.userId)
              requestHeaders.set('x-user-email', decoded.email)
              requestHeaders.set('x-user-role', decoded.role)
              if (decoded.balaiId) requestHeaders.set('x-user-balai-id', decoded.balaiId)
              if (decoded.departmentId) requestHeaders.set('x-user-department-id', decoded.departmentId)
              if (decoded.projectIds) requestHeaders.set('x-user-project-ids', JSON.stringify(decoded.projectIds))

              return NextResponse.next({
                request: { headers: requestHeaders },
              })
            }
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
        // Note: Would need to fetch user's organizational context from database for web sessions
        // For now, allowing basic access - should be enhanced to include user context
        
        if (hasRequiredPermissions(userRole, pathname)) {
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

    if (!hasRequiredPermissions(userRole, pathname)) {
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
