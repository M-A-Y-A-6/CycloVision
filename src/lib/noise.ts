import { mulberry32 } from './random'

export interface Noise {
  /** Single-octave gradient noise, roughly in [-1, 1]. */
  perlin(x: number, y: number): number
  /** Fractal (layered) noise, normalised to roughly [-1, 1]. */
  fbm(x: number, y: number, octaves?: number): number
}

const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** Seeded 2D gradient noise: the same seed always produces the same texture. */
export function createNoise(seed: number): Noise {
  const rand = mulberry32(seed)

  const perm = new Uint8Array(512)
  const order = Array.from({ length: 256 }, (_, i) => i)
  for (let i = 255; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[order[i], order[j]] = [order[j], order[i]]
  }
  for (let i = 0; i < 512; i++) perm[i] = order[i & 255]

  const gx = new Float32Array(256)
  const gy = new Float32Array(256)
  for (let i = 0; i < 256; i++) {
    const a = rand() * Math.PI * 2
    gx[i] = Math.cos(a)
    gy[i] = Math.sin(a)
  }

  function perlin(x: number, y: number): number {
    const xf0 = Math.floor(x)
    const yf0 = Math.floor(y)
    const xf = x - xf0
    const yf = y - yf0
    const xi = xf0 & 255
    const yi = yf0 & 255

    const g00 = perm[perm[xi] + yi]
    const g10 = perm[perm[xi + 1] + yi]
    const g01 = perm[perm[xi] + yi + 1]
    const g11 = perm[perm[xi + 1] + yi + 1]

    const n00 = gx[g00] * xf + gy[g00] * yf
    const n10 = gx[g10] * (xf - 1) + gy[g10] * yf
    const n01 = gx[g01] * xf + gy[g01] * (yf - 1)
    const n11 = gx[g11] * (xf - 1) + gy[g11] * (yf - 1)

    const u = fade(xf)
    const v = fade(yf)
    const top = n00 + u * (n10 - n00)
    const bottom = n01 + u * (n11 - n01)
    return (top + v * (bottom - top)) * 1.4142
  }

  function fbm(x: number, y: number, octaves = 5): number {
    let sum = 0
    let amp = 1
    let freq = 1
    let norm = 0
    for (let i = 0; i < octaves; i++) {
      sum += amp * perlin(x * freq + i * 17.3, y * freq - i * 9.1)
      norm += amp
      amp *= 0.5
      freq *= 2
    }
    return sum / norm
  }

  return { perlin, fbm }
}
