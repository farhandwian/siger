import { z } from 'zod'

// User schemas
export const UserRoleSchema = z.enum(['admin', 'operator', 'viewer'])

export const CreateUserSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter').max(100, 'Nama maksimal 100 karakter'),
  email: z.string().email('Format email tidak valid'),
  role: UserRoleSchema,
  department: z.string().optional(),
})

export const UpdateUserSchema = CreateUserSchema.partial()

// Report schemas
export const ReportTypeSchema = z.enum(['dashboard', 'analytics', 'geographic', 'custom'])
export const VisibilitySchema = z.enum(['public', 'internal', 'restricted'])

export const ReportMetadataSchema = z.object({
  source: z.string().min(1, 'Source tidak boleh kosong'),
  period: z.object({
    start: z.date(),
    end: z.date(),
  }),
  tags: z.array(z.string()),
  visibility: VisibilitySchema,
})

export const CreateReportSchema = z.object({
  title: z.string().min(1, 'Judul tidak boleh kosong').max(200, 'Judul maksimal 200 karakter'),
  description: z.string().max(1000, 'Deskripsi maksimal 1000 karakter').optional(),
  type: ReportTypeSchema,
  data: z.any(),
  metadata: ReportMetadataSchema,
  createdBy: z.string().uuid('ID pembuat tidak valid'),
})

export const UpdateReportSchema = CreateReportSchema.partial()

// Dashboard Widget schemas
export const WidgetTypeSchema = z.enum(['chart', 'map', 'metric', 'table'])

export const WidgetPositionSchema = z.object({
  x: z.number().min(0),
  y: z.number().min(0),
  width: z.number().min(1),
  height: z.number().min(1),
})

export const DashboardWidgetSchema = z.object({
  id: z.string().uuid(),
  type: WidgetTypeSchema,
  title: z.string().min(1, 'Judul widget tidak boleh kosong'),
  config: z.any(),
  position: WidgetPositionSchema,
})

// Filter schemas
export const FilterOptionsSchema = z.object({
  dateRange: z.object({
    start: z.date(),
    end: z.date(),
  }).optional(),
  department: z.array(z.string()).optional(),
  region: z.array(z.string()).optional(),
  category: z.array(z.string()).optional(),
  status: z.array(z.string()).optional(),
})

// API Response schema
export const PaginationSchema = z.object({
  page: z.number().min(1),
  limit: z.number().min(1).max(100),
  total: z.number().min(0),
  totalPages: z.number().min(0),
})

export const APIResponseSchema = z.object({
  success: z.boolean(),
  data: z.any().optional(),
  message: z.string().optional(),
  errors: z.array(z.string()).optional(),
  pagination: PaginationSchema.optional(),
})

// Chart data schema
export const ChartDatasetSchema = z.object({
  label: z.string(),
  data: z.array(z.number()),
  backgroundColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderColor: z.union([z.string(), z.array(z.string())]).optional(),
  borderWidth: z.number().optional(),
})

export const ChartDataSchema = z.object({
  labels: z.array(z.string()),
  datasets: z.array(ChartDatasetSchema),
})

// Export inferred types
export type User = z.infer<typeof CreateUserSchema> & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type Report = z.infer<typeof CreateReportSchema> & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>
export type FilterOptions = z.infer<typeof FilterOptionsSchema>
export type APIResponse<T = any> = Omit<z.infer<typeof APIResponseSchema>, 'data'> & { data?: T }
export type ChartData = z.infer<typeof ChartDataSchema>
