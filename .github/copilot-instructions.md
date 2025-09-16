## Technical Stack Requirements

**Frontend Technology Stack:**
- Framework: Next.js 15 (App Router + Server Components)
- Language: TypeScript 5.6+ (strictly typed)
- Styling: Tailwind CSS 4.0 + CSS Modules
- UI Components: shadcn/ui (primary), Headless UI (fallback), custom (last resort)
- Charts: Recharts (default) → Chart.js 4.4 → D3.js/Observable Plot
- Maps: Mapbox GL JS + React Map GL + Turf.js
- Animations: Framer Motion + Lottie React
- Icons: Lucide React + Heroicons
- PWA: Next-PWA + Workbox

**Backend Technology Stack:**
- Runtime: Node.js 20+ LTS
- Framework: Next.js 15 Route Handlers (REST API)
- Database: PostgreSQL + Prisma ORM
- Authentication: NextAuth.js (JWT + Sessions)
- Authorization: Role-based access control (RBAC)
- Validation: Zod (all inputs/outputs)
- Documentation: OpenAPI 3.1
- Express.js: Only for separate microservices (with Helmet, CORS, Rate Limiting)

**Code Standards:**
- Write clean, composable, reusable, strongly-typed code
- Always prefer shadcn/ui over custom components
- Add clear comments explaining functionality

## Design System & Responsive Guidelines

**Design Reference Files (match these exactly):**
- `src/app/monitoring-evaluasi/page.tsx`
- `src/components/monitoring/project-list.tsx`
- `src/components/monitoring/summary-cards.tsx`

**Responsive Breakpoints:**
- Mobile: `< 640px` (base, no prefix)
- Tablet: `sm:` (≥ 640px and < 1024px)
- Laptop: `lg:` (≥ 1024px and < 1280px)
- Desktop: `xl:` (≥ 1280px)

**Typography & Spacing Standards:**
- Use Tailwind tokens: `text-sm/base/lg`, `p-4/6`, `gap-4/6`, `rounded-2xl`, `shadow-sm`
- Match card density and font scale from reference files
- Maintain consistent visual hierarchy

## State Management & Data Fetching

**React Query Provider Setup:**
- Use TanStack React Query for all client-side data fetching
- Configure provider in `src/app/providers.tsx` with QueryClient
- Wrap root layout with Providers component

**Data Fetching Pattern:**
- Create custom hooks for each API endpoint
- Validate all server responses with Zod before caching
- Use stable query keys for consistent caching
- Handle loading, error, and empty states consistently

**Query Configuration:**
- Set appropriate `staleTime` for data freshness
- Use `enabled` flag for conditional queries
- Implement optimistic updates for mutations

## Data Validation with Zod

**Validation Requirements:**
- Validate ALL API request bodies, query params, and route params
- Validate ALL server responses before entering React Query cache
- Validate ALL form inputs using react-hook-form + @hookform/resolvers/zod

**Schema Organization:**
- Store schemas in `src/lib/schemas/**`
- Export both schema and inferred TypeScript types
- Create response schemas with success flags and pagination
- Use `.parse()` for strict validation, `.safeParse()` for error handling

**API Response Structure:**
- Always return `{ success: boolean, data: T, pagination?: PaginationData }`
- Use `z.literal(true)` for success responses
- Include error schemas for failure cases

## API Development Standards

**Next.js 15 Route Handlers:**
- Use `src/app/api/**` for REST endpoints
- Validate all inputs with Zod schemas
- Return consistent response format: `{ success, data, pagination? }`
- Handle errors gracefully with appropriate HTTP status codes

**Database Integration:**
- Use Prisma ORM for all database operations
- Create singleton Prisma client in `src/server/prisma.ts`
- Use transactions for complex operations
- Implement proper error handling and logging

**API Structure:**
- GET: Support pagination, search, and filtering
- POST: Validate request body, return created resource
- PATCH/PUT: Validate partial/full updates
- DELETE: Return success confirmation

## API Authentication & Authorization

**Authentication Setup:**
- Use NextAuth.js for session management
- Configure JWT tokens for API authentication
- Implement session-based auth for web UI
- Support bearer token authentication for mobile APIs

**Route Protection Middleware:**
- Create `src/lib/auth-middleware.ts` for route protection
- Validate JWT tokens in API route handlers
- Check user permissions before data access
- Return 401 for unauthenticated, 403 for unauthorized requests

**Authorization Patterns:**
- Role-based access control (RBAC) with user roles
- Resource-based permissions (project ownership)
- Implement permission checks in database queries
- Use Prisma `where` clauses for data filtering

**Protected API Implementation:**
- Wrap protected routes with authentication middleware
- Validate user session/token in every protected endpoint
- Filter data based on user permissions and ownership
- Log security events for audit trails

