/**
 * Synthetic satellite imagery for the demo storm, drawn on a canvas with no external images.
 *
 * The storm is built from one logarithmic spiral of rain bands, layered noise and a central dense
 * overcast (CDO). Every channel is derived from the same storm, so IR, WV, MW, SST and the fused
 * view all line up pixel for pixel, and with STORM_GEOMETRY.
 *
 * Coordinates: normalised 0-1, x to the right, y DOWN (canvas convention). The canvas should be
 * square. The storm centre is always at (0.5, 0.5); the image spans roughly 800 km.
 */
import { storm } from '../data/storm'
import { createNoise, type Noise } from './noise'
import { mulberry32 } from './random'

export const SATELLITE_CHANNELS = ['ir', 'wv', 'mw', 'sst', 'fused'] as const
export type SatelliteChannel = (typeof SATELLITE_CHANNELS)[number]

export interface SatelliteOptions {
  channel: SatelliteChannel
  /** Seeds the cloud texture only. The storm geometry never depends on it. */
  seed: number
}

// ---------------------------------------------------------------------------
// Storm geometry (shared by the renderer and by later overlays)
// ---------------------------------------------------------------------------

export interface Point {
  x: number
  y: number
}

export interface Hotspot extends Point {
  /** Radius of influence, in normalised units. */
  radius: number
}

export interface StormGeometry {
  center: Point
  /** Radius of the closed microwave eyewall ring. */
  innerRingRadius: number
  /** Three curved rain-band arcs as polylines, from inner end to outer end. */
  bands: Point[][]
  /** Closed polygon outlining the central dense overcast. */
  cdo: Point[]
  /** Two spots of especially intense convection (hot towers). */
  hotspots: Hotspot[]
}

const TAU = Math.PI * 2
const CX = 0.5
const CY = 0.5

/** Log-spiral growth rate: the tangent of the inflow angle (about 17 degrees). */
const PITCH = 0.3
const COS_PITCH = 1 / Math.sqrt(1 + PITCH * PITCH)
const SPIRAL_REF_R = 0.2
const ARM_PHASE = 0.6
const ARM_SPAN = TAU / 3

const INNER_RING_R = 0.065

/** Radial extent of each of the three spiral arms. The same spiral family, 120 degrees apart. */
const ARMS = [
  { r0: 0.15, r1: 0.44 },
  { r0: 0.17, r1: 0.42 },
  { r0: 0.19, r1: 0.4 },
]

const HOTSPOT_DEFS = [
  { deg: 50, r: 0.105, radius: 0.03 },
  { deg: 232, r: 0.095, radius: 0.026 },
]

/** CDO outline radius at angle th (radians, counter-clockwise on screen). */
function cdoRadius(th: number): number {
  return 0.155 * (1 + 0.08 * Math.sin(2 * th + 0.6) + 0.04 * Math.sin(3 * th + 2.0) + 0.015 * Math.sin(5 * th + 0.3))
}

const polar = (th: number, r: number): Point => ({ x: CX + r * Math.cos(th), y: CY - r * Math.sin(th) })

const HOTSPOTS: Hotspot[] = HOTSPOT_DEFS.map((h) => ({ ...polar((h.deg * Math.PI) / 180, h.r), radius: h.radius }))

function buildGeometry(): StormGeometry {
  const bands = ARMS.map((arm, k) => {
    const steps = 48
    return Array.from({ length: steps + 1 }, (_, i) => {
      const r = arm.r0 * Math.pow(arm.r1 / arm.r0, i / steps)
      // Counter-clockwise cyclone: going outward, the arm trails clockwise.
      const th = ARM_PHASE + k * ARM_SPAN - Math.log(r / SPIRAL_REF_R) / PITCH
      return polar(th, r)
    })
  })
  const cdo = Array.from({ length: 96 }, (_, i) => {
    const th = (i / 96) * TAU
    return polar(th, cdoRadius(th))
  })
  return { center: { x: CX, y: CY }, innerRingRadius: INNER_RING_R, bands, cdo, hotspots: HOTSPOTS }
}

export const STORM_GEOMETRY: StormGeometry = buildGeometry()

// ---------------------------------------------------------------------------
// Small math + colour helpers
// ---------------------------------------------------------------------------

