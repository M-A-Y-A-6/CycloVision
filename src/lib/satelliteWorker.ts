/**
 * Web Worker that draws satellite imagery off the main thread, so heavy renders (the 1024 px fused image
 * takes over a second) never freeze animations. Talk to it through lib/satelliteBitmap.ts, not directly.
 */
import { renderSatellite, type SatelliteChannel } from './satellite'

export interface SatelliteRequest {
  id: number
  channel: SatelliteChannel
  seed: number
  size: number
}

self.onmessage = (event: MessageEvent<SatelliteRequest>) => {
  const { id, channel, seed, size } = event.data
  const canvas = new OffscreenCanvas(size, size)
  renderSatellite(canvas, { channel, seed })
  const bitmap = canvas.transferToImageBitmap()
  self.postMessage({ id, bitmap }, { transfer: [bitmap] })
}
