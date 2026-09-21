import type { SatelliteChannel } from '../lib/satellite'

/**
 * Pixel sizes of the satellite images the story uses. Screens that share an image must use the same size
 * (the cache is keyed by channel and size), and everything here is drawn ahead of time in the background.
 */
export const THUMB_PX = 128
export const SWIRL_IMAGE_PX = 192
export const STORM_IMAGE_PX = 1024

/** Everything the story's images need, in the order they are needed. */
export const PREWARM: ReadonlyArray<{ channel: SatelliteChannel; size: number }> = [
  { channel: 'ir', size: THUMB_PX },
  { channel: 'wv', size: THUMB_PX },
  { channel: 'mw', size: THUMB_PX },
  { channel: 'sst', size: THUMB_PX },
  { channel: 'wv', size: SWIRL_IMAGE_PX },
  { channel: 'fused', size: STORM_IMAGE_PX },
  // The explanation screen lets the visitor switch between channels, so draw those large images too.
  { channel: 'ir', size: STORM_IMAGE_PX },
  { channel: 'wv', size: STORM_IMAGE_PX },
  { channel: 'mw', size: STORM_IMAGE_PX },
  { channel: 'sst', size: STORM_IMAGE_PX },
]
