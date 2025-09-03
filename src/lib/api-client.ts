import { z } from 'zod'
import {
  ProjectSchema,
  ProjectListItemSchema,
  ProjectListQuerySchema,
  UpdateProjectFieldSchema,
} from '@/lib/schemas'

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || ''

// Response schemas
const ApiSuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any(),
  pagination: z
    .object({
      page: z.number(),
      limit: z.number(),
      total: z.number(),
      totalPages: z.number(),
    })
    .optional(),
})

const ApiErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
})

const ApiResponseSchema = z.union([ApiSuccessResponseSchema, ApiErrorResponseSchema])

// API Client class
export class ApiClient {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${API_BASE_URL}/api${endpoint}`

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Validate response structure
      const validatedResponse = ApiResponseSchema.parse(data)

      if (!validatedResponse.success) {
        throw new Error(validatedResponse.error)
      }

      return validatedResponse.data as T
    } catch (error) {
      if (error instanceof z.ZodError) {
        throw new Error('Invalid API response format')
      }

      if (error instanceof Error) {
        throw error
      }

      throw new Error('Unknown error occurred')
    }
  }

  // Project APIs
  async getProjects(params: Partial<z.infer<typeof ProjectListQuerySchema>> = {}) {
    // Set defaults and validate input parameters
    const defaultParams = { page: 1, limit: 10 }
    const mergedParams = { ...defaultParams, ...params }
    const validatedParams = ProjectListQuerySchema.parse(mergedParams)

    const searchParams = new URLSearchParams({
      page: validatedParams.page.toString(),
      limit: validatedParams.limit.toString(),
      ...(validatedParams.search && { search: validatedParams.search }),
    })

    const response = await this.request<{
      projects: z.infer<typeof ProjectListItemSchema>[]
      pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
      }
    }>(`/projects?${searchParams}`)

    // Validate each project in the response
    const validatedProjects = response.projects.map(project => ProjectListItemSchema.parse(project))

    return {
      projects: validatedProjects,
      pagination: response.pagination,
    }
  }

  async getProject(id: string) {
    if (!id || typeof id !== 'string') {
      throw new Error('Project ID is required and must be a string')
    }

    const project = await this.request<z.infer<typeof ProjectSchema>>(`/projects/${id}`)

    // Validate project data
    return ProjectSchema.parse(project)
  }

  async updateProjectField(data: z.infer<typeof UpdateProjectFieldSchema>) {
    // Validate input data
    const validatedData = UpdateProjectFieldSchema.parse(data)

    return await this.request<{
      projectId: string
      fieldName: string
      oldValue: string | null
      newValue: string
      updatedAt: string
    }>('/projects/update', {
      method: 'POST',
      body: JSON.stringify(validatedData),
    })
  }

  async getProjectForUpdate(projectId: string) {
    if (!projectId || typeof projectId !== 'string') {
      throw new Error('Project ID is required and must be a string')
    }

    const searchParams = new URLSearchParams({ projectId })

    const project = await this.request<z.infer<typeof ProjectSchema>>(
      `/projects/update?${searchParams}`
    )

    // Validate project data
    return ProjectSchema.parse(project)
  }
}

// Export singleton instance
export const apiClient = new ApiClient()

// Export types for use in components
export type ProjectListResponse = Awaited<ReturnType<typeof apiClient.getProjects>>
export type ProjectDetailResponse = Awaited<ReturnType<typeof apiClient.getProject>>
export type UpdateProjectFieldResponse = Awaited<ReturnType<typeof apiClient.updateProjectField>>

// Error handling utilities
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

// Validation utilities
export function validateProjectId(id: unknown): string {
  if (typeof id !== 'string' || !id.trim()) {
    throw new Error('Invalid project ID')
  }
  return id.trim()
}

export function validateSearchQuery(query: unknown): string {
  if (query === null || query === undefined) {
    return ''
  }

  if (typeof query !== 'string') {
    throw new Error('Search query must be a string')
  }

  if (query.length > 255) {
    throw new Error('Search query too long')
  }

  return query.trim()
}
