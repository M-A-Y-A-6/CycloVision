import type { LatLngBoundsLiteral, LatLngTuple } from 'leaflet'

/**
 * Dark basemap: Esri "World Dark Gray" (base, then a transparent reference layer with borders and labels).
 * Works without an API key; the attribution is required. Do NOT switch to CARTO's basemaps.cartocdn.com
 * tiles: they now draw a huge "API KEY REQUIRED" watermark over every tile.
 */
export const TILE_LAYERS: ReadonlyArray<{ url: string; attribution: string }> = [
  {
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Esri, HERE, Garmin, &copy; OpenStreetMap contributors, and the GIS user community',
  },
  {
    url: 'https://services.arcgisonline.com/arcgis/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}',
    attribution: '',
  },
]

/** A 1x1 transparent image shown in place of any tile that fails to load, so a gap never looks broken. */
export const BLANK_TILE =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'

/** What the map frames: the North Indian Ocean, Arabian Sea on the left and Bay of Bengal on the right. */
export const MAP_BOUNDS: LatLngBoundsLiteral = [
  [1, 55],
  [27, 102],
]
export const MAP_PADDING: [number, number] = [6, 6]

/** Fictional satellite coverage footprint: a rounded oval centred over the Indian peninsula. */
export const FOOTPRINT_CENTER = { lat: 14, lon: 78.5 } as const

function ovalFootprint(halfLon: number, halfLat: number, sharpness: number, points: number): LatLngTuple[] {
  return Array.from({ length: points }, (_, i) => {
    const t = (i / points) * Math.PI * 2
    const c = Math.cos(t)
    const s = Math.sin(t)
    // Superellipse: sharpness 2 is an ellipse, higher is closer to a rounded rectangle.
    const x = Math.sign(c) * Math.abs(c) ** (2 / sharpness)
    const y = Math.sign(s) * Math.abs(s) ** (2 / sharpness)
    return [FOOTPRINT_CENTER.lat + halfLat * y, FOOTPRINT_CENTER.lon + halfLon * x]
  })
}

export const FOOTPRINT: LatLngTuple[] = ovalFootprint(21, 12, 2.6, 120)

/** Faint latitude/longitude grid, drawn as lines so the map still looks intentional without tiles. */
export const GRATICULE: LatLngTuple[][] = [
  ...[0, 10, 20, 30].map((lat): LatLngTuple[] => [
    [lat, 30],
    [lat, 130],
  ]),
  ...[50, 60, 70, 80, 90, 100, 110].map((lon): LatLngTuple[] => [
    [-20, lon],
    [50, lon],
  ]),
]
