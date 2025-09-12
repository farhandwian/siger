'use client'

import { useEffect, useState, useCallback } from 'react'
import { useMap } from '@vis.gl/react-google-maps'
import { Button } from '@/components/ui/button'
import { Edit3, Save, X, Info, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ProjectAreaBaseLayerProps {
  className?: string
  onPolygonSave?: (coordinates: number[][]) => void
  initialCoordinates?: number[][]
  editable?: boolean
  projectId?: string
}

export const ProjectAreaBaseLayer = ({ 
  className,
  onPolygonSave,
  initialCoordinates,
  editable = true,
  projectId
}: ProjectAreaBaseLayerProps) => {
  const map = useMap()
  
  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [loadingInitialData, setLoadingInitialData] = useState(false)
  
  // Drawing state
  const [dataLayer, setDataLayer] = useState<google.maps.Data | null>(null)
  const [drawingManager, setDrawingManager] = useState<google.maps.drawing.DrawingManager | null>(null)
  const [currentPolygon, setCurrentPolygon] = useState<google.maps.Data.Feature | null>(null)

  // Default coordinates if none provided
  const defaultCoordinates = initialCoordinates || [
    [105.285, -5.385],
    [105.315, -5.385], 
    [105.315, -5.41],
    [105.285, -5.41],
    [105.285, -5.385],
  ]

  // Load existing polygon data from API
  const loadPolygonData = useCallback(async () => {
    if (!projectId) return

    try {
      setLoadingInitialData(true)
      const response = await fetch(`/api/projects/${projectId}/area`)
      
      if (response.ok) {
        const result = await response.json()
        if (result.success && result.data?.coordinates) {
          return result.data.coordinates
        }
      }
    } catch (error) {
      console.error('Error loading polygon data:', error)
    } finally {
      setLoadingInitialData(false)
    }
    
    return null
  }, [projectId])

  // Initialize map layers and load polygon data
  useEffect(() => {
    if (!map) return

    const initializeMapData = async () => {
      // Create data layer for displaying the polygon
      const layer = new google.maps.Data({
        map,
        style: (feature) => ({
          fillOpacity: isEditMode ? 0.2 : 0,
          fillColor: isEditMode ? '#3B82F6' : '#EF4444',
          strokeColor: isEditMode ? '#3B82F6' : '#EF4444',
          strokeWeight: isEditMode ? 3 : 2,
          strokeOpacity: 0.8,
          editable: isEditMode,
          draggable: isEditMode,
        }),
      })

      setDataLayer(layer)

      // Load polygon data from API or use default
      let coordinates = defaultCoordinates
      
      if (projectId) {
        const apiCoordinates = await loadPolygonData()
        if (apiCoordinates && Array.isArray(apiCoordinates)) {
          // Convert from lat/lng objects to coordinate arrays
          coordinates = apiCoordinates.map(coord => [coord.lng, coord.lat])
          // Close the polygon if not already closed
          if (coordinates.length > 0 && 
              (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
               coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
            coordinates.push(coordinates[0])
          }
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
      layer.forEach((feature) => {
        setCurrentPolygon(feature)
      })
    }

    initializeMapData()

    return () => {
      if (dataLayer) {
        dataLayer.setMap(null)
      }
    }
  }, [map, isEditMode, projectId, loadPolygonData])

  // Initialize drawing manager for edit mode
  useEffect(() => {
    if (!map || !isEditMode) {
      if (drawingManager) {
        drawingManager.setMap(null)
        setDrawingManager(null)
      }
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

    // Handle polygon completion
    const polygonCompleteListener = google.maps.event.addListener(
      manager,
      'polygoncomplete',
      (polygon: google.maps.Polygon) => {
        // Clear existing polygon from data layer
        if (dataLayer && currentPolygon) {
          dataLayer.remove(currentPolygon)
        }

        // Convert polygon to GeoJSON and add to data layer
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
          geometry: new google.maps.Data.Polygon([coordinates.map(coord => 
            new google.maps.LatLng(coord[1], coord[0])
          )]),
          properties: { name: 'Project Work Area' }
        })

        if (dataLayer) {
          dataLayer.add(newFeature)
          setCurrentPolygon(newFeature)
        }

        // Remove the drawing polygon
        polygon.setMap(null)
        
        // Stop drawing mode
        manager.setDrawingMode(null)
        
        setHasUnsavedChanges(true)
      }
    )

    return () => {
      google.maps.event.removeListener(polygonCompleteListener)
      manager.setMap(null)
    }
  }, [map, isEditMode, dataLayer, currentPolygon])

  // Add edit listeners to existing polygon
  useEffect(() => {
    if (!dataLayer || !currentPolygon || !isEditMode) return

    const addEditListeners = () => {
      const geometry = currentPolygon.getGeometry()
      if (geometry && geometry.getType() === 'Polygon') {
        const polygon = geometry as google.maps.Data.Polygon
        
        // Add listeners for geometry changes
        const listeners = [
          dataLayer.addListener('setgeometry', () => {
            setHasUnsavedChanges(true)
          }),
          dataLayer.addListener('removefeature', () => {
            setHasUnsavedChanges(true)
          })
        ]

        return () => {
          listeners.forEach(listener => google.maps.event.removeListener(listener))
        }
      }
    }

    return addEditListeners()
  }, [dataLayer, currentPolygon, isEditMode])

  // Toggle edit mode
  const toggleEditMode = useCallback(() => {
    if (isEditMode && hasUnsavedChanges) {
      // Show confirmation dialog
      const confirmed = window.confirm(
        'You have unsaved changes. Do you want to discard them?'
      )
      if (!confirmed) return
    }
    
    setIsEditMode(!isEditMode)
    setHasUnsavedChanges(false)
  }, [isEditMode, hasUnsavedChanges])

  // Save changes
  const handleSave = useCallback(async () => {
    if (!currentPolygon || !dataLayer) return

    setIsLoading(true)
    
    try {
      const geometry = currentPolygon.getGeometry()
      if (geometry && geometry.getType() === 'Polygon') {
        const polygon = geometry as google.maps.Data.Polygon
        const coordinates: number[][] = []
        
        polygon.getArray().forEach((linearRing) => {
          linearRing.getArray().forEach((latLng) => {
            coordinates.push([latLng.lng(), latLng.lat()])
          })
        })

        // Save to database if projectId is provided
        if (projectId) {
          const response = await fetch(`/api/projects/${projectId}/area`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              coordinates: coordinates.map(coord => ({
                lat: coord[1], 
                lng: coord[0]
              }))
            }),
          })

          if (!response.ok) {
            throw new Error('Failed to save polygon to database')
          }

          const result = await response.json()
          if (!result.success) {
            throw new Error(result.error || 'Failed to save polygon')
          }
        }

        // Call save callback if provided
        if (onPolygonSave) {
          await onPolygonSave(coordinates)
        }
        
        setHasUnsavedChanges(false)
        setIsEditMode(false)
      }
    } catch (error) {
      console.error('Error saving polygon:', error)
      // Show error message to user
      alert('Failed to save polygon. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [currentPolygon, dataLayer, onPolygonSave, projectId])

  // Cancel changes
  const handleCancel = useCallback(() => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm(
        'Are you sure you want to cancel? All changes will be lost.'
      )
      if (!confirmed) return
    }

    // Reload original polygon
    if (dataLayer) {
      dataLayer.forEach((feature) => {
        dataLayer.remove(feature)
      })

      const projectAreaGeoJSON = {
        type: 'FeatureCollection' as const,
        features: [
          {
            type: 'Feature' as const,
            properties: { name: 'Project Work Area' },
            geometry: {
              type: 'Polygon' as const,
              coordinates: [defaultCoordinates],
            },
          },
        ],
      }

      dataLayer.addGeoJson(projectAreaGeoJSON)
      dataLayer.forEach((feature) => {
        setCurrentPolygon(feature)
      })
    }

    setIsEditMode(false)
    setHasUnsavedChanges(false)
  }, [dataLayer, defaultCoordinates, hasUnsavedChanges])

  if (!editable) return null

  return (
    <div className={cn("absolute top-4 left-4 z-10 flex flex-col gap-2", className)}>
      {/* Loading Initial Data */}
      {loadingInitialData && (
        <div className="bg-white/90 border border-gray-200 rounded-lg p-3 text-sm shadow-md backdrop-blur-sm">
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
          className="bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
          disabled={loadingInitialData}
        >
          <Edit3 className="h-4 w-4 mr-2" />
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
              className="bg-green-600 hover:bg-green-700 text-white shadow-md"
            >
              <Save className="h-4 w-4 mr-2" />
              {isLoading ? 'Saving...' : 'Save'}
            </Button>
            <Button
              onClick={handleCancel}
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white shadow-md backdrop-blur-sm"
            >
              <X className="h-4 w-4 mr-2" />
              Cancel
            </Button>
          </div>

          {/* Edit Mode Info */}
          <div className="bg-blue-50/90 border border-blue-200 rounded-lg p-3 text-sm shadow-md backdrop-blur-sm max-w-xs">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div className="text-blue-800">
                <p className="font-medium mb-1">Edit Mode Active</p>
                <p className="text-xs">
                  • Use drawing tools to create new polygon
                  <br />
                  • Drag points to modify existing area
                  <br />
                  • Double-click polygon to edit vertices
                </p>
              </div>
            </div>
          </div>

          {/* Unsaved Changes Indicator */}
          {hasUnsavedChanges && (
            <div className="bg-amber-50/90 border border-amber-200 rounded-lg p-2 text-sm shadow-md backdrop-blur-sm">
              <div className="flex items-center gap-2 text-amber-800">
                <div className="h-2 w-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span className="text-xs font-medium">Unsaved changes</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
