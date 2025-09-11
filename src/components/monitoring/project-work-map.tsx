'use client'

import { useState, useMemo } from 'react'
import * as React from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MapPin, Loader2, Eye, Image as ImageIcon } from 'lucide-react'
import { GOOGLE_MAPS_OPTIONS, PROJECT_WORK_MAP_OPTIONS } from '@/constants/map-config'
import { ProjectAreaBaseLayer } from './project-area-base-layer'
import {
  useLatestDailySubActivities,
  LatestDailySubActivity,
} from '@/hooks/useLatestDailySubActivities'
import { useSubActivityImages } from '@/hooks/useSubActivityImages'

interface WorkLocation {
  id: string
  name: string
  description: string
  progress: number
  lastUpdate: string
  lastUpdateDate: string
  tanggalProgress: string
  position: { lat: number; lng: number }
  projectName?: string
  userName?: string
  activityName?: string
  photos?: { path: string; filename?: string }[]
  subActivityId: string // Add sub activity ID for fetching images
}

interface ProjectWorkMapProps {
  projectId: string
}

export function ProjectWorkMap({ projectId }: ProjectWorkMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null)
  const [imagePreview, setImagePreview] = useState<{
    isOpen: boolean
    images: Array<{ fileName: string; filePath: string; url?: string; uploadedAt: string }>
    currentIndex: number
  }>({
    isOpen: false,
    images: [],
    currentIndex: 0,
  })

  // Fetch latest daily sub activities from API
  const {
    data: apiResponse,
    isLoading,
    isError,
    error,
  } = useLatestDailySubActivities({
    projectId: projectId,
    limit: 100,
  })

  // Fetch images for selected location
  const { data: imagesData } = useSubActivityImages({
    subActivityId: selectedLocation?.subActivityId || '',
    limit: 50,
    enabled: !!selectedLocation?.subActivityId,
  })

  // Handle image click to open preview
  const handleImageClick = () => {
    if (!imagesData?.data) return

    // Flatten all images from all activities
    const allImages: Array<{
      fileName: string
      filePath: string
      url?: string
      uploadedAt: string
    }> = []
    imagesData.data.forEach(activity => {
      allImages.push(...activity.images)
    })

    if (allImages.length > 0) {
      setImagePreview({
        isOpen: true,
        images: allImages,
        currentIndex: 0,
      })
    }
  }

  const handleClosePreview = () => {
    setImagePreview(prev => ({ ...prev, isOpen: false }))
  }

  const handlePreviousImage = () => {
    setImagePreview(prev => ({
      ...prev,
      currentIndex: Math.max(0, prev.currentIndex - 1),
    }))
  }

  const handleNextImage = () => {
    setImagePreview(prev => ({
      ...prev,
      currentIndex: Math.min(prev.images.length - 1, prev.currentIndex + 1),
    }))
  }

  // Transform API data to WorkLocation format
  const workLocations: WorkLocation[] = useMemo(() => {
    if (!apiResponse?.data) return []

    return apiResponse.data
      .filter(activity => activity.koordinat) // Only include items with coordinates
      .map(activity => {
        // Calculate days since last update
        const lastUpdateDate = new Date(activity.tanggalProgres)
        const now = new Date()
        const daysDiff = Math.floor(
          (now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24)
        )
        const lastUpdateText =
          daysDiff === 0 ? 'Hari ini' : daysDiff === 1 ? '1 Hari Lalu' : `${daysDiff} Hari Lalu`

        // Format full date
        const fullDate = lastUpdateDate.toLocaleDateString('id-ID', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })

        const progress = activity.progresRealisasiPerHari || 0

        return {
          id: activity.id,
          name: activity.subActivity.name,
          description:
            activity.catatanKegiatan ||
            `Pekerjaan ${activity.subActivity.name} - ${activity.subActivity.activity.name}`,
          progress: progress,
          lastUpdate: lastUpdateText,
          lastUpdateDate: fullDate,
          position: {
            lat: activity.koordinat!.latitude,
            lng: activity.koordinat!.longitude,
          },
          projectName: activity.subActivity.activity.project.pekerjaan,
          userName: activity.user.name,
          activityName: activity.subActivity.activity.name,
          photos: activity.file || [],
          tanggalProgress: activity.tanggalProgres,
          subActivityId: activity.subActivityId, // Add sub activity ID
        }
      })
  }, [apiResponse?.data])

  // Loading state
  if (isLoading) {
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl bg-gray-100">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Memuat peta lokasi kerja...</h3>
            <p className="mt-1 text-sm text-gray-500">Mengambil data aktivitas terbaru</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError) {
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl bg-gray-100">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Gagal memuat peta</h3>
            <p className="mt-1 text-sm text-gray-500">
              {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // If no Google Maps API key is available, show fallback
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl bg-gray-100">
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Map not available</h3>
            <p className="mt-1 text-sm text-gray-500">Google Maps API key required</p>
          </div>
        </div>
        {/* Work locations list when map is not available */}
        <div className="absolute left-4 top-4 z-10 max-h-96 w-80 overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Lokasi Pekerjaan ({workLocations.length})
          </h4>
          <div className="space-y-3">
            {workLocations.length === 0 ? (
              <p className="text-xs text-gray-500">Tidak ada data lokasi pekerjaan</p>
            ) : (
              workLocations.map(location => (
                <div key={location.id} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-blue-500" />
                    <div className="flex-1 space-y-1">
                      <h5 className="line-clamp-2 text-xs font-medium text-gray-900">
                        {location.name}
                      </h5>
                      <p className="line-clamp-2 text-xs text-gray-600">{location.description}</p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Progress: {location.progress.toFixed(1)}%
                        </span>
                      </div>
                      {location.activityName && (
                        <p className="text-xs text-gray-500">Pekerjaan: {location.activityName}</p>
                      )}
                      <div className="mt-2 border-t border-gray-100 pt-1">
                        <div className="flex items-center gap-1 text-xs">
                          <div className="h-1.5 w-1.5 rounded-full bg-blue-500"></div>
                          <span className="font-medium text-blue-600">{location.lastUpdate}</span>
                        </div>
                        <p className="text-xs text-gray-400">{location.lastUpdateDate}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!}>
      <div className="relative h-[600px] w-full overflow-hidden rounded-2xl">
        <Map
          className="h-full w-full"
          {...GOOGLE_MAPS_OPTIONS}
          defaultCenter={{
            lat: PROJECT_WORK_MAP_OPTIONS.lat,
            lng: PROJECT_WORK_MAP_OPTIONS.lng,
          }}
          defaultZoom={PROJECT_WORK_MAP_OPTIONS.zoom}
          mapTypeId="satellite"
        >
          {/* Project Area Base Layer */}
          <ProjectAreaBaseLayer />

          {/* Work Location Markers */}
          {workLocations.map(location => (
            <Marker
              key={location.id}
              position={location.position}
              onClick={() => setSelectedLocation(location)}
            />
          ))}

          {/* Info Window for selected location */}
          {selectedLocation && (
            <InfoWindow
              position={selectedLocation.position}
              onCloseClick={() => setSelectedLocation(null)}
            >
              <div className="m-0 w-80 bg-transparent p-0">
                <div className="flex gap-3 rounded-lg bg-white p-4 shadow-lg">
                  {/* Work Image or Icon */}
                  {imagesData?.data &&
                  imagesData.data.length > 0 &&
                  imagesData.data[0].images.length > 0 ? (
                    <div
                      className="group relative h-16 w-16 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg transition-all hover:shadow-lg"
                      onClick={handleImageClick}
                      title="Click to view all images"
                    >
                      <img
                        src={imagesData.data[0].images[0].url || '/placeholder.jpg'}
                        alt="Progress"
                        className="h-full w-full object-cover transition-transform group-hover:scale-110"
                        onError={e => {
                          // Fallback to icon if image fails to load
                          const target = e.target as HTMLImageElement
                          target.style.display = 'none'
                          target.nextElementSibling?.classList.remove('hidden')
                        }}
                      />
                      <div className="hidden h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                        <div className="flex h-full w-full items-center justify-center">
                          <div className="text-sm font-bold text-white">
                            {selectedLocation.name.split(' ')[0].charAt(0)}
                          </div>
                        </div>
                      </div>
                      {/* Overlay with eye icon and image count */}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/50">
                        <div className="opacity-0 transition-opacity group-hover:opacity-100">
                          <Eye className="h-5 w-5 text-white" />
                        </div>
                      </div>
                      {/* Image count badge */}
                      {imagesData.data.reduce(
                        (total, activity) => total + activity.images.length,
                        0
                      ) > 1 && (
                        <div className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                          {imagesData.data.reduce(
                            (total, activity) => total + activity.images.length,
                            0
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                      <div className="flex h-full w-full items-center justify-center">
                        <div className="text-sm font-bold text-white">
                          {selectedLocation.name.split(' ')[0].charAt(0)}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-[#364878]">
                      {selectedLocation.name}
                    </h3>
                    <p className="line-clamp-3 text-xs leading-tight text-gray-700">
                      {selectedLocation.description}
                    </p>
                    {/* {selectedLocation.userName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Pekerja:</span> {selectedLocation.userName}
                      </p>
                    )} */}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedLocation.progress.toFixed(2)}%
                      </span>
                    </div>
                    {imagesData?.data &&
                      imagesData.data.length > 0 &&
                      imagesData.data[0].images.length > 0 && (
                        <div className="flex items-center gap-1 text-xs text-blue-600">
                          <Eye className="h-3 w-3" />
                          <span>
                            {imagesData.data.reduce(
                              (total, activity) => total + activity.images.length,
                              0
                            )}{' '}
                            foto - Klik untuk lihat
                          </span>
                        </div>
                      )}
                    {selectedLocation.activityName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Pekerjaan:</span>{' '}
                        {selectedLocation.activityName}
                      </p>
                    )}

                    {selectedLocation.projectName && (
                      <p className="line-clamp-2 text-xs text-gray-500">
                        <span className="font-medium">Proyek:</span> {selectedLocation.projectName}
                      </p>
                    )}

                    {/* Update section with distinct styling */}
                    <div className="mt-3 border-t border-gray-200 pt-2">
                      <div className="flex items-center gap-1 text-xs">
                        <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                        <span className="font-medium text-blue-600">
                          Update {selectedLocation.lastUpdate}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        {selectedLocation.lastUpdateDate}
                      </p>
                      {/* <p className="mt-0.5 text-xs text-gray-400">
                        Tanggal Progress:{' '}
                        {new Date(selectedLocation.tanggalProgress).toLocaleDateString('id-ID')}
                      </p> */}
                    </div>
                  </div>
                </div>
              </div>
            </InfoWindow>
          )}
        </Map>

        {/* Map Legend */}
        {/* <div className="absolute left-4 top-4 z-10 rounded-lg bg-white p-3 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Status Pekerjaan</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-gray-700">Selesai</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full bg-yellow-400" />
              <span className="text-gray-700">Sedang Berjalan</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <span className="text-gray-700">Belum Dimulai</span>
            </div>
          </div>
        </div> */}
      </div>

      {/* Image Preview Modal */}
      {imagePreview.isOpen && imagePreview.images.length > 0 && (
        <ImagePreviewModal
          images={imagePreview.images}
          currentIndex={imagePreview.currentIndex}
          isOpen={imagePreview.isOpen}
          onClose={handleClosePreview}
          onPrevious={handlePreviousImage}
          onNext={handleNextImage}
          locationName={selectedLocation?.name}
        />
      )}
    </APIProvider>
  )
}

/**
 * Modal component for image preview
 */
interface ImagePreviewModalProps {
  images: Array<{ fileName: string; filePath: string; url?: string; uploadedAt: string }>
  currentIndex: number
  isOpen: boolean
  onClose: () => void
  onPrevious: () => void
  onNext: () => void
  locationName?: string
}

function ImagePreviewModal({
  images,
  currentIndex,
  isOpen,
  onClose,
  onPrevious,
  onNext,
  locationName,
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

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') onClose()
    if (e.key === 'ArrowLeft' && canGoPrevious) onPrevious()
    if (e.key === 'ArrowRight' && canGoNext) onNext()
  }

  // Add event listener for keyboard navigation
  React.useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [currentIndex, canGoPrevious, canGoNext])

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm">
      {/* Header Controls */}
      <div className="absolute left-4 right-4 top-4 z-10 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="rounded-full bg-black/70 px-3 py-1 text-sm font-medium text-white">
            {currentIndex + 1} / {images.length}
          </div>
          {locationName && (
            <div className="rounded-full bg-black/70 px-3 py-1 text-sm text-white">
              {locationName}
            </div>
          )}
          <div className="rounded-full bg-black/70 px-3 py-1 text-xs text-white">
            {currentImage.fileName}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.25))}
            disabled={zoom <= 0.5}
            className="rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/90 disabled:opacity-50"
            title="Zoom Out"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H9"
              />
            </svg>
          </button>

          <button
            onClick={() => setZoom(Math.min(3, zoom + 0.25))}
            disabled={zoom >= 3}
            className="rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/90 disabled:opacity-50"
            title="Zoom In"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM15 10l-3 3m0 0l-3-3m3 3V8"
              />
            </svg>
          </button>

          <button
            onClick={() => setRotation((rotation + 90) % 360)}
            className="rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/90"
            title="Rotate"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>

          <button
            onClick={handleDownload}
            disabled={!currentImage.url}
            className="rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/90 disabled:opacity-50"
            title="Download"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>

          <button
            onClick={onClose}
            className="rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black/90"
            title="Close"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Navigation Buttons */}
      {canGoPrevious && (
        <button
          onClick={onPrevious}
          className="absolute left-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white transition-colors hover:bg-black/90"
          title="Previous Image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      )}

      {canGoNext && (
        <button
          onClick={onNext}
          className="absolute right-4 top-1/2 z-10 -translate-y-1/2 rounded-full bg-black/70 p-3 text-white transition-colors hover:bg-black/90"
          title="Next Image"
        >
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* Image Container */}
      <div
        className="relative flex max-h-[95vh] max-w-[95vw] cursor-pointer items-center justify-center"
        onClick={onClose}
      >
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
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <div className="flex h-64 w-96 items-center justify-center rounded-lg bg-gray-200">
            <ImageIcon className="h-12 w-12 text-gray-400" />
            <p className="ml-2 text-gray-500">Image not available</p>
          </div>
        )}
      </div>

      {/* Bottom Info */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-center">
        <div className="rounded-lg bg-black/70 px-4 py-2 text-sm text-white">
          Uploaded: {new Date(currentImage.uploadedAt).toLocaleDateString()}
          {' • '}
          Double-click to zoom • ESC to close
        </div>
      </div>
    </div>
  )
}