**Security Headers:**
- Implement CSRF protection for state-changing operations
- Add rate limiting per user/IP for API endpoints
- Use secure HTTP headers (CORS, Content-Type validation)
- Sanitize and validate all user inputs with Zod

**Error Handling:**
- Never expose sensitive information in error messages
- Return generic error responses for security violations
- Log detailed security errors server-side only
- Implement proper error boundaries for auth failures

## Database Configuration

**Environment Setup:**
- PostgreSQL connection: `POSTGRES_URL=postgres://postgres:yoontae93@127.0.0.1:5432/siger`
- Configure Prisma datasource in `prisma/schema.prisma`
- Generate Prisma client after schema changes

**Prisma Best Practices:**
- Use proper model relationships with foreign keys
- Implement cascading deletes where appropriate
- Add indexes for frequently queried fields
- Use `@default()` for auto-generated fields like timestamps

**Client Management:**
- Create singleton Prisma client to avoid connection issues
- Handle database errors with proper try-catch blocks
- Use environment-specific connection pooling

## UI Component Standards

**Component Hierarchy:**
1. **Primary:** shadcn/ui components (Card, Button, Input, etc.)
2. **Secondary:** Headless UI for complex interactions
3. **Last Resort:** Custom components with Tailwind CSS

**Component Structure:**
- Use shadcn/ui Card wrapper for all data displays
- Implement consistent spacing with `p-4/6`, `gap-4/6`
- Apply responsive text sizing: `text-sm sm:text-base lg:text-lg`
- Use `rounded-2xl` for card borders, `shadow-sm` for elevation

**Form Components:**
- Integrate react-hook-form with Zod validation
- Display field errors with `text-xs text-destructive`
- Use shadcn/ui Input, Button, and form components
- Implement proper accessibility with labels and ARIA attributes

## Chart Implementation Guidelines

**Chart Library Priority:**
1. **Recharts** (default choice for most visualizations)
2. **Chart.js 4.4** (fallback for specific requirements)
3. **D3.js/Observable Plot** (only for complex custom visualizations)

**Chart Structure:**
- Wrap all charts in shadcn/ui Card components
- Use responsive heights: `h-64 sm:h-72 lg:h-80 xl:h-96`
- Implement proper loading states with Skeleton
- Handle error states with Alert components
- Validate chart data with Zod schemas

**Data Integration:**
- Create dedicated React Query hooks for chart data
- Use time-series schemas for temporal data
- Implement proper error boundaries
- Cache chart data with appropriate staleTime

**Responsive Design:**
- Use ResponsiveContainer for automatic sizing
- Adjust font sizes for different breakpoints
- Maintain consistent margin and padding

## Map Integration Standards

**Mapbox Configuration:**
- Use Mapbox GL JS with React Map GL wrapper
- Configure with `NEXT_PUBLIC_MAPBOX_TOKEN` environment variable
- Apply responsive container heights: `h-64 sm:h-80 lg:h-96`
- Use `rounded-2xl overflow-hidden` for consistent styling

**Geospatial Operations:**
- Use Turf.js for spatial calculations and analysis
- Implement proper coordinate validation
- Handle map loading states and errors
- Support marker clustering for dense data sets

**Map Components:**
- Create reusable map wrapper components
- Implement proper TypeScript interfaces for coordinates
- Handle map interactions (zoom, pan, click events)
- Integrate with project location data from database

## Animation Guidelines

**Framer Motion Implementation:**
- Use subtle entrance transitions for cards and lists
- Keep animation durations short (120-240ms)
- Respect user's reduced motion preferences
- Apply consistent easing functions across components

**Lottie Integration:**
- Use Lottie React for complex illustrations and micro-interactions
- Optimize animation files for web performance
- Implement proper loading states for animations
- Provide fallback static images when needed

## PWA Configuration

**Next-PWA Setup:**
- Configure service worker for offline functionality
- Cache static assets for improved performance
- Implement safe caching for idempotent GET APIs
- Avoid caching authenticated mutations and sensitive data

**Workbox Integration:**
- Use workbox strategies for different content types
- Implement proper cache versioning and updates
- Handle offline/online state transitions
- Provide user feedback for offline functionality

## Error Handling & State Management

**Required States for All Data Views:**
- **Loading:** Use shadcn Skeleton components
- **Error:** Use shadcn Alert components with destructive variant
- **Empty:** Provide clear message with actionable call-to-action button

**Error Boundaries:**
- Implement React error boundaries for component-level errors
- Use try-catch blocks in API routes and async functions
- Provide meaningful error messages to users
- Log errors appropriately for debugging

