'use client'

import { useMemo, useState } from 'react'
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { MapPin, Loader2, Eye, EyeOff, Triangle } from 'lucide-react'

// Constants for map configuration
const GOOGLE_MAPS_OPTIONS = {
  mapId: process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID,
  gestureHandling: 'greedy',
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: false,
  rotateControl: false,
  fullscreenControl: false,
}

const PROJECT_MAP_CENTER = {
  lat: -5.4,
  lng: 105.3, // Lampung area
  zoom: 11,
}

// Static dummy data for map markers with realistic Lampung coordinates
const MAP_MARKERS = [
  // Progress markers (circles with percentages) - using real Lampung coordinates
  {
    id: 1,
    type: 'progress',
    percentage: 60,
    status: 'medium',
    position: { lat: -5.385, lng: 105.285 },
    name: 'Bandar Lampung Utara',
  },
  {
    id: 2,
    type: 'progress',
    percentage: 89,
    status: 'good',
    position: { lat: -5.395, lng: 105.315 },
    name: 'Tanjung Karang',
  },
  {
    id: 3,
    type: 'progress',
    percentage: 60,
    status: 'medium',
    position: { lat: -5.375, lng: 105.295 },
    name: 'Sukamerindu',
  },
  {
    id: 4,
    type: 'progress',
    percentage: 35,
    status: 'poor',
    position: { lat: -5.405, lng: 105.305 },
    name: 'Rajabasa',
  },
  {
    id: 5,
    type: 'progress',
    percentage: 90,
    status: 'good',
    position: { lat: -5.365, lng: 105.275 },
    name: 'Kemiling',
  },
  {
    id: 6,
    type: 'progress',
    percentage: 15,
    status: 'poor',
    position: { lat: -5.415, lng: 105.325 },
    name: 'Langkapura',
  },
  {
    id: 7,
    type: 'progress',
    percentage: 95,
    status: 'good',
    position: { lat: -5.355, lng: 105.335 },
    name: 'Sukarame',
  },
  {
    id: 8,
    type: 'progress',
    percentage: 85,
    status: 'good',
    position: { lat: -5.425, lng: 105.345 },
    name: 'Teluk Betung',
  },
  {
    id: 9,
    type: 'progress',
    percentage: 33,
    status: 'poor',
    position: { lat: -5.435, lng: 105.255 },
    name: 'Panjang',
  },
  {
    id: 10,
    type: 'progress',
    percentage: 60,
    status: 'medium',
    position: { lat: -5.345, lng: 105.265 },
    name: 'Taman Asri',
  },
  {
    id: 11,
    type: 'progress',
    percentage: 25,
    status: 'poor',
    position: { lat: -5.445, lng: 105.275 },
    name: 'Way Halim',
  },

  // Proposal markers (triangles - different colors)
  {
    id: 12,
    type: 'proposal',
    status: 'verified',
    position: { lat: -5.355, lng: 105.285 },
    name: 'Usulan Infrastruktur A',
  },
  {
    id: 13,
    type: 'proposal',
    status: 'verified',
    position: { lat: -5.365, lng: 105.295 },
    name: 'Usulan Jalan B',
  },
  {
    id: 14,
    type: 'proposal',
    status: 'verified',
    position: { lat: -5.375, lng: 105.305 },
    name: 'Usulan Drainase C',
  },
  {
    id: 15,
    type: 'proposal',
    status: 'verified',
    position: { lat: -5.385, lng: 105.315 },
    name: 'Usulan Jembatan D',
  },
  {
    id: 16,
    type: 'proposal',
    status: 'verified',
    position: { lat: -5.395, lng: 105.325 },
    name: 'Usulan Sanitasi E',
  },
  {
    id: 17,
    type: 'proposal',
    status: 'pending',
    position: { lat: -5.405, lng: 105.335 },
    name: 'Usulan Pending F',
  },
  {
    id: 18,
    type: 'proposal',
    status: 'pending',
    position: { lat: -5.415, lng: 105.255 },
    name: 'Usulan Pending G',
  },
  {
    id: 19,
    type: 'proposal',
    status: 'pending',
    position: { lat: -5.425, lng: 105.265 },
    name: 'Usulan Pending H',
  },
  {
    id: 20,
    type: 'proposal',
    status: 'rejected',
    position: { lat: -5.435, lng: 105.275 },
    name: 'Usulan Rejected I',
  },
  {
    id: 21,
    type: 'proposal',
    status: 'rejected',
    position: { lat: -5.445, lng: 105.285 },
    name: 'Usulan Rejected J',
  },
]

interface MapMarkerProps {
  marker: (typeof MAP_MARKERS)[0]
}

// Add Google Maps types
declare global {
  interface Window {
    google: typeof google
  }
}

declare const google: any

