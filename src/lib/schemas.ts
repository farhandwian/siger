import { z } from 'zod'

// Project schemas
export const ProjectStatusSchema = z.enum(['on-track', 'at-risk', 'delayed'])

export const ProjectSchema = z.object({
  id: z.any(), // Temporary: allow any type for id

  // Informasi Umum Proyek
  penyediaJasa: z
    .string()
    .min(1, 'Penyedia jasa wajib diisi')
    .max(255, 'Penyedia jasa maksimal 255 karakter')
    .nullable(),
  pekerjaan: z
    .string()
    .min(1, 'Nama pekerjaan wajib diisi')
    .max(500, 'Nama pekerjaan maksimal 500 karakter')
    .nullable(),
  jenisPaket: z
    .string()
    .min(1, 'Jenis paket wajib diisi')
    .max(100, 'Jenis paket maksimal 100 karakter')
    .nullable(),
  jenisPengadaan: z
    .string()
    .min(1, 'Jenis pengadaan wajib diisi')
    .max(100, 'Jenis pengadaan maksimal 100 karakter')
    .nullable(),

  // Informasi Kontrak & Anggaran
  paguAnggaran: z
    .string()
    .regex(/^Rp[\d.,]+$/, 'Format pagu anggaran tidak valid')
    .nullable(),
  nilaiKontrak: z
    .string()
    .regex(/^Rp[\d.,]+$/, 'Format nilai kontrak tidak valid')
    .nullable(),
  nomorKontrak: z
    .string()
    .min(1, 'Nomor kontrak wajib diisi')
    .max(100, 'Nomor kontrak maksimal 100 karakter')
    .nullable(),
  spmk: z.string().max(200, 'SPMK maksimal 200 karakter').nullable(),
  masaKontrak: z.string().max(100, 'Masa kontrak maksimal 100 karakter').nullable(),
  tanggalKontrak: z.string().max(50, 'Tanggal kontrak maksimal 50 karakter').nullable(),
  akhirKontrak: z.string().max(50, 'Akhir kontrak maksimal 50 karakter').nullable(),
  pembayaranTerakhir: z.string().max(200, 'Pembayaran terakhir maksimal 200 karakter').nullable(),

  // Progress data
  fisikProgress: z
    .number()
    .min(0, 'Progress fisik minimal 0')
    .max(100, 'Progress fisik maksimal 100')
    .nullable(),
  fisikDeviasi: z
    .number()
    .min(-100, 'Deviasi fisik minimal -100')
    .max(100, 'Deviasi fisik maksimal 100')
    .nullable(),
  fisikTarget: z
    .number()
    .min(0, 'Target fisik minimal 0')
    .max(100, 'Target fisik maksimal 100')
    .nullable(),

  saluranProgress: z.number().min(0, 'Progress saluran minimal 0').nullable(),
  saluranDeviasi: z
    .number()
    .min(-1000000, 'Deviasi saluran terlalu kecil')
    .max(1000000, 'Deviasi saluran terlalu besar')
    .nullable(),
  saluranTarget: z.number().min(0, 'Target saluran minimal 0').nullable(),

  bangunanProgress: z.number().min(0, 'Progress bangunan minimal 0').nullable(),
  bangunanDeviasi: z
    .number()
    .min(-1000, 'Deviasi bangunan terlalu kecil')
    .max(1000, 'Deviasi bangunan terlalu besar')
    .nullable(),
  bangunanTarget: z.number().min(0, 'Target bangunan minimal 0').nullable(),

  keuanganProgress: z
    .number()
    .min(0, 'Progress keuangan minimal 0')
    .max(100, 'Progress keuangan maksimal 100')
    .nullable(),
  keuanganDeviasi: z
    .number()
    .min(-100, 'Deviasi keuangan minimal -100')
    .max(100, 'Deviasi keuangan maksimal 100')
    .nullable(),
  keuanganTarget: z
    .number()
    .min(0, 'Target keuangan minimal 0')
    .max(100, 'Target keuangan maksimal 100')
    .nullable(),

  // Realisasi data (JSON)
  outputData: z
    .array(
      z.object({
        label: z.string().min(1, 'Label output wajib diisi'),
        value: z.string().min(1, 'Value output wajib diisi'),
      })
    )
    .nullable(),

  tenagaKerjaData: z
    .array(
      z.object({
        label: z.string().min(1, 'Label tenaga kerja wajib diisi'),
        value: z.string().min(1, 'Value tenaga kerja wajib diisi'),
      })
    )
    .nullable(),

  alatData: z
    .array(
      z.object({
        label: z.string().min(1, 'Label alat wajib diisi'),
        value: z.string().min(1, 'Value alat wajib diisi'),
      })
    )
    .nullable(),

  materialData: z
    .array(
      z.object({
        label: z.string().min(1, 'Label material wajib diisi'),
        value: z.string().min(1, 'Value material wajib diisi'),
      })
    )
    .nullable(),

  // Metadata
  createdAt: z.any(), // Temporary: allow any type for createdAt
  updatedAt: z.any(), // Temporary: allow any type for updatedAt
})

