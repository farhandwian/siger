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
  projectId,
}: ProjectAreaBaseLayerProps) => {
  const map = useMap()

  // Debug: Log projectId changes
  useEffect(() => {
    console.log('ProjectAreaBaseLayer: projectId changed to:', projectId)
  }, [projectId])

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
    if (!projectId) {
      console.log('loadPolygonData: No projectId provided')
      return null
    }

    try {
      setLoadingInitialData(true)
      console.log('loadPolygonData: Fetching data for projectId:', projectId)
      const response = await fetch(`/api/projects/${projectId}/area`)

      console.log('loadPolygonData: Response status:', response.status)

      if (response.ok) {
        const result = await response.json()

        if (result.success && result.data?.coordinates) {
          return result.data.coordinates
        } else {
        }
      } else {
        console.log('loadPolygonData: Response not ok:', response.status)
      }
    } catch (error) {
      console.error('loadPolygonData: Error loading polygon data:', error)
    } finally {
      setLoadingInitialData(false)
    }

    return null
  }, [projectId])

  // Initialize map layers and load polygon data (only run once when map and projectId are available)
  useEffect(() => {
    console.log(
      'ProjectAreaBaseLayer: useEffect triggered with map:',
      !!map,
      'projectId:',
      projectId
    )
    if (!map || !projectId) {
      console.log('ProjectAreaBaseLayer: Skipping initialization - no map or no projectId')
      return
    }

    const initializeMapData = async () => {
      console.log('initializeMapData: Starting initialization...')
      // Create data layer for displaying the polygon
      const layer = new google.maps.Data({
        map,
        style: feature => ({
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
      console.log('initializeMapData: Using default coordinates:', defaultCoordinates)

      console.log('initializeMapData: Loading polygon data for projectId:', projectId)
      const apiCoordinates = await loadPolygonData()
      console.log('initializeMapData: API coordinates received:', apiCoordinates)

      if (apiCoordinates && Array.isArray(apiCoordinates)) {
        console.log('initializeMapData: Converting API coordinates to map format')
        // Convert from lat/lng objects to coordinate arrays
        coordinates = apiCoordinates.map(coord => [coord.lng, coord.lat])
        console.log('initializeMapData: Converted coordinates:', coordinates)

        // Close the polygon if not already closed
        if (
          coordinates.length > 0 &&
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])
        ) {
          coordinates.push(coordinates[0])
          console.log('initializeMapData: Closed polygon coordinates:', coordinates)
        }
      } else {
        console.log('initializeMapData: No valid API coordinates, using default')
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
    }

    initializeMapData()

    return () => {
      if (dataLayer) {
        dataLayer.setMap(null)
      }
    }
  }, [map, projectId]) // Only run when map or projectId changes

  // Update data layer styling when edit mode changes
  useEffect(() => {
    if (!dataLayer) return

    dataLayer.setStyle(feature => ({
      fillOpacity: isEditMode ? 0.2 : 0.1,
      fillColor: isEditMode ? '#3B82F6' : '#EF4444',
      strokeColor: isEditMode ? '#3B82F6' : '#EF4444',
      strokeWeight: isEditMode ? 3 : 2,
      strokeOpacity: 0.8,
      editable: isEditMode,
      draggable: isEditMode,
      visible: true, // Ensure visibility is controlled
    }))

    // Clean up any drawing polygons when exiting edit mode
    if (!isEditMode && drawingManager) {
      drawingManager.setDrawingMode(null)
    }
  }, [dataLayer, isEditMode, drawingManager])

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
        console.log('POLYGON COMPLETE: New polygon drawn')

        // Clear ALL existing polygons from data layer - robust approach
        if (dataLayer) {
          const featuresToRemove: google.maps.Data.Feature[] = []
          dataLayer.forEach(feature => {
            featuresToRemove.push(feature)
          })
          console.log(`POLYGON COMPLETE: Removing ${featuresToRemove.length} existing features`)
          featuresToRemove.forEach(feature => {
            dataLayer.remove(feature)
          })
        }

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

        if (dataLayer) {
          dataLayer.add(newFeature)
          setCurrentPolygon(newFeature)
          console.log('POLYGON COMPLETE: New feature added to data layer')
        }

        // Remove the drawing polygon
        polygon.setMap(null)
        console.log('POLYGON COMPLETE: Drawing polygon removed')

        // Stop drawing mode
        manager.setDrawingMode(null)
        console.log('POLYGON COMPLETE: Drawing mode stopped')

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
          }),
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
      const confirmed = window.confirm('You have unsaved changes. Do you want to discard them?')
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

        polygon.getArray().forEach(linearRing => {
          linearRing.getArray().forEach(latLng => {
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
        }

        // Call save callback if provided
        if (onPolygonSave) {
          await onPolygonSave(coordinates)
        }

        // COMPLETE MAP RESET APPROACH - Clear everything and reinitialize
        console.log('Save: Starting complete map reset and data refresh')

        // 1. Clear drawing manager and any drawing overlays
        if (drawingManager) {
          drawingManager.setDrawingMode(null)
          drawingManager.setMap(null)
          setDrawingManager(null)
          console.log('Save: Cleared drawing manager')
        }

        // 2. Completely remove and recreate the data layer
        if (dataLayer) {
          // Clear all features
          const featuresToRemove: google.maps.Data.Feature[] = []
          dataLayer.forEach(feature => {
            featuresToRemove.push(feature)
          })
          featuresToRemove.forEach(feature => {
            dataLayer.remove(feature)
          })

          // Remove the data layer from map
          dataLayer.setMap(null)
          console.log('Save: Removed old data layer')
        }

        // 3. Create a completely new data layer
        const newDataLayer = new google.maps.Data({
          map: map!,
          style: feature => ({
            fillOpacity: 0.1,
            fillColor: '#EF4444',
            strokeColor: '#EF4444',
            strokeWeight: 2,
            strokeOpacity: 0.8,
            editable: false,
            draggable: false,
          }),
        })
        setDataLayer(newDataLayer)
        console.log('Save: Created new data layer')

        // 4. Load fresh polygon data from database
        console.log('Save: Loading fresh data from database')
        const freshCoordinates = await loadPolygonData()
        let coordinatesToUse = defaultCoordinates

        if (freshCoordinates && Array.isArray(freshCoordinates)) {
          coordinatesToUse = freshCoordinates.map(coord => [coord.lng, coord.lat])
          // Close the polygon if not already closed
          if (
            coordinatesToUse.length > 0 &&
            (coordinatesToUse[0][0] !== coordinatesToUse[coordinatesToUse.length - 1][0] ||
              coordinatesToUse[0][1] !== coordinatesToUse[coordinatesToUse.length - 1][1])
          ) {
            coordinatesToUse.push(coordinatesToUse[0])
          }
          console.log('Save: Using fresh coordinates from database')
        } else {
          console.log('Save: Using default coordinates as fallback')
        }

        // 5. Add fresh polygon to new data layer
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
                coordinates: [coordinatesToUse],
              },
            },
          ],
        }

        newDataLayer.addGeoJson(projectAreaGeoJSON)

        // Store reference to the new polygon feature
        newDataLayer.forEach(feature => {
          setCurrentPolygon(feature)
        })

        console.log('Save: Added fresh polygon to new data layer')

        // 6. Finally, exit edit mode
        setHasUnsavedChanges(false)
        setIsEditMode(false)

        console.log('Save: Map reset complete - fresh polygon loaded from database')
      }
    } catch (error) {
      console.error('Error saving polygon:', error)
      // Show error message to user
      alert('Failed to save polygon. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [
    currentPolygon,
    dataLayer,
    onPolygonSave,
    projectId,
    map,
    drawingManager,
    loadPolygonData,
    defaultCoordinates,
  ])

  // Cancel changes
  const handleCancel = useCallback(async () => {
    if (hasUnsavedChanges) {
      const confirmed = window.confirm('Are you sure you want to cancel? All changes will be lost.')
      if (!confirmed) return
    }

    console.log('Cancel: Starting complete map reset to original state')

    // 1. Clear drawing manager and any drawing overlays
    if (drawingManager) {
      drawingManager.setDrawingMode(null)
      drawingManager.setMap(null)
      setDrawingManager(null)
      console.log('Cancel: Cleared drawing manager')
    }

    // 2. Completely remove and recreate the data layer
    if (dataLayer) {
      // Clear all features
      const featuresToRemove: google.maps.Data.Feature[] = []
      dataLayer.forEach(feature => {
        featuresToRemove.push(feature)
      })
      featuresToRemove.forEach(feature => {
        dataLayer.remove(feature)
      })

      // Remove the data layer from map
      dataLayer.setMap(null)
      console.log('Cancel: Removed old data layer')
    }

    // 3. Create a completely new data layer
    const newDataLayer = new google.maps.Data({
      map: map!,
      style: feature => ({
        fillOpacity: 0.1,
        fillColor: '#EF4444',
        strokeColor: '#EF4444',
        strokeWeight: 2,
        strokeOpacity: 0.8,
        editable: false,
        draggable: false,
      }),
    })
    setDataLayer(newDataLayer)
    console.log('Cancel: Created new data layer')

    // 4. Load original polygon data from database or use default
    let coordinates = defaultCoordinates

    if (projectId) {
      const apiCoordinates = await loadPolygonData()
      if (apiCoordinates && Array.isArray(apiCoordinates)) {
        coordinates = apiCoordinates.map(coord => [coord.lng, coord.lat])
        // Close the polygon if not already closed
        if (
          coordinates.length > 0 &&
          (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
            coordinates[0][1] !== coordinates[coordinates.length - 1][1])
        ) {
          coordinates.push(coordinates[0])
        }
        console.log('Cancel: Using saved coordinates from database')
      } else {
        console.log('Cancel: Using default coordinates')
      }
    }

    // 5. Add original polygon to new data layer
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

    newDataLayer.addGeoJson(projectAreaGeoJSON)

    // Store reference to the restored polygon feature
    newDataLayer.forEach(feature => {
      setCurrentPolygon(feature)
    })

    console.log('Cancel: Restored original polygon')

    setIsEditMode(false)
    setHasUnsavedChanges(false)
  }, [
    dataLayer,
    defaultCoordinates,
    hasUnsavedChanges,
    projectId,
    loadPolygonData,
    map,
    drawingManager,
  ])

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
