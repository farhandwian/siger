// Type declarations for Google Maps Drawing API
declare namespace google.maps.drawing {
  export enum OverlayType {
    CIRCLE = 'circle',
    MARKER = 'marker',
    POLYGON = 'polygon',
    POLYLINE = 'polyline',
    RECTANGLE = 'rectangle',
  }

  export interface DrawingControlOptions {
    position: google.maps.ControlPosition
    drawingModes: OverlayType[]
  }

  export interface DrawingManagerOptions {
    drawingMode?: OverlayType | null
    drawingControl?: boolean
    drawingControlOptions?: DrawingControlOptions
    circleOptions?: google.maps.CircleOptions
    markerOptions?: google.maps.MarkerOptions
    polygonOptions?: google.maps.PolygonOptions
    polylineOptions?: google.maps.PolylineOptions
    rectangleOptions?: google.maps.RectangleOptions
  }

  export class DrawingManager extends google.maps.MVCObject {
    constructor(options?: DrawingManagerOptions)
    
    getDrawingMode(): OverlayType | null
    getMap(): google.maps.Map | null
    
    setDrawingMode(drawingMode: OverlayType | null): void
    setMap(map: google.maps.Map | null): void
    setOptions(options: DrawingManagerOptions): void
  }
}

// Add event listeners for drawing completion
declare namespace google.maps {
  interface DrawingManagerEvents {
    circlecomplete: (circle: google.maps.Circle) => void
    markercomplete: (marker: google.maps.Marker) => void
    overlaycomplete: (event: { type: google.maps.drawing.OverlayType; overlay: any }) => void
    polygoncomplete: (polygon: google.maps.Polygon) => void
    polylinecomplete: (polyline: google.maps.Polyline) => void
    rectanglecomplete: (rectangle: google.maps.Rectangle) => void
  }
}