**Loading State Patterns:**
- Show skeleton loaders that match content structure
- Use appropriate loading spinners for actions
- Implement progressive loading for large datasets
- Maintain UI responsiveness during data fetching

## Accessibility & Internationalization

**Accessibility Requirements:**
- All interactive elements must have accessible names
- Charts require `aria-label` or descriptive text nearby
- Implement proper focus management and keyboard navigation
- Use semantic HTML elements and ARIA attributes
- Ensure color contrast meets WCAG guidelines

**Content Management:**
- Keep copy in English by default
- Store text strings in constants for future internationalization
- Use consistent terminology across the application
- Implement proper pluralization for dynamic content

## File Organization & Conventions

**Project Structure:**
- Routes: `src/app/**` (Server Components by default, use `'use client'` only when needed)
- Reusable components: `src/components/**` (prefer composition over inheritance)
- Data schemas: `src/lib/schemas/**` (export schema and inferred types)
- Custom hooks: `src/hooks/**` (one hook per file with descriptive names)
- Utilities: `src/lib/**` (pure functions and shared utilities)

**Import Aliases:**
- Use `@/*` alias pointing to `src/*` (configured in `tsconfig.json`)
- Prefer absolute imports over relative paths
- Group imports: external packages, internal modules, relative imports

**Naming Conventions:**
- Components: PascalCase (`ProjectCard.tsx`)
- Hooks: camelCase with `use` prefix (`useProjectData.ts`)
- Utilities: camelCase (`formatCurrency.ts`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

## Security & Performance Standards

**Express.js Microservices (when used):**
- Enable Helmet for security headers
- Configure CORS for cross-origin requests
- Implement rate limiting on public endpoints
- Add compression middleware for response optimization
- Mirror Zod validation schemas from Next.js routes

**Next.js Performance:**
- Use Server Components by default for better performance
- Implement proper caching strategies with React Query
- Optimize images with Next.js Image component
- Minimize client-side JavaScript bundles
- Use dynamic imports for code splitting when appropriate

---

## 16) Quick Copilot Prompts

- “Generate a **Recharts** line chart for project progress using **TanStack React Query** + **Zod**, inside a **shadcn Card**, with heights `h-64 sm:h-72 lg:h-80 xl:h-96`, matching monitoring typography.”
- “Create a Next.js 15 **GET** route for `/api/projects` with pagination and search; validate with Zod; use Prisma; return `{ success, data, pagination }`.”
- “Build a reusable **SummaryCard** (shadcn) matching spacing from `summary-cards.tsx` and responsive font sizes.”
- “Add **Mapbox** map with markers (React Map GL), container heights responsive, using `NEXT_PUBLIC_MAPBOX_TOKEN`.”
- “Wire a **PATCH** `/api/projects/[id]` that validates body with Zod and updates via Prisma; add a `useUpdateProject` mutation with optimistic UI.”

---

## 17) Do / Don’t

**Do**
- Prefer **shadcn/ui** first; build custom only if necessary.
- Use **React Query** for all client fetching/mutations with stable keys.
- **Validate inputs & outputs** with **Zod**.
- Keep spacing/typography aligned with the three monitoring files.

**Don’t**
- Don’t introduce ad-hoc styles diverging from monitoring components.
- Don’t bypass Zod or push untyped JSON to caches.
- Don’t fetch in Server Components when you need rapid client revalidation—use React Query.

## Development Guidelines

**Always Do:**
- Prefer shadcn/ui components before building custom solutions
- Use TanStack React Query for all client-side data fetching with stable query keys
- Validate all inputs and outputs with Zod schemas before caching
- Match typography and spacing patterns from monitoring reference files
- Add clear, descriptive comments explaining functionality
- Implement proper loading, error, and empty states for all data views
- Protect all API routes with authentication middleware
- Validate user permissions before data access
- Filter data based on user ownership and roles

**Never Do:**
- Create ad-hoc styles that diverge from established monitoring component patterns
- Bypass Zod validation or store untyped JSON in React Query cache
- Use Server Components for rapid client-side data revalidation (use React Query instead)
- Create README files or comprehensive implementation summaries (focus on code with comments)
- Create documentation outside of code comments.
- Expose sensitive data in API responses without proper authorization
- Return detailed error messages that could reveal system information


## 19) Additional
-please create clear comment on the code so i can understand what each part does
mapping:
-on the ui proyek but on the db is project
- on the ui pekerjaan but on the db is activity
- on the ui kegiatan but on the db is sub_activity
**Code Quality Standards:**
- Write clean, composable, and strongly-typed TypeScript code
- Prefer composition over inheritance for component architecture
- Use descriptive naming conventions across files and functions
- Implement proper error handling with meaningful user feedback
- Maintain consistent visual hierarchy and responsive design patterns
- Follow security-first principles in all API implementations
