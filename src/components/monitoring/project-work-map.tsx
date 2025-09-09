'use client'

import { useState, useMemo } from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MapPin, Loader2 } from 'lucide-react'
import { GOOGLE_MAPS_OPTIONS, PROJECT_WORK_MAP_OPTIONS } from '@/constants/map-config'
import { ProjectAreaBaseLayer } from './project-area-base-layer'
import { useLatestDailySubActivities, LatestDailySubActivity } from '@/hooks/useLatestDailySubActivities'


interface WorkLocation {
  id: string
  name: string
  description: string
  progress: number
  lastUpdate: string
  position: { lat: number; lng: number }
  status: 'completed' | 'in-progress' | 'pending'
  projectName?: string
  userName?: string
  photos?: { path: string; filename?: string }[]
}

interface ProjectWorkMapProps {
  projectId: string
}

export function ProjectWorkMap({ projectId }: ProjectWorkMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null)
  
  // Fetch latest daily sub activities from API
  const { data: apiResponse, isLoading, isError, error } = useLatestDailySubActivities({
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
        const daysDiff = Math.floor((now.getTime() - lastUpdateDate.getTime()) / (1000 * 60 * 60 * 24))
        const lastUpdateText = daysDiff === 0 ? 'Hari ini' : 
                              daysDiff === 1 ? '1 Hari Lalu' : 
                              `${daysDiff} Hari Lalu`

        // Determine status based on progress and activity
        const progress = activity.progresRealisasiPerHari || 0
        const status: WorkLocation['status'] = 
          progress >= 100 ? 'completed' : 
          progress > 0 ? 'in-progress' : 
          'pending'

        return {
          id: activity.id,
          name: activity.subActivity.name,
          description: activity.catatanKegiatan || `Pekerjaan ${activity.subActivity.name} - ${activity.subActivity.activity.name}`,
          progress: progress,
          lastUpdate: lastUpdateText,
          position: {
            lat: activity.koordinat!.latitude,
            lng: activity.koordinat!.longitude,
          },
          status,
          projectName: activity.subActivity.activity.project.pekerjaan,
          userName: activity.user.name,
          photos: activity.file || [],
        }
      })
  }, [apiResponse?.data])

  const getMarkerColor = (status: WorkLocation['status']) => {
    switch (status) {
      case 'completed':
        return '#10B981' // green
      case 'in-progress':
        return '#FFC928' // yellow
      case 'pending':
        return '#EF4444' // red
      default:
        return '#FFC928'
    }
  }

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
                    <div
                      className={`mt-1 h-3 w-3 flex-shrink-0 rounded-full ${
                        location.status === 'completed'
                          ? 'bg-green-500'
                          : location.status === 'in-progress'
                            ? 'bg-yellow-400'
                            : 'bg-red-500'
                      }`}
                    />
                    <div className="flex-1 space-y-1">
                      <h5 className="line-clamp-2 text-xs font-medium text-gray-900">
                        {location.name}
                      </h5>
                      <p className="line-clamp-2 text-xs text-gray-600">
                        {location.description}
                      </p>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">
                          Progress: {location.progress.toFixed(1)}%
                        </span>
                        <span className="text-gray-500">{location.lastUpdate}</span>
                      </div>
                      {location.userName && (
                        <p className="text-xs text-gray-500">
                          Pekerja: {location.userName}
                        </p>
                      )}
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
                        onError={(e) => {
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
                    {selectedLocation.userName && (
                      <p className="text-xs text-gray-600">
                        <span className="font-medium">Pekerja:</span> {selectedLocation.userName}
                      </p>
                    )}
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedLocation.progress.toFixed(2)}%
                      </span>
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                          selectedLocation.status === 'completed'
                            ? 'bg-green-100 text-green-800'
                            : selectedLocation.status === 'in-progress'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {selectedLocation.status === 'completed'
                          ? 'Selesai'
                          : selectedLocation.status === 'in-progress'
                            ? 'Berjalan'
                            : 'Pending'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">Update {selectedLocation.lastUpdate}</p>
                    {selectedLocation.projectName && (
                      <p className="line-clamp-2 text-xs text-gray-500">
                        <span className="font-medium">Proyek:</span> {selectedLocation.projectName}
                      </p>
                    )}
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
