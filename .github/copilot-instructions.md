## 1) Project Context & Priorities

**Always prefer this stack (choose in this order, only fall back if truly impossible):**

- **Frontend**
  - Framework: **Next.js 15** (App Router + Server Components)
  - Language: **TypeScript 5.6+**
  - Styling: **Tailwind CSS 4.0** + CSS Modules
  - UI Library: **shadcn/ui** (first), then Headless UI, then custom components
  - **Charts: Recharts → Chart.js 4.4 → D3.js / Observable Plot** (use Recharts by default)
  - Maps: Mapbox GL JS + React Map GL (+ Turf.js for geospatial ops)
  - Animations: Framer Motion (+ Lottie React as needed)
  - Icons: Lucide React (+ Heroicons if needed)
  - PWA: Next-PWA + Workbox

- **Backend**
  - Runtime: Node.js 20+ LTS
  - Framework: Next.js 15 **Route Handlers** (REST) + optional Express.js microservices
  - Database: **PostgreSQL**
  - ORM: **Prisma**
  - Language: TypeScript
  - API Standard: **REST** (+ WebSocket if needed)
  - Validation: **Zod** (and **express-validator** only for Express routes)
  - Documentation: OpenAPI 3.1
  - Middleware (Express only): Helmet + CORS + Rate Limiting + Compression

**Coding style:** Clean code, composable, reusable, strongly typed.  
**UI first-choice:** **Use shadcn/ui** before writing custom components.

---

## 2) Visual Baseline & Responsiveness

**Match typography, spacing, and content ratios to these files** (treat them as the design source of truth):

- `src/app/monitoring-evaluasi/page.tsx`
- `src/components/monitoring/project-list.tsx`
- `src/components/monitoring/summary-cards.tsx`

**Responsive rules** (Tailwind breakpoints):
- **Mobile:** `< 640px` (base, no prefix)
- **Tablet:** `sm:` (≥ 640 and < 1024)
- **Laptop:** `lg:` (≥ 1024 and < 1280)
- **Desktop:** `xl:` (≥ 1280)

Prefer Tailwind tokens consistent with those files (e.g., `text-sm/base/lg`, `p-4/6`, `gap-4/6`, `rounded-2xl`, `shadow-sm`). Keep card density and font scale aligned.

---

## 3) State & Data — TanStack React Query

**Provider (App Router):**
```tsx
// src/app/providers.tsx
'use client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactNode, useState } from 'react'

export default function Providers({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient())
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}
```

```tsx
// src/app/layout.tsx
import Providers from './providers'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body><Providers>{children}</Providers></body>
    </html>
  )
}
```

**Fetching pattern (validate responses with Zod before caching):**
```ts
// src/lib/http.ts
export async function json<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { cache: 'no-store', ...init })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}
```

---

## 4) Validation — Zod Everywhere

**Validate:**
- API **request bodies**, **query params**, **route params**
- **Server responses** before they enter React Query cache
- **Form inputs** (via `react-hook-form` + `@hookform/resolvers/zod`)

**Example project schema:**
```ts
// src/lib/schemas/project.ts
import { z } from 'zod'

export const ProjectSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  budget: z.number(),
  status: z.enum(['on-track', 'at-risk', 'delayed']),
  progress: z.number().min(0).max(100),
  deviation: z.number(),
  target: z.number(),
})

export type Project = z.infer<typeof ProjectSchema>

export const ProjectsResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(ProjectSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})
```

---

## 5) API — Next.js 15 Route Handlers (REST with Zod)

```ts
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/server/prisma'

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const parsed = QuerySchema.parse(Object.fromEntries(searchParams))
  const where = parsed.search ? { title: { contains: parsed.search, mode: 'insensitive' } } : {}

  const [data, total] = await Promise.all([
    prisma.project.findMany({ where, skip: (parsed.page - 1) * parsed.limit, take: parsed.limit }),
    prisma.project.count({ where }),
  ])

  return NextResponse.json({
    success: true,
    data,
    pagination: { page: parsed.page, limit: parsed.limit, total, totalPages: Math.ceil(total / parsed.limit) },
  })
}
```