const clamp01 = (x: number) => (x < 0 ? 0 : x > 1 ? 1 : x)
const smoothstep = (a: number, b: number, x: number) => {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

type Stop = [value: number, r: number, g: number, b: number]

const LUT_SIZE = 512

/** Pre-computed colour ramp: RGB triplets for LUT_SIZE evenly spaced values in [min, max]. */
function buildLut(stops: Stop[], min: number, max: number): Uint8ClampedArray {
  const lut = new Uint8ClampedArray(LUT_SIZE * 3)
  for (let i = 0; i < LUT_SIZE; i++) {
    const v = min + ((max - min) * i) / (LUT_SIZE - 1)
    let s = 0
    while (s < stops.length - 2 && v > stops[s + 1][0]) s++
    const [v0, r0, g0, b0] = stops[s]
    const [v1, r1, g1, b1] = stops[s + 1]
    const t = clamp01((v - v0) / (v1 - v0))
    lut[i * 3] = r0 + (r1 - r0) * t
    lut[i * 3 + 1] = g0 + (g1 - g0) * t
    lut[i * 3 + 2] = b0 + (b1 - b0) * t
  }
  return lut
}

class Ramp {
  private readonly lut: Uint8ClampedArray
  private readonly min: number
  private readonly max: number
  constructor(stops: Stop[], min: number, max: number) {
    this.min = min
    this.max = max
    this.lut = buildLut(stops, min, max)
  }
  /** Index of the LUT entry for a value, clamped to the ramp. */
  private index(v: number): number {
    return Math.round(clamp01((v - this.min) / (this.max - this.min)) * (LUT_SIZE - 1)) * 3
  }
  r(v: number) {
    return this.lut[this.index(v)]
  }
  g(v: number) {
    return this.lut[this.index(v) + 1]
  }
  b(v: number) {
    return this.lut[this.index(v) + 2]
  }
}

// IR brightness temperature in kelvin. Colder = taller cloud = hotter colour.
const IR_RAMP = new Ramp(
  [
    [176, 255, 244, 252],
    [184, 255, 150, 210],
    [190, 239, 68, 68],
    [198, 249, 115, 22],
    [206, 250, 204, 21],
    [214, 34, 197, 94],
    [224, 34, 211, 238],
    [234, 59, 130, 246],
    [243, 205, 214, 228],
    [253, 152, 162, 180],
    [266, 90, 100, 118],
    [280, 42, 50, 66],
    [293, 16, 22, 36],
    [306, 5, 8, 16],
  ],
  176,
  306,
)

// Water vapour: 0 = dry (dark), 1 = deep moisture (bright). Blue-grey.
const WV_RAMP = new Ramp(
  [
    [0, 4, 9, 18],
    [0.25, 14, 30, 52],
    [0.5, 44, 72, 104],
    [0.72, 100, 138, 176],
    [0.88, 178, 202, 226],
    [1, 244, 249, 253],
  ],
  0,
  1,
)

// Microwave 89 GHz style: 0 = clear, 1 = strong ice scattering from deep rain.
const MW_RAMP = new Ramp(
  [
    [0, 4, 8, 22],
    [0.14, 10, 24, 66],
    [0.3, 30, 80, 190],
    [0.48, 124, 58, 237],
    [0.66, 217, 70, 239],
    [0.82, 255, 95, 162],
    [1, 255, 241, 190],
  ],
  0,
  1,
)

// Sea surface temperature in degrees Celsius.
const SST_RAMP = new Ramp(
  [
    [26, 11, 29, 77],
    [27, 30, 111, 214],
    [27.7, 34, 211, 238],
    [28.4, 34, 197, 94],
    [29.1, 250, 204, 21],
    [29.8, 249, 115, 22],
    [30.4, 239, 68, 68],
    [31, 185, 28, 92],
  ],
  26,
  31,
)

// ---------------------------------------------------------------------------
// Per-pixel storm evaluation
// ---------------------------------------------------------------------------

/** Values shared by all channels at one pixel. Reused between pixels to avoid allocations. */
interface Px {
  r: number
  th: number
  /** Soft mask of the central dense overcast (1 inside, 0 outside). */
  cdo: number
  /** Rain-band ridge intensity: cloud-shield width (IR), a wider version (WV), a sharper one (MW). */
  band: number
  bandWide: number
  bandNarrow: number
  /** Hot-tower intensity. */
  hot: number
  /** Noise streaked along the spiral, fine noise, and broad noise. All roughly in [-1, 1]. */
  nT: number
  nF: number
  nL: number
}

function evalPixel(u: number, v: number, noise: Noise, g: Px): void {
  const dx = u - CX
  const dy = v - CY
  const r = Math.hypot(dx, dy)
  const th = Math.atan2(-dy, dx)
  const rr = Math.max(r, 0.012)
  const twist = Math.log(rr / SPIRAL_REF_R) / PITCH

  const rc = cdoRadius(th)
  g.cdo = 1 - smoothstep(rc - 0.035, rc + 0.035, r)

  // Noise sampled in "untwisted" coordinates comes out stretched along the spiral.
  const tw = th + twist
  g.nT = noise.fbm((CX + rr * Math.cos(tw)) * 8, (CY - rr * Math.sin(tw)) * 8, 5)
  g.nF = noise.fbm(u * 22 + 5.2, v * 22 + 1.3, 4)
  g.nL = noise.fbm(u * 3 + 11.7, v * 3 + 3.9, 3)

  // Distance to the nearest of the three spiral arms.
  const q = (th + twist - ARM_PHASE) / ARM_SPAN
  const k = Math.round(q)
  const psi = (q - k) * ARM_SPAN + 0.03 * g.nL
  const dist = Math.abs(psi) * r * COS_PITCH
  const arm = ARMS[((k % 3) + 3) % 3]
  const env = smoothstep(arm.r0 - 0.03, arm.r0 + 0.03, r) * (1 - smoothstep(arm.r1 - 0.03, arm.r1 + 0.03, r))
  const w = 0.018 + 0.06 * r
  const ridge = Math.exp(-((dist / w) ** 2))
  g.band = ridge * env
  g.bandWide = Math.pow(ridge, 0.2) * env
  g.bandNarrow = Math.pow(ridge, 3.3) * env

  let hot = 0
  for (const h of HOTSPOTS) {
    const d2 = (u - h.x) ** 2 + (v - h.y) ** 2
    hot = Math.max(hot, Math.exp(-d2 / (h.radius * h.radius)))
  }
  g.hot = hot
  g.r = r
  g.th = th
}

/** Cloud-top height, 0 (no cloud) to 1 (coldest). Drives IR. Deliberately has NO eye. */
function cloudHeight(g: Px): number {
  // Dense overcast: coldest in the middle, grading warmer towards its edge.
  const body = g.cdo * (0.78 + 0.16 * Math.exp(-((g.r / 0.11) ** 2)) + 0.05 * g.nT)
  // Spiral-streaked low/mid cloud that thins out with distance from the centre.
  const spread = Math.exp(-((g.r / 0.42) ** 1.4))
  const swirl = smoothstep(-0.15, 0.55, g.nT + 0.55 * spread - 0.25) * (0.26 + 0.16 * (0.5 + 0.5 * g.nF))
  // Cirrus shield spreading out from the core.
  const shield = 0.42 * Math.exp(-((g.r / 0.3) ** 1.7)) * (0.6 + 0.4 * (0.5 + 0.5 * g.nL))
  const bands = g.band * (0.55 + 0.3 * (0.5 + 0.5 * g.nT) + 0.1 * g.nF)
  const towers = 0.2 * g.hot
  return 1 - (1 - body) * (1 - swirl) * (1 - shield) * (1 - bands) * (1 - towers)
}

/** IR brightness temperature (K) from cloud-top height. Hot towers punch through as colder pockets. */
function irTemperature(h: number, hot: number): number {
  return 300 - 110 * Math.pow(h, 1.1) - 13 * hot
}

/** Microwave scattering, 0-1. Shows a CLOSED eyewall ring that IR cannot see. */
function mwScattering(g: Px): number {
  const az = 0.86 + 0.1 * Math.cos(g.th - 0.7) + 0.05 * Math.sin(3 * g.th + 1.1)
  const dr = (g.r - INNER_RING_R) / 0.017
  const ring = az * (0.94 + 0.06 * g.nF) * Math.exp(-dr * dr)
  const quietEye = smoothstep(INNER_RING_R - 0.035, INNER_RING_R - 0.008, g.r)
  const stratiform = 0.3 * g.cdo * (0.75 + 0.25 * (0.5 + 0.5 * g.nT)) * quietEye
  const bands = 0.7 * g.bandNarrow * (0.6 + 0.4 * (0.5 + 0.5 * g.nT))
  const towers = 0.45 * g.hot
  const background = 0.05 + 0.1 * (0.5 + 0.5 * g.nL)
  return 1 - (1 - ring) * (1 - stratiform) * (1 - bands) * (1 - towers) * (1 - background)
}

// A dry-air pocket south-west of the storm (matches the "dry-air intrusion" driver in the data).
const DRY_COS = Math.cos(1.0)
const DRY_SIN = Math.sin(1.0)

/** Water vapour, 0 (dry) to 1 (moist). Softer than IR. */
function wvValue(g: Px, u: number, v: number, noise: Noise): number {
  const conv = 1 - (1 - 0.8 * g.cdo) * (1 - 0.5 * g.bandWide) * (1 - 0.12 * g.hot)
  const shield = 0.22 * Math.exp(-((g.r / 0.42) ** 1.5))
  const moist = 0.22 + 0.12 * (0.5 + 0.5 * g.nL)
  const streaks = (0.07 + 0.1 * g.cdo) * g.nT

  // Looser outer filaments. Same handedness as the arms: everything rotates counter-clockwise.
  const rr = Math.max(g.r, 0.012)
  const twOut = g.th + 0.7 * (Math.log(rr / SPIRAL_REF_R) / PITCH)
  const nOut = noise.fbm((CX + rr * Math.cos(twOut)) * 6 + 21, (CY - rr * Math.sin(twOut)) * 6 + 8, 4)
  const outflow = 0.13 * smoothstep(0.12, 0.3, g.r) * nOut

  const px = u - 0.19
  const py = v - 0.66
  const a = (px * DRY_COS + py * DRY_SIN) / 0.24
  const b = (-px * DRY_SIN + py * DRY_COS) / 0.1
  const dry = 0.5 * Math.exp(-(a * a + b * b)) * (0.75 + 0.25 * (0.5 + 0.5 * g.nL))

  return clamp01(moist + shield + 0.5 * conv + streaks + outflow - dry)
}

// ---------------------------------------------------------------------------
// Sea surface temperature field
// ---------------------------------------------------------------------------

const SST_FAR_C = 27.3
const POOL_ROT = 0.6
const POOL_COS = Math.cos(POOL_ROT)
const POOL_SIN = Math.sin(POOL_ROT)

/** Warm pool: an ellipse centred slightly ahead (north-west) of the storm. */
function poolShape(u: number, v: number): number {
  const px = u - 0.44
  const py = v - 0.41
  const a = (px * POOL_COS + py * POOL_SIN) / 0.34
  const b = (-px * POOL_SIN + py * POOL_COS) / 0.22
  return Math.exp(-(a * a + b * b))
}
const POOL_AT_CENTER = poolShape(CX, CY)

/** SST in degrees Celsius. Exactly storm.current.sstC at the storm centre. */
function sstAt(u: number, v: number, noise: Noise): number {
  const pool = ((storm.current.sstC - SST_FAR_C) * poolShape(u, v)) / POOL_AT_CENTER
  const d0 = Math.hypot(u - CX, v - CY)
  const eddies = 0.7 * noise.fbm(u * 2.6 + 40, v * 2.6 + 9, 4) * smoothstep(0, 0.08, d0)
  const southWarmer = 0.8 * (v - 0.5)
  return SST_FAR_C + pool + eddies + southWarmer
}

// ---------------------------------------------------------------------------
// Renderer
// ---------------------------------------------------------------------------

/** The little the renderer needs from a canvas: satisfied by both HTMLCanvasElement and OffscreenCanvas (workers). */
export interface DrawableCanvas {
  width: number
  height: number
  getContext(contextId: '2d'): {
    createImageData(width: number, height: number): ImageData
    putImageData(imageData: ImageData, dx: number, dy: number): void
  } | null
}

/** Draws the chosen channel of the demo storm into the canvas (using its current width/height). */
export function renderSatellite(canvas: DrawableCanvas, { channel, seed }: SatelliteOptions): void {
  const W = canvas.width
  const H = canvas.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('renderSatellite: 2D canvas context unavailable')

  const noise = createNoise(seed)
  const grain = mulberry32(seed ^ 0x9e3779b9)
  const image = ctx.createImageData(W, H)
  const out = image.data
  const g: Px = { r: 0, th: 0, cdo: 0, band: 0, bandWide: 0, bandNarrow: 0, hot: 0, nT: 0, nF: 0, nL: 0 }

  const needsSst = channel === 'sst' || channel === 'fused'
  const needsStorm = channel !== 'sst'

  // SST is computed as a whole field first: the map draws temperature contours from its gradient.
  let sst: Float32Array | null = null
  if (needsSst) {
    sst = new Float32Array(W * H)
    for (let j = 0; j < H; j++) {
      for (let i = 0; i < W; i++) sst[j * W + i] = sstAt((i + 0.5) / W, (j + 0.5) / H, noise)
    }
  }

  for (let j = 0; j < H; j++) {
    const v = (j + 0.5) / H
    for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W
      const p = j * W + i
      const o = p * 4
      let red = 0
      let green = 0
      let blue = 0

      if (needsStorm) evalPixel(u, v, noise, g)

      if (channel === 'ir') {
        const t = irTemperature(cloudHeight(g), g.hot) + (grain() - 0.5) * 1.2
        red = IR_RAMP.r(t)
        green = IR_RAMP.g(t)
        blue = IR_RAMP.b(t)
      } else if (channel === 'wv') {
        const w = wvValue(g, u, v, noise)
        red = WV_RAMP.r(w)
        green = WV_RAMP.g(w)
        blue = WV_RAMP.b(w)
      } else if (channel === 'mw') {
        const s = mwScattering(g)
        red = MW_RAMP.r(s)
        green = MW_RAMP.g(s)
        blue = MW_RAMP.b(s)
      } else if (channel === 'sst' && sst) {
        const t = sst[p]
        red = SST_RAMP.r(t)
        green = SST_RAMP.g(t)
        blue = SST_RAMP.b(t)

        // Temperature contours every 0.5 degrees, stronger every whole degree.
        const gxT = (sst[j * W + Math.min(i + 1, W - 1)] - sst[j * W + Math.max(i - 1, 0)]) * 0.5
        const gyT = (sst[Math.min(j + 1, H - 1) * W + i] - sst[Math.max(j - 1, 0) * W + i]) * 0.5
        const slope = Math.hypot(gxT, gyT) + 1e-6
        const level = t / 0.5
        const offLevel = Math.abs(level - Math.round(level))
        const distPx = (offLevel * 0.5) / slope
        const line = 1 - smoothstep(0.35, 1.1, distPx)
        const whole = Math.abs(t - Math.round(t)) < 0.25 ? 0.36 : 0.18
        const a = line * whole
        red += (255 - red) * a
        green += (255 - green) * a
        blue += (255 - blue) * a
      } else if (channel === 'fused' && sst) {
        const h = cloudHeight(g)
        const w = wvValue(g, u, v, noise)
        const s = mwScattering(g)
        const t = sst[p]

        // Dim ocean temperature as the base layer.
        red = SST_RAMP.r(t) * 0.32
        green = SST_RAMP.g(t) * 0.32
        blue = SST_RAMP.b(t) * 0.32

        // Water-vapour moisture as a blue-grey veil.
        const aw = 0.6 * smoothstep(0.2, 0.85, w)
        red += (WV_RAMP.r(w) - red) * aw
        green += (WV_RAMP.g(w) - green) * aw
        blue += (WV_RAMP.b(w) - blue) * aw

        // Cold IR cloud tops as a luminous cyan-white glow.
        const ai = 0.78 * smoothstep(0.38, 0.95, h)
        red += (165 + 75 * h - red) * ai
        green += (222 + 30 * h - green) * ai
        blue += (255 - blue) * ai

        // Microwave scattering on top: the eyewall ring shows through the cloud.
        const am = 0.92 * smoothstep(0.5, 0.86, s)
        red += (MW_RAMP.r(s) - red) * am
        green += (MW_RAMP.g(s) - green) * am
        blue += (MW_RAMP.b(s) - blue) * am
      }

      // Soft vignette so the square image melts into the dark UI.
      const vig = 1 - 0.4 * smoothstep(0.4, 0.74, Math.hypot(u - 0.5, v - 0.5))
      out[o] = red * vig
      out[o + 1] = green * vig
      out[o + 2] = blue * vig
      out[o + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)
}
