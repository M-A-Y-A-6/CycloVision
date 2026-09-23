import type { LatLngBoundsLiteral, LatLngTuple } from 'leaflet'
import { AttributionControl, Circle, CircleMarker, MapContainer, Polyline, TileLayer } from 'react-leaflet'
import { BLANK_TILE, TILE_LAYERS } from '../config/map'
import type { StormCase } from '../data/cases'
import { cn } from '../lib/cn'

// Leaflet path colours must be literal values: these are the design tokens muted, accent and amber.
const MUTED = '#8494b0'
const ACCENT = '#22d3ee'
const AMBER = '#f59e0b'

/**
 * The full Track tab map: reuses the same dark Esri tiles as MonitoringMap (config/map.ts), but framed to
 * the case's own track rather than the fixed monitoring footprint. Past positions (solid muted line, small
 * dots) lead into the current centre (accent dot), then a dashed amber line runs out to the forecast
 * positions (amber dots), each wrapped in a translucent circle sized by its own `uncertaintyRadiusKm` — the
 * widening uncertainty cone. Static (no drag/zoom), like every other map in this app.
 */
export function TrackMap({ caseData, className }: { caseData: StormCase; className?: string }) {
  const { pastPositions, forecastPositions } = caseData.precomputed.track
  const current = caseData.center

  const pastLine: LatLngTuple[] = [...pastPositions.map((p): LatLngTuple => [p.lat, p.lon]), [current.lat, current.lon]]
  const forecastLine: LatLngTuple[] = [[current.lat, current.lon], ...forecastPositions.map((p): LatLngTuple => [p.lat, p.lon])]

  const allLats = [...pastLine, ...forecastLine].map((p) => p[0])
  const allLons = [...pastLine, ...forecastLine].map((p) => p[1])
  const padDeg = 1.4
  const bounds: LatLngBoundsLiteral = [
    [Math.min(...allLats) - padDeg, Math.min(...allLons) - padDeg],
    [Math.max(...allLats) + padDeg, Math.max(...allLons) + padDeg],
  ]

  return (
    <div className={cn('relative overflow-hidden bg-base', className)}>
      <MapContainer
        bounds={bounds}
        boundsOptions={{ padding: [16, 16] }}
        zoomSnap={0.1}
        zoomControl={false}
        attributionControl={false}
        dragging={false}
        scrollWheelZoom={false}
        doubleClickZoom={false}
        touchZoom={false}
        boxZoom={false}
        keyboard={false}
        className="size-full"
      >
        {TILE_LAYERS.map((layer) => (
          <TileLayer key={layer.url} url={layer.url} attribution={layer.attribution} errorTileUrl={BLANK_TILE} />
        ))}

        {/* Widening uncertainty cone: one circle per forecast point, radius in metres (Leaflet's native unit). */}
        {forecastPositions.map((p) => (
          <Circle
            key={p.label}
            center={[p.lat, p.lon]}
            radius={p.uncertaintyRadiusKm * 1000}
            pathOptions={{ color: ACCENT, weight: 1, opacity: 0.45, fillColor: ACCENT, fillOpacity: 0.07, interactive: false }}
          />
        ))}

        <Polyline positions={pastLine} pathOptions={{ color: MUTED, weight: 2, opacity: 0.8, interactive: false }} />
        <Polyline positions={forecastLine} pathOptions={{ color: AMBER, weight: 2, opacity: 0.85, dashArray: '7 6', interactive: false }} />

        {pastPositions.map((p) => (
          <CircleMarker key={p.label} center={[p.lat, p.lon]} radius={3} pathOptions={{ color: MUTED, fillColor: MUTED, fillOpacity: 1, interactive: false }} />
        ))}
        <CircleMarker center={[current.lat, current.lon]} radius={5} pathOptions={{ color: ACCENT, fillColor: ACCENT, fillOpacity: 1, interactive: false }} />
        {forecastPositions.map((p) => (
          <CircleMarker key={p.label} center={[p.lat, p.lon]} radius={3} pathOptions={{ color: AMBER, fillColor: AMBER, fillOpacity: 1, interactive: false }} />
        ))}

        <AttributionControl position="bottomright" prefix={false} />
      </MapContainer>
    </div>
  )
}
