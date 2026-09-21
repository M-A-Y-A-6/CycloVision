import { useEffect, useRef } from 'react'
import type { SatelliteChannel } from '../lib/satellite'
import { getSatelliteBitmap } from '../lib/satelliteBitmap'

interface SatelliteCanvasProps {
  channel: SatelliteChannel
  /** Pixel size of the (square) canvas. Use the sizes in config/imagery.ts so images are shared and prewarmed. */
  size: number
  className?: string
}

/**
 * Shows one channel of the demo storm's satellite imagery. The image is drawn in a background worker
 * (see lib/satelliteBitmap.ts), so it never blocks animations; it appears as soon as it is ready.
 */
export function SatelliteCanvas({ channel, size, className }: SatelliteCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    getSatelliteBitmap(channel, size).then((bitmap) => {
      if (!cancelled) ref.current?.getContext('2d')?.drawImage(bitmap, 0, 0)
    })
    return () => {
      cancelled = true
    }
  }, [channel, size])

  return <canvas ref={ref} width={size} height={size} className={className} aria-hidden="true" />
}
