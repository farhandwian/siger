// src/components/ui/image-gallery.tsx
'use client'

import { useState } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import {
  X,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Download,
  ChevronLeft,
  ChevronRight,
  Calendar,
  User,
  FileImage,
  Grid3X3,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { ActivityImage, ActivityWithImages } from '@/hooks/useSubActivityImages'

interface ImageGalleryProps {
  activities: ActivityWithImages[]
  isLoading?: boolean
  error?: Error | null
  className?: string
  showActivityInfo?: boolean
  gridColumns?: 2 | 3 | 4 | 5
}

interface ImagePreviewModalProps {
  images: ActivityImage[]
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
}

/**
 * Modal untuk preview gambar dengan navigasi
 */
function ImagePreviewModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(1)
  const [rotation, setRotation] = useState(0)

  if (!isOpen || !images[currentIndex]) return null

  const currentImage = images[currentIndex]
  const canGoPrevious = currentIndex > 0
  const canGoNext = currentIndex < images.length - 1

  const handleDownload = async () => {
    if (!currentImage.url) return

    try {
      const response = await fetch(currentImage.url)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)

      const link = document.createElement('a')
      link.href = url
      link.download = currentImage.fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)

      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download failed:', error)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      {/* Header Controls */}
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="border-white/20 bg-black/50 text-white">
            {currentIndex + 1} / {images.length}
          </Badge>
          <Badge variant="secondary" className="border-white/20 bg-black/50 text-white">
            {currentImage.fileName}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            className="bg-black/50 text-white hover:bg-black/70"
            disabled={zoom <= 0.5}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            className="bg-black/50 text-white hover:bg-black/70"
            disabled={zoom >= 3}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => setRotation((rotation + 90) % 360)}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <RotateCw className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleDownload}
            className="bg-black/50 text-white hover:bg-black/70"
            disabled={!currentImage.url}
          >
            <Download className="h-4 w-4" />
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="bg-black/50 text-white hover:bg-black/70"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {canGoPrevious && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onPrevious}
          className="absolute left-4 top-1/2 h-12 w-12 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>
      )}

      {canGoNext && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onNext}
          className="absolute right-4 top-1/2 h-12 w-12 -translate-y-1/2 bg-black/50 text-white hover:bg-black/70"
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      )}

      {/* Image Container */}
      <div className="relative flex max-h-[90vh] max-w-[90vw] items-center justify-center">
        {currentImage.url ? (
          <img
            src={currentImage.url}
            alt={currentImage.fileName}
            className="max-h-full max-w-full object-contain"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transition: 'transform 0.2s ease-in-out',
            }}
            onDoubleClick={() => setZoom(zoom === 1 ? 2 : 1)}
          />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center rounded-lg bg-gray-200">
            <FileImage className="h-12 w-12 text-gray-400" />
            <p className="ml-2 text-gray-500">Image not available</p>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="rounded-lg bg-black/50 px-4 py-2 text-sm text-white">
          Uploaded: {new Date(currentImage.uploadedAt).toLocaleDateString()}
          {' • '}
          Double-click to zoom
        </div>
      </div>
    </div>
  )
}

/**
 * Grid item untuk menampilkan gambar thumbnail
 */
interface ImageGridItemProps {
  image: ActivityImage
  activity: ActivityWithImages
  onImageClick: () => void
  showActivityInfo?: boolean
}

