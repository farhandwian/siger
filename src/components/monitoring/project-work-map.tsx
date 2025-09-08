'use client'

import { useState, useMemo } from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { MapPin } from 'lucide-react'
import { GOOGLE_MAPS_OPTIONS, PROJECT_WORK_MAP_OPTIONS } from '@/constants/map-config'
import { ProjectAreaBaseLayer } from './project-area-base-layer'

interface WorkLocation {
  id: string
  name: string
  description: string
  progress: number
  lastUpdate: string
  position: { lat: number; lng: number }
  status: 'completed' | 'in-progress' | 'pending'
}

interface ProjectWorkMapProps {
  projectId: string
}

export function ProjectWorkMap({ projectId }: ProjectWorkMapProps) {
  const [selectedLocation, setSelectedLocation] = useState<WorkLocation | null>(null)

  // Mock data for work locations - in real app, this would come from API
  const workLocations: WorkLocation[] = useMemo(
    () => [
      {
        id: '1',
        name: 'Galian Tanah di Rawa menggunakan Excavator Standar',
        description:
          'Catatan: Telah dilaksanakan mobilisasi untuk persiapan awal proyek. Kegiatan meliputi pembersihan lokasi dan pengiriman material tahap pertama.',
        progress: 1.015,
        lastUpdate: '1 Hari Lalu',
        position: { lat: -5.395, lng: 105.295 },
        status: 'in-progress',
      },
      {
        id: '2',
        name: 'Normalisasi Saluran',
        description:
          'Pekerjaan normalisasi saluran drainase utama telah dimulai dengan target penyelesaian 2 minggu.',
        progress: 0.5,
        lastUpdate: '2 Hari Lalu',
        position: { lat: -5.4, lng: 105.3 },
        status: 'in-progress',
      },
      {
        id: '3',
        name: 'Rehab Pintu Air',
        description: 'Rehabilitasi pintu air untuk kontrol aliran telah selesai tahap persiapan.',
        progress: 2.1,
        lastUpdate: '3 Hari Lalu',
        position: { lat: -5.39, lng: 105.305 },
        status: 'in-progress',
      },
      {
        id: '4',
        name: 'Galian Saluran Drainase',
        description: 'Galian saluran drainase sekunder sedang dalam tahap pelaksanaan.',
        progress: 1.5,
        lastUpdate: '1 Hari Lalu',
        position: { lat: -5.405, lng: 105.285 },
        status: 'in-progress',
      },
      {
        id: '5',
        name: 'Pembuatan Jalan Akses',
        description: 'Pembangunan jalan akses untuk mendukung mobilisasi peralatan.',
        progress: 3.2,
        lastUpdate: '4 Hari Lalu',
        position: { lat: -5.385, lng: 105.31 },
        status: 'completed',
      },
      {
        id: '6',
        name: 'Pemasangan Pipa Drainase',
        description: 'Pemasangan sistem pipa drainase untuk aliran air.',
        progress: 0.8,
        lastUpdate: '2 Hari Lalu',
        position: { lat: -5.392, lng: 105.292 },
        status: 'in-progress',
      },
      {
        id: '7',
        name: 'Pembersihan Area Kerja',
        description: 'Pembersihan dan persiapan area kerja tahap kedua.',
        progress: 4.1,
        lastUpdate: '1 Hari Lalu',
        position: { lat: -5.398, lng: 105.298 },
        status: 'completed',
      },
      {
        id: '8',
        name: 'Pengurugan Tanah',
        description: 'Pekerjaan pengurugan tanah untuk stabilisasi area.',
        progress: 2.8,
        lastUpdate: '3 Hari Lalu',
        position: { lat: -5.388, lng: 105.288 },
        status: 'in-progress',
      },
    ],
    []
  )

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
        {/* Mock markers for demonstration */}
        <div className="absolute left-4 top-4 z-10 rounded-lg bg-white p-3 shadow-lg">
          <h4 className="mb-2 text-sm font-semibold text-gray-900">Lokasi Pekerjaan</h4>
          <div className="space-y-2">
            {workLocations.slice(0, 3).map(location => (
              <div key={location.id} className="flex items-center gap-2 text-xs">
                <div
                  className={`h-3 w-3 rounded-full ${
                    location.status === 'completed'
                      ? 'bg-green-500'
                      : location.status === 'in-progress'
                        ? 'bg-yellow-400'
                        : 'bg-red-500'
                  }`}
                />
                <span className="truncate text-gray-700">{location.name.substring(0, 30)}...</span>
              </div>
            ))}
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
              <div className="m-0 w-72 bg-transparent p-0">
                <div className="flex gap-3 rounded-lg bg-white p-3 shadow-lg">
                  {/* Work Image Placeholder */}
                  <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="flex h-full w-full items-center justify-center">
                      <div className="text-sm font-bold text-white">
                        {selectedLocation.name.split(' ')[0].charAt(0)}
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-1">
                    <h3 className="line-clamp-2 text-sm font-semibold leading-tight text-[#364878]">
                      {selectedLocation.name}
                    </h3>
                    <p className="line-clamp-3 text-xs leading-tight text-gray-700">
                      {selectedLocation.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs">
                      <span className="text-gray-500">Progress:</span>
                      <span className="font-semibold text-gray-900">
                        {selectedLocation.progress}%
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
