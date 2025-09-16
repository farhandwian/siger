import NextAuth, { NextAuthConfig } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import Credentials from 'next-auth/providers/credentials'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import bcrypt from 'bcryptjs'

// Enhanced user role enum to match new Prisma schema
export type UserRole = 
  | 'ADMIN_SISTEM'   // Global system administrator
  | 'ADMIN_BALAI'    // Balai-level administrator  
  | 'DIRJEN_SDA'     // Director General (read-only oversight)
  | 'KABALAI'        // Head of Balai (read-only)
  | 'SATKER'         // Budget execution unit (satker-level CRUD)
  | 'PPK'            // Project commitment officer (assigned projects CRUD)
  | 'VENDOR'         // Contractor/vendor (progress updates only)

// Validation schema for login credentials
const LoginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name: string
      role: UserRole
      balaiId?: string
      satkerId?: string
      projectIds?: string[]
    }
  }

  interface User {
    id: string
    email: string
    name: string
    role: UserRole
    balaiId?: string
    satkerId?: string
    projectIds?: string[]
  }
}

declare module 'next-auth' {
  interface JWT {
    userId: string
    role: UserRole
    balaiId?: string
    satkerId?: string
    projectIds?: string[]
  }
}

export const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  providers: [
    Credentials({
      name: 'credentials',
      credentials: {
        email: { 
          label: 'Email', 
          type: 'email',
          placeholder: 'Enter your email'
        },
        password: { 
          label: 'Password', 
          type: 'password',
          placeholder: 'Enter your password'
        },
      },
      async authorize(credentials) {
        try {
          // Validate input with Zod
          const validatedFields = LoginSchema.safeParse(credentials)
          
          if (!validatedFields.success) {
            // Invalid credentials format
            return null
          }

          const { email, password } = validatedFields.data

          // Find user in database with enhanced organizational context
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
              satkerId: true,
              // Include project assignments for PPK and VENDOR users
              projectAssignments: {
                where: { isActive: true },
                select: {
                  projectId: true,
                  role: true
                }
              }
            },
          })

          if (!user || !user.isActive) {
            // User not found or inactive
            return null
          }

          // Verify password
          const isValidPassword = await bcrypt.compare(password, user.password)
          
          if (!isValidPassword) {
            // Invalid password
            return null
          }

          // Update last login timestamp
          await prisma.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          })

          // Extract project IDs for PPK and VENDOR users
          const projectIds = user.projectAssignments?.map(assignment => assignment.projectId) || []

          // Return user object (password excluded) with organizational context
          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role as UserRole,
            balaiId: user.balaiId || undefined,
            satkerId: user.satkerId || undefined,
            projectIds: projectIds.length > 0 ? projectIds : undefined,
          }
        } catch (error) {
          // Authentication error occurred
          return null
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt', // Use JWT for mobile compatibility
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user }) {
      // Include user info and organizational context in JWT token
      if (user) {
        token.userId = user.id
        token.role = user.role
        token.balaiId = user.balaiId
        token.satkerId = user.satkerId
        token.projectIds = user.projectIds
      }
      return token
    },
    async session({ session, token }) {
      // Include user info and organizational context in session
      if (token && session.user) {
        session.user.id = token.userId as string
        session.user.role = token.role as UserRole
        session.user.balaiId = token.balaiId as string | undefined
        session.user.satkerId = token.satkerId as string | undefined
        session.user.projectIds = token.projectIds as string[] | undefined
      }
      return session
    },
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
  },
  // Security settings
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },
  // Only enable debug in explicit development mode, not in production or when NODE_ENV is undefined
  debug: process.env.NODE_ENV === 'development' && !process.env.NEXTAUTH_URL?.includes('production'),
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