function ImageGridItem({ image, activity, onImageClick, showActivityInfo }: ImageGridItemProps) {
  return (
    <Card className="group cursor-pointer overflow-hidden transition-all hover:shadow-lg">
      <CardContent className="p-0">
        <div className="relative aspect-square">
          {image.url ? (
            <Image
              src={image.url}
              alt={image.fileName}
              fill
              className="object-cover transition-transform group-hover:scale-105"
              onClick={onImageClick}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center bg-gray-100"
              onClick={onImageClick}
            >
              <FileImage className="h-8 w-8 text-gray-400" />
            </div>
          )}

          {/* Overlay with image info */}
          <div className="absolute inset-0 flex items-end bg-black/0 transition-colors group-hover:bg-black/50">
            <div className="w-full p-2 text-white opacity-0 transition-opacity group-hover:opacity-100">
              <p className="truncate text-xs font-medium">{image.fileName}</p>
              <p className="text-xs opacity-75">
                {new Date(image.uploadedAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>

        {/* Activity info (if enabled) */}
        {showActivityInfo && (
          <div className="space-y-2 p-3">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>{activity.date}</span>
            </div>

            {activity.userName && (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <User className="h-3 w-3" />
                <span>{activity.userName}</span>
              </div>
            )}

            {activity.catatanKegiatan && (
              <p className="line-clamp-2 text-xs text-muted-foreground">
                {activity.catatanKegiatan}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

/**
 * Main Image Gallery Component
 */
export function ImageGallery({
  activities,
  isLoading = false,
  error = null,
  className,
  showActivityInfo = false,
  gridColumns = 4,
}: ImageGalleryProps) {
  const [previewModal, setPreviewModal] = useState<{
    isOpen: boolean
    currentIndex: number
    images: ActivityImage[]
  }>({
    isOpen: false,
    currentIndex: 0,
    images: [],
  })

  // Flatten all images from activities
  const allImages: ActivityImage[] = []
  const imageToActivityMap = new Map<ActivityImage, ActivityWithImages>()

  activities.forEach(activity => {
    activity.images.forEach(image => {
      allImages.push(image)
      imageToActivityMap.set(image, activity)
    })
  })

  const handleImageClick = (image: ActivityImage) => {
    const imageIndex = allImages.indexOf(image)
    setPreviewModal({
      isOpen: true,
      currentIndex: imageIndex,
      images: allImages,
    })
  }

  const handleClosePreview = () => {
    setPreviewModal(prev => ({ ...prev, isOpen: false }))
  }

  const handlePreviousImage = () => {
    setPreviewModal(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }))
  }

  const handleNextImage = () => {
    setPreviewModal(prev => ({
      ...prev,
      currentIndex: Math.min(prev.images.length - 1, prev.currentIndex + 1),
    }))
  }

  // Loading state
  if (isLoading) {
    return (
      <div className={cn('space-y-4', className)}>
        <div className="mb-4 flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Loading images...</span>
        </div>
        <div
          className={cn(
            'grid gap-4',
            gridColumns === 2 && 'grid-cols-2',
            gridColumns === 3 && 'grid-cols-2 md:grid-cols-3',
            gridColumns === 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
            gridColumns === 5 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
          )}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className="p-0">
                <Skeleton className="aspect-square" />
                {showActivityInfo && (
                  <div className="space-y-2 p-3">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <FileImage className="h-4 w-4" />
          <AlertDescription>Failed to load images: {error.message}</AlertDescription>
        </Alert>
      </div>
    )
  }

  // Empty state
  if (allImages.length === 0) {
    return (
      <div className={cn('py-12 text-center', className)}>
        <FileImage className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
        <p className="text-muted-foreground">No images found</p>
      </div>
    )
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Grid3X3 className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">
            {allImages.length} image{allImages.length !== 1 ? 's' : ''}
            {activities.length > 1 && ` from ${activities.length} activities`}
          </span>
        </div>
      </div>

      {/* Image Grid */}
      <div
        className={cn(
          'grid gap-4',
          gridColumns === 2 && 'grid-cols-2',
          gridColumns === 3 && 'grid-cols-2 md:grid-cols-3',
          gridColumns === 4 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
          gridColumns === 5 && 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5'
        )}
      >
        {allImages.map((image, index) => {
          const activity = imageToActivityMap.get(image)!
          return (
            <ImageGridItem
              key={`${activity.id}-${image.fileName}-${index}`}
              image={image}
              activity={activity}
              onImageClick={() => handleImageClick(image)}
              showActivityInfo={showActivityInfo}
            />
          )
        })}
      </div>

      {/* Preview Modal */}
      <ImagePreviewModal
        images={previewModal.images}
        currentIndex={previewModal.currentIndex}
        isOpen={previewModal.isOpen}
        onClose={handleClosePreview}
        onPrevious={handlePreviousImage}
        onNext={handleNextImage}
      />
    </div>
  )
}