// Progress marker component (standard marker with custom icon) for Google Maps
function ProgressMarker({ marker }: MapMarkerProps) {
  // Create a custom marker icon based on status
  const getMarkerIcon = (status: string, percentage: number) => {
    const color = status === 'good' ? '#10b981' : status === 'medium' ? '#f59e0b' : '#ef4444'

    // Create SVG icon with percentage
    const svgIcon = `
      <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
        <circle cx="16" cy="16" r="12" fill="${color}" stroke="white" stroke-width="2"/>
        <text x="16" y="20" text-anchor="middle" fill="white" font-size="10" font-weight="bold">${percentage}</text>
      </svg>
    `

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`
  }

  return (
    <Marker
      position={marker.position}
      clickable={false}
      icon={{
        url: getMarkerIcon(marker.status, marker.percentage!),
        scaledSize: new google.maps.Size(32, 32),
        anchor: new google.maps.Point(16, 16),
      }}
      title={`${marker.name}: ${marker.percentage}%`}
    />
  )
}

// Proposal marker component (triangle marker) for Google Maps
function ProposalMarker({ marker }: MapMarkerProps) {
  // Create a custom triangle marker icon based on status
  const getTriangleIcon = (status: string) => {
    const color = status === 'verified' ? '#10b981' : status === 'pending' ? '#f59e0b' : '#ef4444'

    // Create SVG triangle icon
    const svgIcon = `
      <svg width="16" height="16" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <polygon points="8,2 14,14 2,14" fill="${color}" stroke="white" stroke-width="1"/>
      </svg>
    `

    return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svgIcon)}`
  }

  return (
    <Marker
      position={marker.position}
      clickable={false}
      icon={{
        url: getTriangleIcon(marker.status),
        scaledSize: new google.maps.Size(16, 16),
        anchor: new google.maps.Point(8, 14),
      }}
      title={marker.name}
    />
  )
}

// Legend component with toggle functionality
function MapLegend({
  showProgress,
  showProposals,
  onToggleProgress,
  onToggleProposals,
}: {
  showProgress: boolean
  showProposals: boolean
  onToggleProgress: () => void
  onToggleProposals: () => void
}) {
  return (
    <div className="absolute left-6 top-6 z-20 space-y-2">
      {/* Moved legend to left to avoid Google Maps zoom controls */}
      {/* Progress Legend */}
      <div
        className={`rounded-lg bg-black/45 p-2  transition-opacity ${!showProgress ? 'opacity-60' : ''}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-normal text-white">Progress Pekerjaan</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleProgress}
            className="h-4 w-4 p-0 hover:bg-white/10"
            title={showProgress ? 'Sembunyikan progress markers' : 'Tampilkan progress markers'}
          >
            {showProgress ? (
              <Eye className="h-3 w-3 text-white" />
            ) : (
              <EyeOff className="h-3 w-3 text-white/60" />
            )}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-emerald-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Progress &gt;80%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-amber-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Progress 50-79%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-2 w-2 rounded-full bg-red-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Progress &lt;50%
            </span>
          </div>
        </div>
      </div>

      {/* Proposal Legend */}
      <div
        className={`rounded-lg bg-black/45 p-2  transition-opacity ${!showProposals ? 'opacity-60' : ''}`}
      >
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-normal text-white">Usulan</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleProposals}
            className="h-4 w-4 p-0 hover:bg-white/10"
            title={showProposals ? 'Sembunyikan proposal markers' : 'Tampilkan proposal markers'}
          >
            {showProposals ? (
              <Eye className="h-3 w-3 text-white" />
            ) : (
              <EyeOff className="h-3 w-3 text-white/60" />
            )}
          </Button>
        </div>
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1.5">
            <Triangle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Diverifikasi (5)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Triangle className="h-2 w-2 fill-amber-500 text-amber-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Menunggu Verifikasi (3)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Triangle className="h-2 w-2 fill-red-500 text-red-500" />
            <span className="whitespace-nowrap text-[10px] font-normal text-white">
              Ditolak (2)
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

interface PelaksanaanMapProps {
  className?: string
  height?: number
  isLoading?: boolean
}

export function PelaksanaanMap({
  className,
  height = 600, // Increased default height
  isLoading = false,
}: PelaksanaanMapProps) {
  // State for toggling marker visibility
  const [showProgress, setShowProgress] = useState(true)
  const [showProposals, setShowProposals] = useState(true)

  // Filter markers based on toggle states
  const visibleMarkers = useMemo(() => {
    return MAP_MARKERS.filter(marker => {
      if (marker.type === 'progress' && !showProgress) return false
      if (marker.type === 'proposal' && !showProposals) return false
      return true
    })
  }, [showProgress, showProposals])

  if (isLoading) {
    return (
      <Card className="rounded-2xl border border-gray-200">
        <CardContent className="p-0">
          <div className="p-6 pb-4">
            <Skeleton className="mb-2 h-6 w-48" />
          </div>
          <div className="px-6 pb-6">
            <Skeleton
              className={`w-full rounded-xl ${className}`}
              style={{ height: `${height}px` }}
            />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="rounded-2xl border border-gray-200 bg-white">
      <CardContent className="p-0">
        {/* Header */}
        <div className="p-6 pb-4">
          <h2 className="text-lg font-semibold text-gray-700">Peta Usulan dan Pelaksanaan</h2>
        </div>

        {/* Google Maps Container - fixed to not overlap card boundaries */}
        <div className="px-6 pb-6">
          <div className={`relative w-full overflow-hidden rounded-xl ${className}`}>
            <APIProvider apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ''}>
              <Map
                defaultCenter={PROJECT_MAP_CENTER}
                defaultZoom={12}
                style={{ width: '100%', height: height || '600px' }}
                {...GOOGLE_MAPS_OPTIONS}
                mapTypeId="satellite"
                zoomControl={true}
                keyboardShortcuts={false}
                scrollwheel={false}
              >
                {/* Render filtered markers based on toggle states */}
                {visibleMarkers.map(marker =>
                  marker.type === 'progress' ? (
                    <ProgressMarker key={marker.id} marker={marker} />
                  ) : (
                    <ProposalMarker key={marker.id} marker={marker} />
                  )
                )}
              </Map>
            </APIProvider>

            {/* Map Legend with toggle functionality */}
            <MapLegend
              showProgress={showProgress}
              showProposals={showProposals}
              onToggleProgress={() => setShowProgress(!showProgress)}
              onToggleProposals={() => setShowProposals(!showProposals)}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
