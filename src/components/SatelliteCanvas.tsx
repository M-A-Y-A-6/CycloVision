import { useEffect, useRef } from 'react'
import type { StormCase } from '../data/cases'
import { getSatelliteBitmap } from '../lib/satelliteBitmap'
import type { SatelliteChannel } from '../lib/satellite'

interface SatelliteCanvasProps {
  channel: SatelliteChannel
  /** Pixel size of the (square) canvas. Use the sizes in config/imagery.ts so images are shared and prewarmed. */
  size: number
  /** Which case's imagery to draw: its seed and geometry keep the case visually consistent across screens. */
  caseData: StormCase
  className?: string
}

/**
 * Shows one channel of a case's satellite imagery. The image is drawn in a background worker
 * (see lib/satelliteBitmap.ts), so it never blocks animations; it appears as soon as it is ready.
 */
export function SatelliteCanvas({ channel, size, caseData, className }: SatelliteCanvasProps) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    let cancelled = false
    getSatelliteBitmap(channel, size, {
      id: caseData.id,
      seed: caseData.seed,
      geometry: caseData.geometry,
      sstCenterC: caseData.currentIntensity.sstC,
    }).then((bitmap) => {
      if (!cancelled) ref.current?.getContext('2d')?.drawImage(bitmap, 0, 0)
    })
    return () => {
      cancelled = true
    }
  }, [channel, size, caseData])

  return <canvas ref={ref} width={size} height={size} className={className} aria-hidden="true" />
}
