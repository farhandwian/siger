// src/components/monitoring/activity-images.tsx
'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ImageGallery } from '@/components/ui/image-gallery'
import { useSubActivityImages } from '@/hooks/useSubActivityImages'
import {
  Calendar,
  Filter,
  RefreshCw,
  Image as ImageIcon,
  Grid3X3,
  List,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface ActivityImagesProps {
  subActivityId: string
  subActivityName?: string
  className?: string
  defaultGridColumns?: 2 | 3 | 4 | 5
  showDateFilter?: boolean
  showActivityInfo?: boolean
}

/**
 * Komponen untuk menampilkan gambar-gambar dari daily sub activity
 * dengan fitur filter tanggal dan pagination
 */
export function ActivityImages({
  subActivityId,
  subActivityName,
  className,
  defaultGridColumns = 4,
  showDateFilter = true,
  showActivityInfo = true,
}: ActivityImagesProps) {
  const [dateRange, setDateRange] = useState<{
    startDate: string
    endDate: string
  }>({
    startDate: '',
    endDate: '',
  })

  const [pagination, setPagination] = useState({
    limit: 20,
    offset: 0,
  })

  const [gridColumns, setGridColumns] = useState<2 | 3 | 4 | 5>(defaultGridColumns)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  // Fetch images with current filters
  const {
    data: imagesData,
    isLoading,
    error,
    refetch,
  } = useSubActivityImages({
    subActivityId,
    limit: pagination.limit,
    offset: pagination.offset,
    startDate: dateRange.startDate || undefined,
    endDate: dateRange.endDate || undefined,
  })

  const handleDateRangeChange = (field: 'startDate' | 'endDate', value: string) => {
    setDateRange(prev => ({ ...prev, [field]: value }))
    setPagination(prev => ({ ...prev, offset: 0 })) // Reset to first page
  }

  const clearDateFilter = () => {
    setDateRange({ startDate: '', endDate: '' })
    setPagination(prev => ({ ...prev, offset: 0 }))
  }

  const handleLoadMore = () => {
    setPagination(prev => ({
      ...prev,
      offset: prev.offset + prev.limit,
    }))
  }

  const hasDateFilter = dateRange.startDate || dateRange.endDate

  return (
    <Card className={cn('w-full', className)}>
      <CardHeader className="space-y-4">
        {/* Header with title */}
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <ImageIcon className="h-5 w-5" />
            Activity Images
            {subActivityName && (
              <span className="text-sm font-normal text-muted-foreground">- {subActivityName}</span>
            )}
          </CardTitle>

          <div className="flex items-center gap-2">
            {/* Grid size controls */}
            <div className="flex items-center rounded-md border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridColumns(2)}
                className={cn(
                  'h-8 rounded-none border-none px-2',
                  gridColumns === 2 && 'bg-accent'
                )}
              >
                2
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridColumns(3)}
                className={cn(
                  'h-8 rounded-none border-l border-none px-2',
                  gridColumns === 3 && 'bg-accent'
                )}
              >
                3
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGridColumns(4)}
                className={cn(
                  'h-8 rounded-none border-l border-none px-2',
                  gridColumns === 4 && 'bg-accent'
                )}
              >
                4
              </Button>
            </div>

            {/* Refresh button */}
            <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading}>
              <RefreshCw className={cn('h-4 w-4', isLoading && 'animate-spin')} />
            </Button>
          </div>
        </div>

        {/* Date filter controls */}
        {showDateFilter && (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex flex-1 items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <Input
                type="date"
                placeholder="Start Date"
                value={dateRange.startDate}
                onChange={e => handleDateRangeChange('startDate', e.target.value)}
                className="w-40"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="date"
                placeholder="End Date"
                value={dateRange.endDate}
                onChange={e => handleDateRangeChange('endDate', e.target.value)}
                className="w-40"
              />
            </div>

            {hasDateFilter && (
              <Button variant="outline" size="sm" onClick={clearDateFilter} className="text-xs">
                Clear Filter
              </Button>
            )}
          </div>
        )}

        {/* Stats */}
        {imagesData && (
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <ImageIcon className="h-4 w-4" />
              <span>
                {imagesData.data.reduce((total, activity) => total + activity.images.length, 0)}{' '}
                images
              </span>
            </div>
            <div className="flex items-center gap-1">
              <List className="h-4 w-4" />
              <span>{imagesData.data.length} activities</span>
            </div>
            {hasDateFilter && (
              <div className="flex items-center gap-1">
                <Filter className="h-4 w-4" />
                <span>Filtered</span>
              </div>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Image Gallery */}
        <ImageGallery
          activities={imagesData?.data || []}
          isLoading={isLoading}
          error={error}
          showActivityInfo={showActivityInfo}
          gridColumns={gridColumns}
        />

        {/* Load More Button */}
        {imagesData?.pagination?.hasMore && (
          <div className="mt-6 flex justify-center">
            <Button variant="outline" onClick={handleLoadMore} disabled={isLoading}>
              Load More Images
            </Button>
          </div>
        )}

        {/* Empty state message with filter info */}
        {!isLoading && imagesData?.data.length === 0 && hasDateFilter && (
          <div className="py-8 text-center text-muted-foreground">
            <ImageIcon className="mx-auto mb-4 h-12 w-12 opacity-50" />
            <p className="mb-2">No images found for the selected date range</p>
            <Button variant="outline" size="sm" onClick={clearDateFilter}>
              Clear Filter to See All Images
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Simplified version for embedding in other components
 */
interface CompactActivityImagesProps {
  subActivityId: string
  maxImages?: number
  className?: string
}

export function CompactActivityImages({
  subActivityId,
  maxImages = 6,
  className,
}: CompactActivityImagesProps) {
  const { data: imagesData, isLoading } = useSubActivityImages({
    subActivityId,
    limit: maxImages,
    offset: 0,
  })

  if (isLoading) {
    return (
      <div className={cn('grid grid-cols-3 gap-2', className)}>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="aspect-square animate-pulse rounded-md bg-gray-200" />
        ))}
      </div>
    )
  }

  const totalImages =
    imagesData?.data.reduce((total, activity) => total + activity.images.length, 0) || 0

  if (totalImages === 0) {
    return (
      <div className={cn('py-4 text-center text-muted-foreground', className)}>
        <ImageIcon className="mx-auto mb-2 h-8 w-8 opacity-50" />
        <p className="text-sm">No images</p>
      </div>
    )
  }

  return (
    <div className={className}>
      <ImageGallery activities={imagesData?.data || []} showActivityInfo={false} gridColumns={3} />
      {totalImages > maxImages && (
        <p className="mt-2 text-center text-xs text-muted-foreground">
          +{totalImages - maxImages} more images
        </p>
      )}
    </div>
  )
}
