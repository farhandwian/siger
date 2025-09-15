'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, ChevronDown } from 'lucide-react'
import { useProjectOptions } from '@/hooks/useReports'
import { ReportQuery } from '@/lib/schemas/reports'

interface ReportFiltersProps {
  filters: Partial<ReportQuery>
  onFilterChange: (filters: Partial<ReportQuery>) => void
}

/**
 * Filter components for the Reports page
 * Contains search input and dropdown filters for project and period
 */
export function ReportFilters({ filters, onFilterChange }: ReportFiltersProps) {
  const { data: projectOptions, isLoading: isLoadingProjects } = useProjectOptions()

  // Handle search input change with debouncing
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value
    onFilterChange({ search: value })
  }

  // Handle project selection
  const handleProjectChange = (value: string) => {
    onFilterChange({ projectId: value === 'all' ? '' : value })
  }

  // Handle period selection (for now, just a placeholder)
  const handlePeriodChange = (value: string) => {
    // TODO: Implement period filtering logic
    console.log('Period changed:', value)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-start">
        {/* Search Input */}
        <div className="flex-1 min-w-0">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Search..."
              value={filters.search || ''}
              onChange={handleSearchChange}
              className="pl-9 rounded-lg border-gray-200 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Filter Dropdowns */}
        <div className="flex gap-2 shrink-0">
          {/* Project Filter */}
          <div className="w-[219px]">
            <Select
              value={filters.projectId || 'all'}
              onValueChange={handleProjectChange}
              disabled={isLoadingProjects}
            >
              <SelectTrigger className="rounded-lg border-gray-200 shadow-sm">
                <SelectValue placeholder="Pilih Proyek" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Proyek</SelectItem>
                {projectOptions?.data?.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    <div className="flex flex-col">
                      <span className="font-medium">{project.name}</span>
                      {project.location && (
                        <span className="text-xs text-gray-500">{project.location}</span>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Period Filter */}
          <div className="w-auto">
            <Select onValueChange={handlePeriodChange}>
              <SelectTrigger className="rounded-lg border-gray-200 shadow-sm">
                <SelectValue placeholder="Periode Proyek" />
                <ChevronDown className="h-4 w-4 opacity-50" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Bulan Ini</SelectItem>
                <SelectItem value="last-month">Bulan Lalu</SelectItem>
                <SelectItem value="current-quarter">Kuartal Ini</SelectItem>
                <SelectItem value="last-quarter">Kuartal Lalu</SelectItem>
                <SelectItem value="current-year">Tahun Ini</SelectItem>
                <SelectItem value="last-year">Tahun Lalu</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
    </div>
  )
}