export const CreateProjectSchema = ProjectSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

export const UpdateProjectSchema = ProjectSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
})

// Project update field schema
export const UpdateProjectFieldSchema = z.object({
  projectId: z.any(), // Temporary: allow any type for projectId
  fieldName: z.enum(
    [
      'penyediaJasa',
      'pekerjaan',
      'jenisPaket',
      'jenisPengadaan',
      'paguAnggaran',
      'nilaiKontrak',
      'nomorKontrak',
      'spmk',
      'masaKontrak',
      'tanggalKontrak',
      'akhirKontrak',
      'pembayaranTerakhir',
    ],
    { errorMap: () => ({ message: 'Field name tidak valid' }) }
  ),
  value: z.string().max(500, 'Value maksimal 500 karakter'),
})

// Project list query schema
export const ProjectListQuerySchema = z.object({
  page: z.number().min(1, 'Page minimal 1').default(1),
  limit: z.number().min(1, 'Limit minimal 1').max(100, 'Limit maksimal 100').default(10),
  search: z.string().max(255, 'Search maksimal 255 karakter').optional(),
})

// Transformed project data for list view
export const ProjectListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string(),
  budget: z.string(),
  status: ProjectStatusSchema,
  progress: z.number(),
  deviation: z.number(),
  target: z.number(),
})

// User schemas
export const UserRoleSchema = z.enum(['admin', 'supervisor', 'user'])

export const UserSchema = z.object({
  id: z.string(),
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  role: UserRoleSchema,
  phoneNumber: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

export const CreateUserSchema = z.object({
  username: z
    .string()
    .min(3, 'Username minimal 3 karakter')
    .max(50, 'Username maksimal 50 karakter'),
  email: z.string().email('Format email tidak valid'),
  name: z.string().min(1, 'Nama wajib diisi').max(100, 'Nama maksimal 100 karakter'),
  role: UserRoleSchema.default('user'),
  phoneNumber: z.string().nullable().optional(),
  isActive: z.boolean().default(true),
})

export const UpdateUserSchema = CreateUserSchema.partial()

export const UserQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  role: UserRoleSchema.optional(),
  isActive: z.coerce.boolean().optional(),
})

// Report schemas
export const ReportTypeSchema = z.enum(['dashboard', 'analytics', 'geographic', 'custom'])
export const VisibilitySchema = z.enum(['public', 'internal', 'restricted'])

