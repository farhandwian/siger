Looking at the current authentication implementation, it's quite solid but there are several areas for improvement to make it more secure and production-ready. Let me provide a comprehensive security assessment:

✅ Current Strengths
Good Security Foundations:

✅ NextAuth.js v5 with JWT strategy
✅ bcrypt password hashing (12 rounds)
✅ Role-based access control (RBAC)
✅ CSRF protection via secure cookies
✅ TypeScript throughout for type safety
✅ Zod validation for all inputs
✅ Middleware-based route protection


1. Password Policy & Account Securi
import { z } from 'zod'

/**
 * Enhanced password validation with security requirements
 */
export const PasswordSchema = z.string()
  .min(12, 'Password must be at least 12 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter') 
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character')
  .refine(
    (password) => !commonPasswords.includes(password.toLowerCase()),
    'Password is too common'
  )

/**
 * Account lockout protection
 */
export async function checkAccountLockout(email: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { email },
    select: { 
      failedLoginAttempts: true, 
      lockedUntil: true,
      lastFailedLogin: true 
    }
  })

  if (!user) return false

  // Lock account after 5 failed attempts for 15 minutes
  if (user.failedLoginAttempts >= 5) {
    const lockDuration = 15 * 60 * 1000 // 15 minutes
    const isLocked = user.lockedUntil && user.lockedUntil > new Date()
    return isLocked
  }

  return false
}

// List of common passwords to block
const commonPasswords = [
  'password123', 'admin123', 'qwerty123', 
  'password', '123456789', 'welcome123'
  // Add more common passwords
]

2. Enhanced Session Management
import { randomBytes } from 'crypto'
import { prisma } from '@/server/prisma'

/**
 * Device fingerprinting for additional security
 */
export function generateDeviceFingerprint(req: Request): string {
  const userAgent = req.headers.get('user-agent') || ''
  const acceptLanguage = req.headers.get('accept-language') || ''
  const acceptEncoding = req.headers.get('accept-encoding') || ''
  
  return Buffer.from(`${userAgent}:${acceptLanguage}:${acceptEncoding}`)
    .toString('base64')
    .slice(0, 32)
}

/**
 * Session tracking and management
 */
export interface SessionRecord {
  id: string
  userId: string
  deviceFingerprint: string
  ipAddress: string
  userAgent: string
  lastActivity: Date
  isActive: boolean
  location?: string // From IP geolocation
}

/**
 * Enhanced logout - invalidate all sessions or specific device
 */
export async function invalidateUserSessions(
  userId: string, 
  keepCurrentSession?: string
) {
  await prisma.userSession.updateMany({
    where: { 
      userId,
      id: keepCurrentSession ? { not: keepCurrentSession } : undefined
    },
    data: { isActive: false }
  })
}


3. Rate Limiting & Brute Force Protection
import { NextRequest } from 'next/server'

/**
 * Rate limiting for authentication endpoints
 */
const attemptTracker = new Map<string, { count: number; resetTime: number }>()

export function rateLimitAuth(
  identifier: string, 
  maxAttempts = 5, 
  windowMs = 15 * 60 * 1000 // 15 minutes
): { allowed: boolean; remaining: number; resetTime: number } {
  const now = Date.now()
  const current = attemptTracker.get(identifier)

  // Reset if window expired
  if (!current || now > current.resetTime) {
    attemptTracker.set(identifier, { count: 1, resetTime: now + windowMs })
    return { allowed: true, remaining: maxAttempts - 1, resetTime: now + windowMs }
  }

  // Check if limit exceeded
  if (current.count >= maxAttempts) {
    return { allowed: false, remaining: 0, resetTime: current.resetTime }
  }

  // Increment counter
  current.count++
  attemptTracker.set(identifier, current)
  
  return { 
    allowed: true, 
    remaining: maxAttempts - current.count, 
    resetTime: current.resetTime 
  }
}

/**
 * Get client identifier for rate limiting
 */
export function getClientIdentifier(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  const realIp = req.headers.get('x-real-ip')
  const ip = forwarded?.split(',')[0] || realIp || 'unknown'
  return ip
}


4. Audit Logging System
/**
 * Security audit logging for compliance and monitoring
 */
export enum AuditEventType {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGOUT = 'LOGOUT',
  PASSWORD_CHANGED = 'PASSWORD_CHANGED',
  ACCOUNT_LOCKED = 'ACCOUNT_LOCKED',
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  DATA_EXPORT = 'DATA_EXPORT',
  USER_CREATED = 'USER_CREATED',
  ROLE_CHANGED = 'ROLE_CHANGED'
}

export interface AuditEvent {
  eventType: AuditEventType
  userId?: string
  email?: string
  ipAddress: string
  userAgent: string
  resource?: string
  details?: Record<string, any>
  timestamp: Date
  success: boolean
}

