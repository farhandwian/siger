'use client'

import { useState, useEffect } from 'react'

interface ProjectData {
  id: string
  title: string
  location: string
  budget: string
  status: 'on-track' | 'at-risk' | 'delayed'
  progress: number
  deviation: number
  target: number
}

interface ProjectsResponse {
  success: boolean
  data: ProjectData[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}

interface UseProjectsOptions {
  page?: number
  limit?: number
  search?: string
}

export function useProjects(options: UseProjectsOptions = {}) {
  const { page = 1, limit = 10, search = '' } = options
  const [projects, setProjects] = useState<ProjectData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  })

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        setLoading(true)
        setError(null)

        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
          ...(search && { search }),
        })

        const response = await fetch(`/api/projects?${params}`)

        if (!response.ok) {
          throw new Error('Failed to fetch projects')
        }

        const result: ProjectsResponse = await response.json()

        if (result.success) {
          setProjects(result.data)
          setPagination(result.pagination)
        } else {
          throw new Error('Failed to fetch projects')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchProjects()
  }, [page, limit, search])

  return {
    projects,
    loading,
    error,
    pagination,
    refetch: () => {
      setLoading(true)
      // Re-trigger useEffect by updating a dependency
    },
  }
}
