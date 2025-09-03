// Global type definitions for SIGER application

export interface User {
  id: string
  name: string
  email: string
  role: 'admin' | 'operator' | 'viewer'
  department?: string
  createdAt: Date
  updatedAt: Date
}

export interface Report {
  id: string
  title: string
  description: string
  type: 'dashboard' | 'analytics' | 'geographic' | 'custom'
  data: any
  metadata: ReportMetadata
  createdBy: string
  createdAt: Date
  updatedAt: Date
}

export interface ReportMetadata {
  source: string
  period: {
    start: Date
    end: Date
  }
  tags: string[]
  visibility: 'public' | 'internal' | 'restricted'
}

export interface DashboardWidget {
  id: string
  type: 'chart' | 'map' | 'metric' | 'table'
  title: string
  config: any
  position: {
    x: number
    y: number
    width: number
    height: number
  }
}

export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export interface MapData {
  type: 'FeatureCollection'
  features: GeoJSON.Feature[]
}

export interface APIResponse<T = any> {
  success: boolean
  data?: T
  message?: string
  errors?: string[]
  pagination?: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

export interface FilterOptions {
  dateRange?: {
    start: Date
    end: Date
  }
  department?: string[]
  region?: string[]
  category?: string[]
  status?: string[]
}

// Zod schema types will be inferred from these interfaces
export type CreateUserInput = Omit<User, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateUserInput = Partial<CreateUserInput>
export type CreateReportInput = Omit<Report, 'id' | 'createdAt' | 'updatedAt'>
export type UpdateReportInput = Partial<CreateReportInput>
