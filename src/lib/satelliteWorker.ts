/**
 * Web Worker that draws satellite imagery off the main thread, so heavy renders (the 1024 px fused image
 * takes over a second) never freeze animations. Talk to it through lib/satelliteBitmap.ts, not directly.
 */
import { renderSatellite, type SatelliteChannel, type StormGeometry } from './satellite'

export interface SatelliteRequest {
  id: number
  channel: SatelliteChannel
  seed: number
  size: number
  /** The requesting case's own eyewall/hotspot geometry and SST centre, so cases render distinctly. */
  geometry?: StormGeometry
  sstCenterC?: number
}

self.onmessage = (event: MessageEvent<SatelliteRequest>) => {
  const { id, channel, seed, size, geometry, sstCenterC } = event.data
  const canvas = new OffscreenCanvas(size, size)
  renderSatellite(canvas, { channel, seed, geometry, sstCenterC })
  const bitmap = canvas.transferToImageBitmap()
  self.postMessage({ id, bitmap }, { transfer: [bitmap] })
}