---

## 6) Database — PostgreSQL & Prisma

**Environment variable** (use your URL):
```
# .env.local
POSTGRES_URL=postgres://postgres:yoontae93@127.0.0.1:5432/siger
```

**Prisma datasource:**
```prisma
// prisma/schema.prisma
datasource db {
  provider = "postgresql"
  url      = env("POSTGRES_URL")
}

generator client {
  provider = "prisma-client-js"
}

model Project {
  id        String   @id @default(cuid())
  title     String
  location  String
  budget    Float
  status    String
  progress  Int
  deviation Float
  target    Float
  logs      ProjectProgress[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model ProjectProgress {
  id        String   @id @default(cuid())
  project   Project  @relation(fields: [projectId], references: [id])
  projectId String
  at        DateTime @default(now())
  progress  Int
}
```

**Client singleton:**
```ts
// src/server/prisma.ts
import { PrismaClient } from '@prisma/client'
export const prisma = globalThis.prisma || new PrismaClient()
if (process.env.NODE_ENV !== 'production') (globalThis as any).prisma = prisma
```

---

## 7) UI — shadcn/ui First, Reusable Components

**Summary card:**
```tsx
// src/components/monitoring/summary-cards.tsx
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

export function SummaryCard({ title, value, hint }: { title: string; value: string; hint?: string }) {
  return (
    <Card className="rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-base sm:text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="text-2xl sm:text-3xl lg:text-4xl font-semibold">{value}</div>
        {hint ? <p className="text-muted-foreground text-xs sm:text-sm mt-1">{hint}</p> : null}
      </CardContent>
    </Card>
  )
}
```

**Form with Zod + react-hook-form:**
```tsx
// src/components/forms/project-form.tsx
'use client'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const FormSchema = z.object({ title: z.string().min(1), budget: z.coerce.number().min(0) })
type FormValues = z.infer<typeof FormSchema>

export function ProjectForm({ onSubmit }: { onSubmit: (v: FormValues) => void }) {
  const { register, handleSubmit, formState: { errors } } = useForm<FormValues>({ resolver: zodResolver(FormSchema) })
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4">
      <div>
        <Input placeholder="Title" {...register('title')} />
        {errors.title && <p className="text-xs text-destructive mt-1">{errors.title.message}</p>}
      </div>
      <div>
        <Input type="number" placeholder="Budget" {...register('budget')} />
        {errors.budget && <p className="text-xs text-destructive mt-1">{errors.budget.message}</p>}
      </div>
      <Button type="submit" className="w-full sm:w-auto">Save</Button>
    </form>
  )
}
```

---

## 8) Charts — **Recharts by Default**

**Zod for time-series:**
```ts
// src/lib/schemas/series.ts
import { z } from 'zod'
export const TimePointSchema = z.object({ label: z.string(), value: z.number() })
export const SeriesSchema = z.object({ id: z.string(), label: z.string(), points: z.array(TimePointSchema) })
export const SeriesResponseSchema = z.object({ success: z.literal(true), data: z.array(SeriesSchema) })
export type Series = z.infer<typeof SeriesSchema>
```

**API route for progress:**
```ts
// src/app/api/projects/[id]/progress/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/server/prisma'
import { z } from 'zod'

const ParamsSchema = z.object({ id: z.string() })

export async function GET(_: NextRequest, ctx: { params: { id: string } }) {
  const { id } = ParamsSchema.parse(ctx.params)
  const logs = await prisma.projectProgress.findMany({
    where: { projectId: id },
    orderBy: { at: 'asc' },
    select: { at: true, progress: true },
  })
  const data = [{ id: 'progress', label: 'Progress', points: logs.map(l => ({ label: l.at.toISOString().slice(0,10), value: l.progress })) }]
  return NextResponse.json({ success: true, data })
}
```

