import { z } from 'zod'

// Base schemas for individual models
export const KategoriKebutuhanSchema = z.object({
  id: z.string(),
  nama: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const KebutuhanSchema = z.object({
  id: z.string(),
  kategoriKebutuhanId: z.string(),
  nama: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const AnalisaKebutuhanSchema = z.object({
  id: z.string(),
  subActivityId: z.string(),
  kebutuhanId: z.string(),
  koefisien: z.number(),
  hasil: z.number().nullable().default(0),
  satuanHasil: z.string().nullable(),
  hasilAnalisaKebutuhan: z.number().nullable().default(0),
  satuanHasilAnalisaKebutuhan: z.string().nullable(),
  stokHarian: z.number().nullable().default(0),
  terpasang: z.number().nullable().default(0),
  totalSisaStokHariIni: z.number().nullable().default(0),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// Extended schemas with relations for API responses
export const KebutuhanWithKategoriSchema = KebutuhanSchema.extend({
  kategoriKebutuhan: KategoriKebutuhanSchema,
})

export const AnalisaKebutuhanWithRelationsSchema = AnalisaKebutuhanSchema.extend({
  kebutuhan: KebutuhanWithKategoriSchema,
  subActivity: z.object({
    id: z.string(),
    name: z.string(),
  }),
})

// API request schemas for validation
export const CreateAnalisaKebutuhanSchema = z.object({
  subActivityId: z.string().min(1, 'Sub activity ID is required'),
  kebutuhanId: z.string().min(1, 'Kebutuhan ID is required'),
  koefisien: z.number().min(0, 'Koefisien must be non-negative'),
  hasil: z.number().min(0, 'Hasil must be non-negative').default(0),
  satuanHasil: z.string().optional(),
  hasilAnalisaKebutuhan: z
    .number()
    .min(0, 'Hasil analisa kebutuhan must be non-negative')
    .default(0),
  satuanHasilAnalisaKebutuhan: z.string().optional(),
  stokHarian: z.number().min(0, 'Stok harian must be non-negative').default(0),
  terpasang: z.number().min(0, 'Terpasang must be non-negative').default(0),
  totalSisaStokHariIni: z.number().min(0, 'Total sisa stok must be non-negative').default(0),
})

export const UpdateAnalisaKebutuhanSchema = CreateAnalisaKebutuhanSchema.partial().extend({
  id: z.string().min(1, 'ID is required for updates'),
})

// Query parameter schemas for API endpoints
export const AnalisaKebutuhanQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  subActivityId: z.string().optional(),
  kategoriId: z.string().optional(),
  search: z.string().optional(),
})

// API response schemas
export const AnalisaKebutuhanListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(AnalisaKebutuhanWithRelationsSchema),
  pagination: z.object({
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  }),
})

export const AnalisaKebutuhanDetailResponseSchema = z.object({
  success: z.literal(true),
  data: AnalisaKebutuhanWithRelationsSchema,
})

export const KategoriKebutuhanListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(KategoriKebutuhanSchema),
})

export const KebutuhanListResponseSchema = z.object({
  success: z.literal(true),
  data: z.array(KebutuhanWithKategoriSchema),
})

// Error response schema
export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.any().optional(),
})

// Generic API response schema
export const ApiResponseSchema = z.union([
  AnalisaKebutuhanListResponseSchema,
  AnalisaKebutuhanDetailResponseSchema,
  KategoriKebutuhanListResponseSchema,
  KebutuhanListResponseSchema,
  ErrorResponseSchema,
])

// Type exports for TypeScript
export type KategoriKebutuhan = z.infer<typeof KategoriKebutuhanSchema>
export type Kebutuhan = z.infer<typeof KebutuhanSchema>
export type KebutuhanWithKategori = z.infer<typeof KebutuhanWithKategoriSchema>
export type AnalisaKebutuhan = z.infer<typeof AnalisaKebutuhanSchema>
export type AnalisaKebutuhanWithRelations = z.infer<typeof AnalisaKebutuhanWithRelationsSchema>
export type CreateAnalisaKebutuhanRequest = z.infer<typeof CreateAnalisaKebutuhanSchema>
export type UpdateAnalisaKebutuhanRequest = z.infer<typeof UpdateAnalisaKebutuhanSchema>
export type AnalisaKebutuhanQuery = z.infer<typeof AnalisaKebutuhanQuerySchema>
export type AnalisaKebutuhanListResponse = z.infer<typeof AnalisaKebutuhanListResponseSchema>
export type AnalisaKebutuhanDetailResponse = z.infer<typeof AnalisaKebutuhanDetailResponseSchema>
export type KategoriKebutuhanListResponse = z.infer<typeof KategoriKebutuhanListResponseSchema>
export type KebutuhanListResponse = z.infer<typeof KebutuhanListResponseSchema>
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>

// Form schemas for frontend validation
export const AnalisaKebutuhanFormSchema = z.object({
  kebutuhanId: z.string().min(1, 'Pilih kebutuhan terlebih dahulu'),
  koefisien: z.coerce.number().min(0, 'Koefisien harus lebih dari atau sama dengan 0'),
  stokHarian: z.coerce.number().min(0, 'Stok harian harus lebih dari atau sama dengan 0'),
  terpasang: z.coerce.number().min(0, 'Terpasang harus lebih dari atau sama dengan 0'),
  totalSisaStokHariIni: z.coerce
    .number()
    .min(0, 'Total sisa stok harus lebih dari atau sama dengan 0'),
})

export type AnalisaKebutuhanFormData = z.infer<typeof AnalisaKebutuhanFormSchema>

// Filter form schema for the table
export const AnalisaKebutuhanFilterSchema = z.object({
  kategoriId: z.string().optional(),
  search: z.string().optional(),
})

export type AnalisaKebutuhanFilterData = z.infer<typeof AnalisaKebutuhanFilterSchema>
