'use client'

import { useEffect, useState, useMemo } from 'react'
import { APIProvider, Map, Marker, InfoWindow } from '@vis.gl/react-google-maps'
import { useQuery } from '@tanstack/react-query'
import { Loader2, MapPin, Building2 } from 'lucide-react'
import { GOOGLE_MAPS_OPTIONS } from '@/constants/map-config'
import { ProjectSummaryResponseSchema } from '@/lib/schemas/usulan'

// Types for project location data
interface ProjectLocation {
  id: string
  name: string
  coordinates: [number, number] // [lng, lat]
  progress: number
  deviation: number
  contractValue: string | null
  status: 'on-track' | 'at-risk' | 'delayed'
}

interface PelaksanaanMapProps {
  className?: string
  height?: number
}

// Hook to fetch project summary data
function useProjectSummary() {
  return useQuery({
    queryKey: ['project-summary'],
    queryFn: async () => {
      const response = await fetch('/api/projects/summary?includeProgress=true')
      if (!response.ok) {
        throw new Error('Failed to fetch project summary')
      }
      const data = await response.json()
      return ProjectSummaryResponseSchema.parse(data)
    },
    staleTime: 30_000, // 30 seconds
  })
}

// Generate dummy coordinates for projects in Indonesian region (around Lampung/Sumatra)
function generateProjectLocations(projects: any[]): ProjectLocation[] {
  const baseCoordinates = [
    [105.285, -5.385], // Lampung area
    [105.315, -5.395],
    [105.295, -5.375],
    [105.305, -5.405],
    [105.275, -5.365],
    [105.325, -5.385],
    [105.265, -5.395],
    [105.335, -5.375],
    [105.255, -5.405],
    [105.345, -5.365],
  ]

  return projects.map((project, index) => {
    const coordinates = baseCoordinates[index % baseCoordinates.length] as [number, number]
    
    // Determine status based on progress and deviation
    let status: 'on-track' | 'at-risk' | 'delayed' = 'on-track'
    if (project.deviation <= -10) {
      status = 'delayed'
    } else if (project.deviation <= -5 || project.progress < 30) {
      status = 'at-risk'
    }

    return {
      id: project.id,
      name: project.name || `Project ${index + 1}`,
      coordinates,
      progress: Math.round(project.progress),
      deviation: Math.round(project.deviation * 100) / 100,
      contractValue: project.contractValue,
      status,
    }
  })
}

// Component for rendering progress markers using AdvancedMarker
function ProgressMarker({ 
  project, 
  isSelected, 
  onClick 
}: { 
  project: ProjectLocation
  isSelected: boolean
  onClick: () => void 
}) {
  const statusColors = {
    'on-track': 'bg-emerald-500 border-emerald-600',
    'at-risk': 'bg-amber-500 border-amber-600', 
    'delayed': 'bg-red-500 border-red-600',
  }

  return (
    <Marker
      position={{ lat: project.coordinates[1], lng: project.coordinates[0] }}
      onClick={onClick}
      title={`${project.name} - ${project.progress}%`}
    />
  )
}