export async function logAuditEvent(event: AuditEvent) {
  try {
    await prisma.auditLog.create({
      data: {
        eventType: event.eventType,
        userId: event.userId,
        email: event.email,
        ipAddress: event.ipAddress,
        userAgent: event.userAgent,
        resource: event.resource,
        details: event.details || {},
        timestamp: event.timestamp,
        success: event.success
      }
    })
  } catch (error) {
    console.error('Failed to log audit event:', error)
    // Don't throw - logging should not break auth flow
  }
}

5. Enhanced Prisma Schema for Security
model User {
  id                   String    @id @default(cuid())
  email                String    @unique
  name                 String?
  password             String
  role                 UserRole  @default(USER)
  isActive             Boolean   @default(true)
  
  // Security fields
  failedLoginAttempts  Int       @default(0)
  lockedUntil          DateTime?
  lastFailedLogin      DateTime?
  lastLoginAt          DateTime?
  lastPasswordChange   DateTime  @default(now())
  requirePasswordReset Boolean   @default(false)
  twoFactorSecret      String?   // For future 2FA implementation
  twoFactorEnabled     Boolean   @default(false)
  
  createdAt            DateTime  @default(now())
  updatedAt            DateTime  @updatedAt

  // Relations
  accounts             Account[]
  sessions             Session[]
  userSessions         UserSession[]
  auditLogs            AuditLog[]

  @@map("users")
}

// Enhanced session tracking
model UserSession {
  id                String   @id @default(cuid())
  userId            String
  deviceFingerprint String
  ipAddress         String
  userAgent         String
  location          String?
  lastActivity      DateTime @default(now())
  isActive          Boolean  @default(true)
  expiresAt         DateTime
  createdAt         DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("user_sessions")
}

// Security audit logging
model AuditLog {
  id        String   @id @default(cuid())
  eventType String
  userId    String?
  email     String?
  ipAddress String
  userAgent String
  resource  String?
  details   Json     @default("{}")
  timestamp DateTime @default(now())
  success   Boolean

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([eventType, timestamp])
  @@index([userId, timestamp])
  @@map("audit_logs")
}


6. Environment Security Configuration
/**
 * Security configuration with environment-based settings
 */
export const securityConfig = {
  // Password policy
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAge: 90 * 24 * 60 * 60 * 1000, // 90 days
  },

  // Session security
  session: {
    maxAge: process.env.NODE_ENV === 'production' ? 24 * 60 * 60 : 30 * 24 * 60 * 60, // 1 day prod, 30 days dev
    maxConcurrentSessions: 5,
    trackDevices: true,
  },

  // Account lockout
  lockout: {
    maxAttempts: 5,
    lockDuration: 15 * 60 * 1000, // 15 minutes
    progressiveLockout: true, // Increase lockout time for repeat offenders
  },

  // Rate limiting
  rateLimit: {
    auth: { requests: 5, window: 15 * 60 * 1000 }, // 5 attempts per 15 min
    api: { requests: 100, window: 60 * 1000 }, // 100 requests per minute
  },

  // Security headers
  headers: {
    hsts: process.env.NODE_ENV === 'production',
    contentSecurityPolicy: true,
    xFrameOptions: 'DENY',
    xContentTypeOptions: 'nosniff',
  }
} as const


7. Production Security Headers
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()

  // Security headers for production
  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains')
    response.headers.set('X-Frame-Options', 'DENY')
    response.headers.set('X-Content-Type-Options', 'nosniff')
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
    )
  }

  // Rate limiting headers
  const clientId = getClientIdentifier(request)
  const { allowed, remaining, resetTime } = rateLimitAuth(clientId)
  
  response.headers.set('X-RateLimit-Remaining', remaining.toString())
  response.headers.set('X-RateLimit-Reset', new Date(resetTime).toISOString())

  if (!allowed) {
    return new NextResponse('Too Many Requests', { status: 429 })
  }

  return response
}


🔧 Implementation Priority
Phase 1 (Critical - Implement Now):

Enhanced password policy with complexity requirements
Account lockout after failed attempts
Rate limiting for auth endpoints
Security audit logging
Phase 2 (High Priority):

Session management improvements
Device fingerprinting
Enhanced Prisma schema with security fields
Production security headers
Phase 3 (Future Enhancements):

Two-factor authentication (TOTP/SMS)
IP whitelisting for admin accounts
Advanced threat detection
Session monitoring dashboard
📊 Security Monitoring Dashboard
Consider implementing a simple admin dashboard to monitor:

Failed login attempts
Active sessions per user
Suspicious activity patterns
Account lockouts
Geographic login patterns
The current implementation is a solid foundation, but adding these security enhancements will make it production-grade and enterprise-ready. Would you like me to implement any of these improvements first?