export const ReportMetadataSchema = z.object({
  source: z.string().min(1, 'Source tidak boleh kosong'),
  period: z.object({
    start: z.any(), // Temporary: allow any type for date
    end: z.any(), // Temporary: allow any type for date
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
  dateRange: z
    .object({
      start: z.any(), // Temporary: allow any type for date
      end: z.any(), // Temporary: allow any type for date
    })
    .optional(),
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

// Activity schemas
export const ActivityScheduleSchema = z.object({
  id: z.any(), // Temporary: allow any type for id
  activityId: z.any().optional(), // Temporary: allow any type
  subActivityId: z.any().optional(), // Temporary: allow any type
  month: z.number().min(1).max(12),
  year: z.number(),
  week: z.number().min(1).max(5), // Allow up to 5 weeks since some months have 5 weeks
  planPercentage: z.number().min(0).max(100).nullable(),
  actualPercentage: z.number().min(0).max(100).nullable(),
  createdAt: z.any(), // Temporary: allow any type for createdAt
  updatedAt: z.any(), // Temporary: allow any type for updatedAt
})

export const SubActivitySchema = z.object({
  id: z.any(), // Temporary: allow any type for id
  activityId: z.any(), // Temporary: allow any type
  name: z.string().min(1, 'Nama sub kegiatan wajib diisi').max(255),
  satuan: z.string().nullable().optional(),
  volumeKontrak: z.number().min(0).nullable().optional(),
  volumeMC0: z.number().min(0).nullable().optional(),
  bobotMC0: z.number().min(0).max(100).nullable().optional(),
  weight: z.number().min(0).max(100, 'Bobot maksimal 100%'),
  order: z.number().min(0).default(0),
  createdAt: z.any(), // Temporary: allow any type for createdAt
  updatedAt: z.any(), // Temporary: allow any type for updatedAt
  schedules: z.array(ActivityScheduleSchema).optional(),
})

export const ActivitySchema = z.object({
  id: z.any(), // Temporary: allow any type for id
  projectId: z.any(), // Temporary: allow any type
  name: z.string().min(1, 'Nama kegiatan wajib diisi').max(255),
  order: z.number().min(0).default(0),
  createdAt: z.any(), // Temporary: allow any type for createdAt
  updatedAt: z.any(), // Temporary: allow any type for updatedAt
  subActivities: z.array(SubActivitySchema).optional(),
  schedules: z.array(ActivityScheduleSchema).optional(),
})

export const CreateActivitySchema = z.object({
  name: z.string().min(1, 'Nama kegiatan wajib diisi').max(255),
})

export const CreateSubActivitySchema = z.object({
  name: z.string().min(1, 'Nama sub kegiatan wajib diisi').max(255),
  satuan: z.string().optional(),
  volumeKontrak: z.number().min(0).optional(),
  volumeMC0: z.number().min(0).optional(),
  bobotMC0: z.number().min(0).max(100).optional(),
  weight: z.number().min(0).max(100, 'Bobot maksimal 100%'),
})

export const UpdateActivitySchema = z.object({
  name: z.string().min(1, 'Nama kegiatan wajib diisi').max(255).optional(),
  order: z.number().min(0).optional(),
})

export const UpdateSubActivitySchema = z.object({
  name: z.string().min(1, 'Nama sub kegiatan wajib diisi').max(255).optional(),
  satuan: z.string().nullable().optional(),
  volumeKontrak: z.number().min(0).nullable().optional(),
  volumeMC0: z.number().min(0).nullable().optional(),
  bobotMC0: z.number().min(0).max(100).nullable().optional(),
  weight: z.number().min(0).max(100, 'Bobot maksimal 100%').optional(),
  order: z.number().min(0).optional(),
})

export const CreateActivityScheduleSchema = ActivityScheduleSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).partial({
  planPercentage: true,
  actualPercentage: true,
})

// Export inferred types

export type Report = z.infer<typeof CreateReportSchema> & {
  id: string
  createdAt: Date
  updatedAt: Date
}

export type Activity = z.infer<typeof ActivitySchema>
export type SubActivity = z.infer<typeof SubActivitySchema>
export type ActivitySchedule = z.infer<typeof ActivityScheduleSchema>

// Daily Sub Activity schemas for mobile API
export const DailySubActivitySchema = z.object({
  id: z.any(),
  subActivityId: z.any(),
  userId: z.string(),
  koordinat: z.any().nullable().optional(), // GPS coordinates as JSON
  catatanKegiatan: z.string().nullable().optional(),
  file: z.any().nullable().optional(), // Files array as JSON
  progresRealisasiPerHari: z.number().min(0).max(100).nullable().optional(),
  tanggalProgres: z.string(), // YYYY-MM-DD format
  createdAt: z.any(),
  updatedAt: z.any(),
})

export const CreateDailySubActivitySchema = z.object({
  sub_activities_id: z.string().min(1, 'Sub activity ID is required'),
  user_id: z.string().min(1, 'User ID is required'),
  koordinat: z
    .object({
      latitude: z.number().optional(),
      longitude: z.number().optional(),
    })
    .optional(),
  catatan_kegiatan: z.string().optional(),
  tanggal_progres: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  progres_realisasi_per_hari: z.number().min(0).max(100),
  files: z
    .array(
      z.object({
        file: z.string(),
        path: z.string(),
      })
    )
    .optional(),
})

export const FullProjectSchema = z.object({
  id: z.any(),
  pekerjaan: z.string().nullable(),
  penyediaJasa: z.string().nullable(),
  nilaiKontrak: z.string().nullable(),
  tanggalKontrak: z.string().nullable(),
  akhirKontrak: z.string().nullable(),
  fisikProgress: z.number().nullable(),
  fisikTarget: z.number().nullable(),
  activities: z.array(
    z.object({
      id: z.any(),
      name: z.string(),
      order: z.number(),
      subActivities: z.array(
        z.object({
          id: z.any(),
          name: z.string(),
          satuan: z.string().nullable(),
          volumeKontrak: z.number().nullable(),
          weight: z.number(),
          order: z.number(),
        })
      ),
    })
  ),
})

export type DailySubActivity = z.infer<typeof DailySubActivitySchema>
export type CreateDailySubActivity = z.infer<typeof CreateDailySubActivitySchema>
export type FullProject = z.infer<typeof FullProjectSchema>
export type DashboardWidget = z.infer<typeof DashboardWidgetSchema>
export type FilterOptions = z.infer<typeof FilterOptionsSchema>
export type APIResponse<T = any> = Omit<z.infer<typeof APIResponseSchema>, 'data'> & { data?: T }
export type ChartData = z.infer<typeof ChartDataSchema>
export type User = z.infer<typeof UserSchema>
export type CreateUser = z.infer<typeof CreateUserSchema>
export type UpdateUser = z.infer<typeof UpdateUserSchema>
export type UserQuery = z.infer<typeof UserQuerySchema>
export type UserRole = z.infer<typeof UserRoleSchema>

// Re-export daily sub activities schemas
export * from './schemas/daily-sub-activities'
