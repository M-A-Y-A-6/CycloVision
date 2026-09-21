import type { Map as LeafletMap } from 'leaflet'
import { useState, type ReactNode } from 'react'
import { AttributionControl, MapContainer, Polygon, Polyline, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import {
  BLANK_TILE,
  FOOTPRINT,
  FOOTPRINT_CENTER,
  GRATICULE,
  MAP_BOUNDS,
  MAP_PADDING,
  TILE_LAYERS,
} from '../config/map'
import { cn } from '../lib/cn'

// Leaflet path colours must be literal values: these are the design tokens `accent` and `muted`.
const ACCENT = '#22d3ee'
const MUTED = '#8494b0'

/** Keeps the whole monitoring area in frame if the window is resized. */
function KeepInFrame() {
  const map = useMap()
  useMapEvents({
    resize: () => map.fitBounds(MAP_BOUNDS, { padding: MAP_PADDING, animate: false }),
  })
  return null
}

interface SweepGeometry {
  cx: number
  cy: number
  /** Distance from the footprint centre to its farthest point, in pixels. */
  reach: number
  /** Half the footprint height in pixels: sets the range rings. */
  halfHeight: number
  clipPath: string
}

/** Where the footprint currently is on screen, in pixels relative to the map container. */
function measureFootprint(map: LeafletMap): SweepGeometry {
  const points = FOOTPRINT.map(([lat, lon]) => map.latLngToContainerPoint([lat, lon]))
  const c = map.latLngToContainerPoint([FOOTPRINT_CENTER.lat, FOOTPRINT_CENTER.lon])
  return {
    cx: c.x,
    cy: c.y,
    reach: Math.max(...points.map((p) => Math.hypot(p.x - c.x, p.y - c.y))),
    halfHeight: Math.max(...points.map((p) => Math.abs(p.y - c.y))),
    clipPath: `polygon(${points.map((p) => `${p.x.toFixed(1)}px ${p.y.toFixed(1)}px`).join(',')})`,
  }
}

/**
 * Slow radar sweep, clipped to the footprint outline. It is a plain DOM overlay, positioned with the
 * map's own projection so it lines up with the footprint drawn by Leaflet.
 */
function RadarSweep() {
  const map = useMap()
  // The map already has its view when its children render, so the footprint can be measured right away.
  const [geo, setGeo] = useState(() => measureFootprint(map))
  useMapEvents({ moveend: () => setGeo(measureFootprint(map)) })

  const { cx, cy, reach, halfHeight, clipPath } = geo

  return (
    <div className="pointer-events-none absolute inset-0 z-[450]" style={{ clipPath }} aria-hidden="true">
      {[1 / 3, 2 / 3, 1].map((k) => (
        <span
          key={k}
          className="absolute rounded-full border border-accent/15"
          style={{ left: cx - halfHeight * k, top: cy - halfHeight * k, width: halfHeight * 2 * k, height: halfHeight * 2 * k }}
        />
      ))}
      {/* Beam: bright leading edge at the top, fading tail behind it. Turns counter-clockwise. */}
      <div
        className="absolute animate-sweep-ccw rounded-full motion-reduce:animate-none"
        style={{
          left: cx - reach,
          top: cy - reach,
          width: reach * 2,
          height: reach * 2,
          background:
            'conic-gradient(from 0deg, rgb(34 211 238 / 0.75) 0deg, rgb(34 211 238 / 0.32) 1.5deg, rgb(34 211 238 / 0) 80deg, transparent 80deg 360deg)',
        }}
      />
    </div>
  )
}

/**
 * The satellite monitoring area: dark map of the North Indian Ocean, the coverage footprint and a radar
 * sweep. If the map tiles cannot load (offline), the dark background, grid, footprint and sweep remain.
 */
export function MonitoringMap({
  className,
  children,
  showLabel = true,
}: {
  className?: string
  children?: ReactNode
  /** The "Monitoring area" label; it fades out when false. */
  showLabel?: boolean
}) {
  return (
    <div className={cn('relative overflow-hidden bg-base', className)}>
      <MapContainer
        bounds={MAP_BOUNDS}
        boundsOptions={{ padding: MAP_PADDING }}
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
        {GRATICULE.map((line, i) => (
          <Polyline
            key={i}
            positions={line}
            pathOptions={{ color: MUTED, weight: 1, opacity: 0.16, dashArray: '2 7', interactive: false }}
          />
        ))}
        <Polygon
          positions={FOOTPRINT}
          pathOptions={{
            color: ACCENT,
            weight: 1.5,
            opacity: 0.85,
            dashArray: '8 6',
            fillColor: ACCENT,
            fillOpacity: 0.04,
            interactive: false,
          }}
        />
        <RadarSweep />
        {/* Anything passed in (see MapAnchor) is drawn on top of the map, in the same coordinates. */}
        {children}
        <KeepInFrame />
        <AttributionControl position="bottomright" prefix={false} />
      </MapContainer>

      <span
        className={cn(
          'absolute top-3 left-3 z-[500] inline-flex items-center gap-2 rounded-full border border-line bg-base/75 px-3 py-1 text-[11px] font-medium tracking-[0.16em] text-ink/85 uppercase backdrop-blur transition-opacity duration-500',
          !showLabel && 'opacity-0',
        )}
      >
        <span className="size-1.5 rounded-full bg-accent" />
        Monitoring area
      </span>
    </div>
  )
}
