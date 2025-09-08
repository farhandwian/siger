import { useEffect } from 'react'
import { useMap } from '@vis.gl/react-google-maps'

export const ProjectAreaBaseLayer = () => {
  const map = useMap()

  useEffect(() => {
    if (!map) return

    // Create a data layer for the project area outline
    const dataLayer = new google.maps.Data({
      map,
      style: {
        fillOpacity: 0,
        strokeColor: '#EF4444', // Red color from the design
        strokeWeight: 2,
        strokeOpacity: 0.8,
      },
    })

    // Mock GeoJSON data for project area outline
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
            coordinates: [
              [
                [105.285, -5.385],
                [105.315, -5.385],
                [105.315, -5.41],
                [105.285, -5.41],
                [105.285, -5.385],
              ],
            ],
          },
        },
      ],
    }

    dataLayer.addGeoJson(projectAreaGeoJSON)

    return () => dataLayer.setMap(null)
  }, [map])

  return null
}