**React Query hook:**
```ts
// src/hooks/useProjectProgress.ts
import { useQuery } from '@tanstack/react-query'
import { SeriesResponseSchema } from '@/lib/schemas/series'

export function useProjectProgress(projectId: string) {
  return useQuery({
    queryKey: ['project-progress', projectId],
    queryFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/progress`, { cache: 'no-store' })
      const json = await res.json()
      return SeriesResponseSchema.parse(json).data
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}
```

**Recharts component (responsive heights + shadcn Card):**
```tsx
// src/components/charts/ProgressTrend.tsx
'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useProjectProgress } from '@/hooks/useProjectProgress'
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ProgressTrend({ projectId, title = 'Progress Trend' }: { projectId: string; title?: string }) {
  const { data, isLoading, isError, error } = useProjectProgress(projectId)

  if (isLoading) {
    return (
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base sm:text-lg">{title}</CardTitle></CardHeader>
        <CardContent><Skeleton className="h-64 sm:h-72 lg:h-80 xl:h-96 w-full rounded-xl" /></CardContent>
      </Card>
    )
  }

  if (isError || !data?.length || !data[0].points.length) {
    return (
      <Card className="rounded-2xl">
        <CardHeader><CardTitle className="text-base sm:text-lg">{title}</CardTitle></CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTitle>Unable to load chart</AlertTitle>
            <AlertDescription>{(error as Error)?.message ?? 'No data available'}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    )
  }

  const points = data[0].points.map(p => ({ name: p.label, value: p.value }))

  return (
    <Card className="rounded-2xl">
      <CardHeader><CardTitle className="text-base sm:text-lg">{title}</CardTitle></CardHeader>
      <CardContent>
        <div className="h-64 sm:h-72 lg:h-80 xl:h-96">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="value" stroke="currentColor" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
```

> **Fallback rule:** If Recharts cannot meet a requirement, use Chart.js 4.4. Only use D3/Observable Plot when low-level control is required.

---

## 9) Maps — Mapbox + React Map GL (+ Turf)

```tsx
// src/components/maps/ProjectMap.tsx
'use client'
import Map, { Marker } from 'react-map-gl'

export function ProjectMap({ coords }: { coords: [number, number][] }) {
  return (
    <div className="h-64 sm:h-80 lg:h-96 rounded-2xl overflow-hidden">
      <Map
        mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_TOKEN}
        initialViewState={{ longitude: 106.8, latitude: -6.2, zoom: 9 }}
        mapStyle="mapbox://styles/mapbox/streets-v12"
      >
        {coords.map(([lng, lat], i) => <Marker key={i} longitude={lng} latitude={lat} />)}
      </Map>
    </div>
  )
}
```

---

## 10) Animations — Framer Motion

Use subtle entrance transitions for cards/lists. Keep durations short (120–240ms) and respect reduced motion preferences.

---

## 11) PWA — Next-PWA + Workbox

Provide offline for static assets and safe caching for idempotent GET APIs (e.g., `/api/projects`). Avoid caching authenticated mutations.

---

## 12) Error, Loading & Empty States

Every data view must implement:
- **Loading:** shadcn `Skeleton`
- **Error:** shadcn `Alert` (destructive)
- **Empty:** clear message with call-to-action (button)

---

## 13) Accessibility & i18n

- All interactive elements require accessible names.
- Charts must have `aria-label` or be described nearby.
- Keep copy in English by default; store text in constants for future i18n.

---

## 14) File/Folder Conventions

- Routes: `src/app/**` (Server Components by default). Use `'use client'` only where needed.
- Reusable components: `src/components/**` (prefer composition).
- Schemas: `src/lib/schemas/**`
- Hooks: `src/hooks/**`
- Use `@/*` alias to `src/*` (configure in `tsconfig.json`).

---

## 15) Security & Middleware (Express only)

When using Express microservices:
- Enable **Helmet**, **CORS**, **Compression**
- Add a modest **rate limiter** on public endpoints
- Mirror the same **Zod** schemas for validation

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

---

## 18) Environment

```
POSTGRES_URL=postgres://postgres:yoontae93@127.0.0.1:5432/siger
NEXT_PUBLIC_MAPBOX_TOKEN=YOUR_TOKEN
```


## 19) Additional
please create clear comment on the code so i can understand what each part does
