# Authentication Implementation Guide

## Overview

This authentication system provides comprehensive security for your Next.js application with support for both web and mobile clients. It includes:

✅ **NextAuth.js v5** for web authentication with session management  
✅ **JWT tokens** for mobile API access  
✅ **Role-based access control** (ADMIN, MANAGER, USER, VIEWER)  
✅ **CSRF protection** via secure cookies  
✅ **API route protection** with middleware  
✅ **Password hashing** with bcrypt  
✅ **TypeScript support** with full type safety  

## Quick Setup

### 1. Environment Variables

Copy `.env.example` to `.env.local` and configure:

```bash
# Database
POSTGRES_URL="postgres://postgres:yoontae93@127.0.0.1:5432/siger"

# NextAuth.js Configuration  
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-super-secret-key-change-this-in-production"
```

### 2. Database Setup

Run the migration to add authentication tables:

```bash
npx prisma migrate deploy
npx prisma generate
```

### 3. Seed Test Users

Create initial users for testing (important - run this now):

```bash
npx tsx prisma/seed-auth-users.ts
```

**Test Credentials:**
- **Admin**: `admin@siger.com` / `password123` - Full system access
- **Manager**: `manager@siger.com` / `password123` - Project management
- **User**: `user@siger.com` / `password123` - Standard user access
- **Viewer**: `viewer@siger.com` / `password123` - Read-only access

⚠️ **IMPORTANT**: Run this seeder now to create test users!

### 4. Start Development

```bash
npm run dev
```

Visit `http://localhost:3000/auth/signin` to test authentication.

## Usage Examples

### Web Authentication

```tsx
'use client'
import { useAuth } from '@/hooks/useAuth'

function MyComponent() {
  const { user, isAuthenticated, permissions } = useAuth()
  
  if (!isAuthenticated) {
    return <div>Please sign in</div>
  }
  
  return (
    <div>
      <h1>Welcome {user?.name}</h1>
      {permissions.canEditProjects && (
        <button>Edit Project</button>
      )}
    </div>
  )
}
```

### Protected API Routes

```tsx
// Using helper function
export const GET = createProtectedHandler(
  ['ADMIN', 'MANAGER'], // Allowed roles
  async (req, user) => {
    // Your API logic here
    // user object is automatically provided
    return Response.json({ data: 'success' })
  }
)

// Manual approach  
export async function POST(req: NextRequest) {
  const user = getUserFromRequest(req)
  
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }
  
  // Your API logic here
}
```

### Mobile Authentication

**Login Request:**
```javascript
const response = await fetch('/api/auth/mobile/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'user@example.com',
    password: 'password123',
    deviceInfo: {
      deviceId: 'unique-device-id',
      platform: 'ios', // or 'android'
      version: '1.0.0'
    }
  })
})

const { data } = await response.json()
// Store data.token for API requests
```

**API Requests:**
```javascript
const response = await fetch('/api/projects', {
  headers: {
    'Authorization': `Bearer ${storedToken}`,
    'Content-Type': 'application/json'
  }
})
```

## Role-Based Permissions

| Feature | VIEWER | USER | MANAGER | ADMIN |
|---------|--------|------|---------|-------|
| View Projects | ✅ | ✅ | ✅ | ✅ |
| Create Projects | ❌ | ❌ | ✅ | ✅ |
| Edit Projects | ❌ | ❌ | ✅ | ✅ |
| Delete Projects | ❌ | ❌ | ❌ | ✅ |
| View Activities | ✅ | ✅ | ✅ | ✅ |
| Create Activities | ❌ | ✅ | ✅ | ✅ |
| Edit Activities | ❌ | ✅ | ✅ | ✅ |
| Delete Activities | ❌ | ❌ | ✅ | ✅ |
| User Management | ❌ | ❌ | ❌ | ✅ |
| View Reports | ❌ | ✅ | ✅ | ✅ |
| Export Reports | ❌ | ❌ | ✅ | ✅ |

## Security Features

### CSRF Protection
- Automatic CSRF tokens in forms
- SameSite cookie settings
- Secure cookies in production

### Password Security
- bcrypt hashing with 12 rounds
- Password requirements enforced
- No plaintext password storage

### Session Management
- JWT tokens for mobile (30-day expiry)
- Secure session cookies for web
- Automatic session refresh
- Session invalidation on logout

### API Protection
- Middleware-based route protection
- Role-based access control
- Request header validation
- Standardized error responses

## File Structure

```
src/
├── app/
│   ├── api/
│   │   └── auth/
│   │       ├── [...nextauth]/route.ts    # NextAuth.js handler
│   │       └── mobile/login/route.ts     # Mobile JWT auth
│   └── auth/
│       ├── signin/page.tsx               # Sign in page
│       ├── error/page.tsx                # Auth error page
│       └── unauthorized/page.tsx         # Access denied page
├── components/
│   ├── layout/user-nav.tsx               # User navigation
│   └── providers/auth-provider.tsx       # Session provider
├── hooks/
│   └── useAuth.ts                        # Authentication hook
├── lib/
│   ├── auth.ts                           # NextAuth.js config
│   └── api-auth.ts                       # API protection utilities
├── middleware.ts                         # Route protection
└── prisma/
    ├── schema.prisma                     # Database schema
    └── seed-auth-users.ts                # User seeder
```

## Production Deployment

### Security Checklist

1. **Environment Variables**
   - Generate a strong `NEXTAUTH_SECRET` (minimum 32 characters)
   - Set correct `NEXTAUTH_URL` for your domain
   - Use secure database connection strings

2. **User Management**
   - Change default user passwords
   - Remove test users
   - Implement user registration flow

3. **HTTPS**
   - Enable HTTPS in production
   - Update secure cookie settings
   - Configure proper CORS policies

4. **Monitoring**
   - Set up error logging
   - Monitor authentication failures
   - Track user sessions

### Environment Variables for Production

```bash
# Production settings
NEXTAUTH_SECRET="your-super-secure-64-character-secret-key-here"
NEXTAUTH_URL="https://yourdomain.com"
POSTGRES_URL="your-production-database-url"

# Optional: Email configuration for notifications
SMTP_HOST="your-smtp-server"
SMTP_PORT=587
SMTP_USER="your-email@domain.com"
SMTP_PASSWORD="your-email-password"
```

## Troubleshooting

### Common Issues

1. **"NEXTAUTH_SECRET missing" error**
   - Add `NEXTAUTH_SECRET` to your `.env.local` file
   - Generate a secure secret: `openssl rand -base64 32`

2. **Database connection errors**
   - Verify `POSTGRES_URL` is correct
   - Ensure database server is running
   - Check firewall settings

3. **Session not persisting**
   - Clear browser cookies
   - Check `NEXTAUTH_URL` matches your domain
   - Verify middleware configuration

4. **Mobile token errors**
   - Ensure `Authorization` header format: `Bearer <token>`
   - Check token expiration (30 days default)
   - Verify `NEXTAUTH_SECRET` consistency

### Debug Mode

Enable debug logging in development:

```bash
# Add to .env.local
NEXTAUTH_DEBUG=true
```

This will provide detailed authentication logs in your console.

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review NextAuth.js documentation
3. Examine console logs for detailed errors
4. Contact your system administrator
