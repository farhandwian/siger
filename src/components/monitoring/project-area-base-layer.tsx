'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { Button } from '@/components/ui/button'
import { Edit3, Save, X, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectAreaBaseLayerProps {
  className?: string
  onPolygonSave?: () => void // Callback when polygon is saved (triggers page reload)
  initialCoordinates?: number[][]
  editable?: boolean
  projectId?: string
}

export const ProjectAreaBaseLayer = ({
  className,
  onPolygonSave,
  initialCoordinates,
  editable = true,
  projectId,
}: ProjectAreaBaseLayerProps) => {
  const map = useMap()

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingInitialData, setLoadingInitialData] = useState(false)

  // Drawing state
  const [dataLayer, setDataLayer] = useState<google.maps.Data | null>(null)
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(
    null
  )
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Data.Feature | null>(null)

  // Default coordinates if none provided (memoized to prevent re-creation)
  const defaultCoordinates = useMemo(() => initialCoordinates || [
    [105.285, -5.385],
    [105.315, -5.385],
    [105.315, -5.41],
    [105.285, -5.41],
    [105.285, -5.385],
  ], [initialCoordinates])

  // Load existing polygon data from API
  const loadPolygonData = useCallback(async () => {
    if (!projectId) {
      return null
    }

    try {
      const response = await fetch(`/api/projects/${projectId}/area`)

      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data?.coordinates) {
          return result.data.coordinates
        }
      }
    } catch (error) {
      // Silently handle loading error
    }

    return null
  }, [projectId])

  // Initialize map layers and load polygon data
  useEffect(() => {
    if (!map || !projectId) {
      return
    }

    const initializeMapData = async () => {
      setLoadingInitialData(true)
      
      try {
        // CRITICAL: Clean up existing layers FIRST before creating new ones
        // This must happen synchronously to prevent old polygons from remaining
        if (dataLayer) {
          // Remove all features from current layer
          const featuresToRemove: google.maps.Data.Feature[] = []
          dataLayer.forEach(feature => {
            featuresToRemove.push(feature)
          })
          featuresToRemove.forEach(feature => {
            dataLayer.remove(feature)
          })
          // Remove layer from map
          dataLayer.setMap(null)
        }
        
        if (drawingManager) {
          drawingManager.setMap(null)
        }

        // Clear state references
        setCurrentPolygon(null)

        // Small delay to ensure cleanup is complete before creating new layer
        await new Promise(resolve => setTimeout(resolve, 50))

        // Create NEW data layer for displaying the polygon
        const layer = new google.maps.Data({
          map,
          style: () => ({
            fillOpacity: 0.1,
            fillColor: '#EF4444',
            strokeColor: '#EF4444',
            strokeWeight: 2,
            strokeOpacity: 0.8,
            editable: false,
            draggable: false,
          }),
        })

        setDataLayer(layer)

        // Load polygon data from API or use default
        let coordinates = defaultCoordinates

        const apiCoordinates = await loadPolygonData()

        if (apiCoordinates && Array.isArray(apiCoordinates)) {
          // Convert from lat/lng objects to coordinate arrays
          coordinates = apiCoordinates.map(coord => [coord.lng, coord.lat])

          // Close the polygon if not already closed
          if (
            coordinates.length > 0 &&
            (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
              coordinates[0][1] !== coordinates[coordinates.length - 1][1])
          ) {
            coordinates.push(coordinates[0])
          }
        }

        // Load polygon into data layer
        const projectAreaGeoJSON = {
          type: 'FeatureCollection' as const,
          features: [
            {
              type: 'Feature' as const,
              properties: {
                name: 'Project Work Area',
              },
              geometry: {
                type: 'Polygon' as const,
                coordinates: [coordinates],
              },
            },
          ],
        }

        layer.addGeoJson(projectAreaGeoJSON)

        // Store reference to the polygon feature
        layer.forEach(feature => {
          setCurrentPolygon(feature)
        })
      } catch (error) {
        // Silently handle error - could add proper error reporting here
        setLoadingInitialData(false)
      } finally {
        setLoadingInitialData(false)
      }
    }

    initializeMapData()

    return () => {
      // Cleanup will be handled in the effect itself
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, projectId, defaultCoordinates, loadPolygonData]) // Parent controls refresh via key prop

  // Separate cleanup effect for dataLayer
  useEffect(() => {
    return () => {
      if (dataLayer) {
        dataLayer.setMap(null)
      }
    }
  }, [dataLayer])

  // Update data layer styling when edit mode changes
  useEffect(() => {
    if (!dataLayer) return

    dataLayer.setStyle(() => ({
      fillOpacity: isEditMode ? 0.2 : 0.1,
      fillColor: isEditMode ? '#3B82F6' : '#EF4444',
      strokeColor: isEditMode ? '#3B82F6' : '#EF4444',
      strokeWeight: isEditMode ? 3 : 2,
      strokeOpacity: 0.8,
      editable: isEditMode,
      draggable: isEditMode,
      visible: true,
    }))

    // Note: Drawing manager cleanup is handled in the drawing manager effect
  }, [dataLayer, isEditMode]) // Removed drawingManager to prevent dependency issues

  // Initialize drawing manager for edit mode
  useEffect(() => {
    if (!map || !isEditMode) {
      // Clean up existing drawing manager when not in edit mode
      setDrawingManager(prevManager => {
        if (prevManager) {
          prevManager.setMap(null)
        }
        return null
      })
      return
    }

    const manager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: true,
      drawingControlOptions: {
        position: google.maps.ControlPosition.TOP_CENTER,
        drawingModes: [google.maps.drawing.OverlayType.POLYGON],
      },
      polygonOptions: {
        fillOpacity: 0.2,
        fillColor: '#3B82F6',
        strokeColor: '#3B82F6',
        strokeWeight: 3,
        editable: true,
        draggable: true,
      },
    })

    manager.setMap(map)
    setDrawingManager(manager)

    return () => {
      manager.setMap(null)
    }
  }, [map, isEditMode]) // No drawingManager dependency to prevent circular loop

  // Handle polygon completion events separately
  useEffect(() => {
    if (!drawingManager || !dataLayer) return

    const polygonCompleteListener = google.maps.event.addListener(
      drawingManager,
      'polygoncomplete',
      (polygon: google.maps.Polygon) => {
        // Clear ALL existing polygons from data layer
        const featuresToRemove: google.maps.Data.Feature[] = []
        dataLayer.forEach(feature => {
          featuresToRemove.push(feature)
        })
        featuresToRemove.forEach(feature => {
          dataLayer.remove(feature)
        })

        // Convert polygon to coordinates
        const path = polygon.getPath()
        const coordinates: number[][] = []

        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i)
          coordinates.push([point.lng(), point.lat()])
        }

        // Close the polygon
        if (coordinates.length > 0) {
          coordinates.push(coordinates[0])
        }

        // Create new feature
        const newFeature = new google.maps.Data.Feature({
          geometry: new google.maps.Data.Polygon([
            coordinates.map(coord => new google.maps.LatLng(coord[1], coord[0])),
          ]),
          properties: { name: 'Project Work Area' },
        })

        dataLayer.add(newFeature)
        setCurrentPolygon(newFeature)

        // Remove the drawing polygon completely
        polygon.setMap(null)
        polygon.setVisible(false)

        // Stop drawing mode and reset controls
        drawingManager.setDrawingMode(null)

        setHasUnsavedChanges(true)
      }
    )

    return () => {
      google.maps.event.removeListener(polygonCompleteListener)
    }
  }, [drawingManager, dataLayer])

  // Add edit listeners to existing polygon
  useEffect(() => {
    if (!dataLayer || !currentPolygon || !isEditMode) return

    const addEditListeners = () => {
      // Add listeners for geometry changes
      const listeners = [
        dataLayer.addListener('setgeometry', () => {
          setHasUnsavedChanges(true)
        }),
        dataLayer.addListener('removefeature', () => {
          setHasUnsavedChanges(true)
        }),
      ]

      return () => {
        listeners.forEach(listener => google.maps.event.removeListener(listener))
      }
    }

    return addEditListeners()
  }, [dataLayer, currentPolygon, isEditMode])

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (isEditMode && hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?')
      if (!confirmed) return
    }

    setIsEditMode(!isEditMode)
    setHasUnsavedChanges(false)
  }, [isEditMode, hasUnsavedChanges])

  // Save changes
  const handleSave = useCallback(async () => {
    if (!currentPolygon || !dataLayer || !map) return

    setIsLoading(true)

    try {
      const geometry = currentPolygon.getGeometry()
      if (geometry && geometry.getType() === 'Polygon') {
        const polygon = geometry as google.maps.Data.Polygon
        const coordinates: number[][] = []

        polygon.getArray().forEach(linearRing => {
          linearRing.getArray().forEach(latLng => {
            coordinates.push([latLng.lng(), latLng.lat()])
          })
        })

        // Save to database if projectId is provided
        if (projectId) {
          // First save the polygon data
          const response = await fetch(`/api/projects/${projectId}/area`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              coordinates: coordinates.map(coord => ({
                lat: coord[1],
                lng: coord[0],
              })),
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save polygon to database')
          }

          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to save polygon')
          }

          // Then save the map state (center and zoom)
          const center = map.getCenter()
          if (center) {
            const mapStateResponse = await fetch(`/api/projects/${projectId}/map-state`, {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                center: {
                  lat: center.lat(),
                  lng: center.lng(),
                },
                zoom: map.getZoom(),
              }),
            })

            if (!mapStateResponse.ok) {
              console.error('Failed to save map state')
            }
          }
        }

        // Call save callback if provided (will trigger page reload)
        if (onPolygonSave) {
          onPolygonSave()
        }

        // Reset UI state while page reloads
        setHasUnsavedChanges(false)
        setIsEditMode(false)
      }
    } catch (error) {
      // Handle error silently or with proper error reporting
      // Show error message to user
      alert('Failed to save polygon. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPolygon, dataLayer, onPolygonSave, projectId, map])

  // Cancel changes
  const handleCancel = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Are you sure you want to cancel? All changes will be lost.')
      if (!confirmed) return
    }

    // Component refresh: restore original state without page reload
    setIsEditMode(false)
    setHasUnsavedChanges(false)
    
    // Simple refresh: clear current state and reload from API
    setDataLayer(null)
    setDrawingManager(null)
    setCurrentPolygon(null)
  }, [hasUnsavedChanges])

  if (!editable) return null

  return (
    <div className={cn('absolute left-4 top-4 z-10 flex flex-col gap-2', className)}>
      {/* Loading Initial Data */}
      {loadingInitialData && (
        <div className="rounded-lg border border-gray-200 bg-white/90 p-3 text-sm shadow-md backdrop-blur-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading polygon data...</span>
          </div>
        </div>
      )}

      {/* Edit Mode Toggle */}
      {!isEditMode ? (
        <Button
          onClick={toggleEditMode}
          variant="secondary"
          size="sm"
          className="bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
          disabled={loadingInitialData}
        >
          <Edit3 className="mr-2 h-4 w-4" />
          Edit Area
        </Button>
      ) : (
        <div className="flex flex-col gap-2">
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || isLoading}
              size="sm"
              className="bg-green-600 text-white shadow-md hover:bg-green-700"
            >
              <Save className="mr-2 h-4 w-4" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="bg-white/90 shadow-md backdrop-blur-sm hover:bg-white"
            >
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
          </div>

          {/* Edit Mode Info */}
          <div className="max-w-xs rounded-lg border border-blue-200 bg-blue-50/90 p-3 text-sm shadow-md backdrop-blur-sm">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" />
              <div className="text-blue-800">
                <p className="mb-1 font-medium">Edit Mode Active</p>
                <p className="text-xs">
                  • Use drawing tools to create new polygon
                  <br />
                  • Drag points to modify existing area
                  <br />• Double-click polygon to edit vertices
                </p>
              </div>
            </div>
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="rounded-lg border border-amber-200 bg-amber-50/90 p-2 text-sm shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500"></div>
                <span className="text-xs font-medium">Unsaved changes</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
