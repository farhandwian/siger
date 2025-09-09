'use client'

import { useState, useMemo } from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MapPin, Loader2 } from 'lucide-react'
import { GOOGLE_MAPS_OPTIONS, PROJECT_WORK_MAP_OPTIONS } from '@/constants/map-config'
import { ProjectAreaBaseLayer } from './project-area-base-layer'
import {
  useLatestDailySubActivities,
  LatestDailySubActivity,
} from '@/hooks/useLatestDailySubActivities'

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
}

interface ProjectWorkMapProps {
  projectId: string
}

export function ProjectWorkMap({ projectId }: ProjectWorkMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null)

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
                  {selectedLocation.photos && selectedLocation.photos.length > 0 ? (
                    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg">
                      <img
                        src={selectedLocation.photos[0].path}
                        alt="Progress"
                        className="h-full w-full object-cover"
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
    </APIProvider>
  )
}
