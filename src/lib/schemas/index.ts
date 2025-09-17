// Re-export all schemas for easier importing
export * from './addendum'
export * from './daily-sub-activities'
export * from './image-upload'
export * from './schedule'
export * from './usulan'

// Explicit exports for modules with conflicts
export * from './projects-list'

// Explicit exports from analisa-kebutuhan (excluding conflicts)
export {
  KategoriKebutuhanSchema,
  KebutuhanSchema,
  AnalisaKebutuhanSchema,
  KebutuhanWithKategoriSchema,
  AnalisaKebutuhanWithRelationsSchema,
  CreateAnalisaKebutuhanSchema,
  UpdateAnalisaKebutuhanSchema,
  AnalisaKebutuhanQuerySchema,
  AnalisaKebutuhanListResponseSchema,
  AnalisaKebutuhanDetailResponseSchema,
  KategoriKebutuhanListResponseSchema,
  KebutuhanListResponseSchema,
  ApiResponseSchema,
  AnalisaKebutuhanFormSchema,
  AnalisaKebutuhanFilterSchema
} from './analisa-kebutuhan'

export type {
  KategoriKebutuhan,
  Kebutuhan,
  KebutuhanWithKategori,
  AnalisaKebutuhan,
  AnalisaKebutuhanWithRelations,
  CreateAnalisaKebutuhanRequest,
  UpdateAnalisaKebutuhanRequest,
  AnalisaKebutuhanQuery,
  AnalisaKebutuhanListResponse,
  AnalisaKebutuhanDetailResponse,
  KategoriKebutuhanListResponse,
  KebutuhanListResponse,
  AnalisaKebutuhanFormData,
  AnalisaKebutuhanFilterData
} from './analisa-kebutuhan'

// Explicit exports from reports (excluding conflicts)
export {
  WeeklyReportSchema,
  WeeklyReportsResponseSchema,
  ReportQuerySchema,
  CreateWeeklyReportSchema,
  UpdateWeeklyReportSchema,
  ProjectOptionSchema,
  ProjectOptionsResponseSchema
} from './reports'

export type {
  WeeklyReport,
  WeeklyReportsResponse,
  ReportQuery,
  CreateWeeklyReport,
  UpdateWeeklyReport,
  ProjectOption,
  ProjectOptionsResponse
} from './reports'

// Alias conflicting exports
export { ProjectProgressItemSchema as ProjectListItemSchema } from './projects-list'

// Resolve conflicts by explicitly re-exporting with aliases
export {
  ErrorResponseSchema as AnalisaKebutuhanErrorResponseSchema
} from './analisa-kebutuhan'

export type {
  ErrorResponse as AnalisaKebutuhanErrorResponse
} from './analisa-kebutuhan'

export {
  ErrorResponseSchema as ReportsErrorResponseSchema
} from './reports'

export type {
  ErrorResponse as ReportsErrorResponse
} from './reports'

export {
  PaginationSchema as ReportsPaginationSchema
} from './reports'

export type {
  Pagination as ReportsPagination
} from './reports'

export {
  PaginationSchema as ProjectsListPaginationSchema
} from './projects-list'

export type {
  PaginationData as ProjectsListPagination
} from './projects-list'