// Component for info window content
function ProjectInfoWindow({ project }: { project: ProjectLocation }) {
  const formatCurrency = (value: string | null) => {
    if (!value) return 'N/A'
    return value
  }

  const statusLabels = {
    'on-track': 'Sesuai Jadwal',
    'at-risk': 'Berpotensi Terlambat',
    'delayed': 'Terlambat',
  }

  const statusColors = {
    'on-track': 'text-emerald-600 bg-emerald-50',
    'at-risk': 'text-amber-600 bg-amber-50',
    'delayed': 'text-red-600 bg-red-50',
  }

  return (
    <div className="p-3 max-w-xs">
      <div className="space-y-2">
        {/* Project Name */}
        <h3 className="font-semibold text-sm text-gray-900 line-clamp-2 leading-tight">
          {project.name}
        </h3>
        
        {/* Status Badge */}
        <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${statusColors[project.status]}`}>
          {statusLabels[project.status]}
        </div>
        
        {/* Progress Info */}
        <div className="space-y-1 text-xs">
          <div className="flex justify-between">
            <span className="text-gray-600">Progress:</span>
            <span className="font-semibold text-gray-900">{project.progress}%</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Deviasi:</span>
            <span className={`font-semibold ${project.deviation < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
              {project.deviation > 0 ? '+' : ''}{project.deviation}%
            </span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-gray-600">Nilai Kontrak:</span>
            <span className="font-semibold text-gray-900 text-xs">
              {formatCurrency(project.contractValue)}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

export function PelaksanaanMap({ className, height = 400 }: PelaksanaanMapProps) {
  const [selectedProject, setSelectedProject] = useState<ProjectLocation | null>(null)
  const { data, isLoading, isError, error } = useProjectSummary()

  // Transform project data to locations with coordinates
  const projectLocations = useMemo(() => {
    if (!data?.data.progressDetails) return []
    return generateProjectLocations(data.data.progressDetails)
  }, [data])

  // Calculate map center based on project locations
  const mapCenter = useMemo(() => {
    if (projectLocations.length === 0) {
      return { lat: -5.4, lng: 105.3 } // Default center (Lampung area)
    }
    
    const avgLat = projectLocations.reduce((sum, p) => sum + p.coordinates[1], 0) / projectLocations.length
    const avgLng = projectLocations.reduce((sum, p) => sum + p.coordinates[0], 0) / projectLocations.length
    
    return { lat: avgLat, lng: avgLng }
  }, [projectLocations])

  // Loading state
  if (isLoading) {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gray-100 h-96 ${className}`}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-blue-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Memuat peta pelaksanaan...</h3>
            <p className="mt-1 text-xs text-gray-500">Mengambil data proyek</p>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (isError || !data) {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gray-100 h-96 ${className}`}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-red-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Gagal memuat peta</h3>
            <p className="mt-1 text-xs text-gray-500">
              {error instanceof Error ? error.message : 'Terjadi kesalahan saat memuat data'}
            </p>
          </div>
        </div>
      </div>
    )
  }

  // Check if Google Maps API key is available
  if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div 
        className={`relative overflow-hidden rounded-2xl bg-gray-100 h-96 ${className}`}
      >
        <div className="flex h-full w-full items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto h-8 w-8 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Google Maps tidak tersedia</h3>
            <p className="mt-1 text-xs text-gray-500">API key diperlukan untuk menampilkan peta</p>
          </div>
        </div>
        
        {/* Fallback: Show project list */}
        <div className="absolute left-4 top-4 z-10 max-h-80 w-80 overflow-y-auto rounded-lg bg-white p-4 shadow-lg">
          <h4 className="mb-3 text-sm font-semibold text-gray-900">
            Proyek Pelaksanaan ({projectLocations.length})
          </h4>
          <div className="space-y-2">
            {projectLocations.map((project) => (
              <div key={project.id} className="border-b border-gray-100 pb-2 last:border-b-0">
                <div className="text-xs font-medium text-gray-900">{project.name}</div>
                <div className="mt-1 text-xs text-gray-600">
                  Progress: {project.progress}% • Deviasi: {project.deviation}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}>
      <div 
        className={`relative overflow-hidden rounded-2xl h-96 ${className}`}
      >
        <Map
          className="h-full w-full"
          {...GOOGLE_MAPS_OPTIONS}
          defaultCenter={mapCenter}
          defaultZoom={12}
          mapTypeId="roadmap"
        >
          {/* Render project markers */}
          {projectLocations.map((project) => (
            <ProgressMarker
              key={project.id}
              project={project}
              isSelected={selectedProject?.id === project.id}
              onClick={() => setSelectedProject(project)}
            />
          ))}

          {/* Info window for selected project */}
          {selectedProject && (
            <InfoWindow
              position={{
                lat: selectedProject.coordinates[1],
                lng: selectedProject.coordinates[0],
              }}
              onCloseClick={() => setSelectedProject(null)}
            >
              <ProjectInfoWindow project={selectedProject} />
            </InfoWindow>
          )}
        </Map>

        {/* Legend */}
        <div className="absolute right-4 top-4 z-10 rounded-lg bg-white/95 p-3 shadow-lg backdrop-blur-sm">
          <h4 className="mb-2 text-xs font-semibold text-gray-900">Status Proyek</h4>
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-emerald-500 border border-emerald-600"></div>
              <span className="text-gray-700">Sesuai Jadwal</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-amber-500 border border-amber-600"></div>
              <span className="text-gray-700">Berpotensi Terlambat</span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <div className="w-3 h-3 rounded-full bg-red-500 border border-red-600"></div>
              <span className="text-gray-700">Terlambat</span>
            </div>
          </div>
        </div>

        {/* Project count indicator */}
        <div className="absolute left-4 bottom-4 z-10 rounded-lg bg-white/95 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs">
            <Building2 className="w-4 h-4 text-gray-600" />
            <span className="font-medium text-gray-900">{projectLocations.length} Proyek Aktif</span>
          </div>
        </div>
      </div>
    </APIProvider>
  )
}