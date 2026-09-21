import type { ReactNode } from 'react'
import { useState } from 'react'
import { useMap, useMapEvents } from 'react-leaflet'

interface MapAnchorProps {
  lat: number
  lon: number
  children: ReactNode
  className?: string
  /** Above the radar sweep (450) by default. */
  zIndex?: number
}

/**
 * Pins its children, centred, to a latitude/longitude on the map. Use it inside <MonitoringMap>.
 * The children are plain DOM, so they can use framer-motion, canvases and CSS blend modes.
 */
export function MapAnchor({ lat, lon, children, className, zIndex = 460 }: MapAnchorProps) {
  const map = useMap()
  const [point, setPoint] = useState(() => map.latLngToContainerPoint([lat, lon]))
  useMapEvents({ moveend: () => setPoint(map.latLngToContainerPoint([lat, lon])) })

  return (
    <div
      className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 ${className ?? ''}`}
      style={{ left: point.x, top: point.y, zIndex }}
    >
      {children}
    </div>
  )
}
