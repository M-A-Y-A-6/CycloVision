import { STORM_SEED } from '../data/storm'
import { renderSatellite, type SatelliteChannel } from './satellite'
import type { SatelliteRequest } from './satelliteWorker'

/**
 * Satellite images as ImageBitmaps, drawn once in a Web Worker and cached. Ask for the same channel and
 * size twice and the second call returns the same bitmap instantly, so several screens can share one render.
 * If workers are unavailable, it falls back to drawing on the main thread.
 */

const BIG_IMAGE_PX = 512 // big images get their own worker so they never hold up the small ones

interface Pending {
  resolve: (bitmap: ImageBitmap) => void
  reject: (error: unknown) => void
}

const workers: Array<Worker | undefined> = [undefined, undefined]
const pending = new Map<number, Pending>()
const cache = new Map<string, Promise<ImageBitmap>>()
let nextId = 0

function workerFor(size: number): Worker {
  const index = size >= BIG_IMAGE_PX ? 1 : 0
  let worker = workers[index]
  if (!worker) {
    worker = new Worker(new URL('./satelliteWorker.ts', import.meta.url), { type: 'module' })
    worker.onmessage = (event: MessageEvent<{ id: number; bitmap: ImageBitmap }>) => {
      pending.get(event.data.id)?.resolve(event.data.bitmap)
      pending.delete(event.data.id)
    }
    worker.onerror = (event) => {
      pending.forEach((p) => p.reject(event))
      pending.clear()
      workers[index] = undefined
    }
    workers[index] = worker
  }
  return worker
}

function renderInWorker(channel: SatelliteChannel, size: number): Promise<ImageBitmap> {
  return new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    const request: SatelliteRequest = { id, channel, seed: STORM_SEED, size }
    workerFor(size).postMessage(request)
  })
}

function renderOnMainThread(channel: SatelliteChannel, size: number): Promise<ImageBitmap> {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  renderSatellite(canvas, { channel, seed: STORM_SEED })
  return createImageBitmap(canvas)
}

export function getSatelliteBitmap(channel: SatelliteChannel, size: number): Promise<ImageBitmap> {
  const key = `${channel}:${size}`
  let bitmap = cache.get(key)
  if (!bitmap) {
    const canWorker = typeof Worker !== 'undefined' && typeof OffscreenCanvas !== 'undefined'
    bitmap = (canWorker ? renderInWorker(channel, size) : renderOnMainThread(channel, size)).catch(() =>
      renderOnMainThread(channel, size),
    )
    cache.set(key, bitmap)
  }
  return bitmap
}

/** Start drawing an image in the background so it is ready when a later screen needs it. */
export function prewarmSatellite(channel: SatelliteChannel, size: number): void {
  void getSatelliteBitmap(channel, size)
}
