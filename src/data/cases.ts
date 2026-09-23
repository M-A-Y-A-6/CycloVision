/**
 * RANDOM GENERATION. Every simulation is a freshly generated, entirely fictional storm — no real name, no
 * real event. `generateStormCase(seed)` builds one deterministically from a single numeric seed (so the
 * same seed always reproduces the same storm, matching the rest of this demo's "seeded, so identical every
 * run" rule); the seed itself is picked fresh from `Math.random()` once per "Simulate Cyclone" click (see
 * store/story.ts), so no two simulations run the same storm.
 *
 * The generator picks a basin (Bay of Bengal or Arabian Sea), a plausible position within it close enough
 * to India's coastline to be on a track that could affect India, a plausible intensity/structure/RI outcome,
 * and then derives everything else (ensemble, classification, explainability, track, consensus, alert text)
 * from those few random draws, the same way the old hand-authored cases derived their fields from a compact
 * spec — reusing that exact derivation machinery (buildEnsemble, imdCategory, riRiskLevel, the satellite
 * geometry helpers) unchanged.
 *
 * Shape: `precomputed` matches, field for field, the shape used by every consumer of a case
 * (identification / classification / riPrediction / explainability / track / consensus / alertText). The
 * fields outside `precomputed` (center, movement, currentIntensity, ensemble, geometry, basin, seed) are
 * what the Detect/Identify/Classify/Predict/Explain screens read directly.
 */
import { buildGeometry, boundingBoxFor, hotspotAt, type Hotspot, type StormGeometry } from '../lib/satellite'
import { mulberry32 } from '../lib/random'

export type Basin = 'Bay of Bengal' | 'Arabian Sea'
export type RiRiskLevel = 'Low' | 'Moderate' | 'Elevated' | 'High'

/** Under 25% Low, 25-50% Moderate, 50-75% Elevated, over 75% High. */
export const RI_RISK_LEVELS: ReadonlyArray<{ level: RiRiskLevel; range: string }> = [
  { level: 'Low', range: 'under 25%' },
  { level: 'Moderate', range: '25-50%' },
  { level: 'Elevated', range: '50-75%' },
  { level: 'High', range: 'over 75%' },
]

export function riRiskLevel(probabilityPct: number): RiRiskLevel {
  if (probabilityPct < 25) return 'Low'
  if (probabilityPct < 50) return 'Moderate'
  if (probabilityPct <= 75) return 'Elevated'
  return 'High'
}

/** IMD-style intensity categories by maximum sustained wind (knots). */
export function imdCategory(windKt: number): string {
  if (windKt < 17) return 'Low Pressure Area'
  if (windKt < 28) return 'Depression'
  if (windKt < 34) return 'Deep Depression'
  if (windKt < 48) return 'Cyclonic Storm'
  if (windKt < 64) return 'Severe Cyclonic Storm'
  if (windKt < 90) return 'Very Severe Cyclonic Storm'
  if (windKt < 120) return 'Extremely Severe Cyclonic Storm'
  return 'Super Cyclonic Storm'
}

// ---------------------------------------------------------------------------
// Ensemble builder (30 members, seeded, exact RI counts by construction, not by chance)
// ---------------------------------------------------------------------------

export const RI_THRESHOLD_KT = 30
export const RI_WINDOW_HOURS = 24
export const RI_PACE_CHECK_HOUR = 12
const ENSEMBLE_SIZE = 30
const HOURS = Array.from({ length: RI_WINDOW_HOURS + 1 }, (_, h) => h)

const round1 = (x: number) => Math.round(x * 10) / 10

/** Linear-interpolated percentile (0-1) of a list of numbers. */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = p * (sorted.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

export interface Ensemble {
  memberCount: number
  hours: number[]
  startWindKt: number
  /** Wind in knots: paths[member][hour]. */
  paths: number[][]
  medianKt: number[]
  /** 10th and 90th percentile across members: the uncertainty band. */
  p10Kt: number[]
  p90Kt: number[]
}

/**
 * Builds a 30-member ensemble whose RI counts are EXACTLY `rapid24` (gain >= 30 kt by hour 24) and
 * `pace12` (on an RI-consistent pace, gain >= 15 kt, by hour 12) — by construction, not by chance.
 * `pace12` members are always a subset of `rapid24`.
 */
function buildEnsemble(seed: number, startKt: number, rapid24: number, pace12: number): Ensemble {
  if (pace12 > rapid24) throw new Error('buildEnsemble: pace12 must be <= rapid24')
  const rand = mulberry32(seed)
  const between = (a: number, b: number) => a + (b - a) * rand()

  const targets: Array<[gain12: number, gain24: number]> = []
  for (let i = 0; i < pace12; i++) {
    const g12 = between(16, 25)
    targets.push([g12, Math.max(g12 + 8, between(32, 54))])
  }
  for (let i = 0; i < rapid24 - pace12; i++) targets.push([between(6, 12.5), between(32, 42)])
  for (let i = 0; i < ENSEMBLE_SIZE - rapid24; i++) targets.push([between(-3, 11), between(-8, 25)])

  // Shuffle so the member index tells nothing about its group.
  for (let i = targets.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[targets[i], targets[j]] = [targets[j], targets[i]]
  }

  const paths = targets.map(([g12, g24]) => {
    // Quadratic through (0, 0), (12, g12), (24, g24) plus small wiggles that vanish at hours 0, 12, 24.
    const b = (g24 - 2 * g12) / 288
    const a = (g12 - 144 * b) / 12
    const w1 = between(-2, 2)
    const w2 = between(-1, 1)
    const w3 = between(-0.6, 0.6)
    return HOURS.map((t) =>
      round1(
        startKt +
          a * t +
          b * t * t +
          w1 * Math.sin((Math.PI * t) / 12) +
          w2 * Math.sin((Math.PI * t) / 6) +
          w3 * Math.sin((Math.PI * t) / 4),
      ),
    )
  })

  const atHour = (h: number) => paths.map((p) => p[h])
  return {
    memberCount: ENSEMBLE_SIZE,
    hours: HOURS,
    startWindKt: startKt,
    paths,
    medianKt: HOURS.map((h) => round1(percentile(atHour(h), 0.5))),
    p10Kt: HOURS.map((h) => round1(percentile(atHour(h), 0.1))),
    p90Kt: HOURS.map((h) => round1(percentile(atHour(h), 0.9))),
  }
}

// ---------------------------------------------------------------------------
// Shared shapes
// ---------------------------------------------------------------------------

export interface ShapFeature {
  name: string
  /** Signed contribution to the RI probability, in percentage points. */
  contribution: number
  description: string
}

export interface TrackPoint {
  lat: number
  lon: number
  label: string
}

export interface ForecastPoint extends TrackPoint {
  hoursAhead: number
  uncertaintyRadiusKm: number
}

export interface StormCase {
  /** Stable per-generated-storm id (the seed, stringified) — keys the satellite-image cache. */
  id: string
  basin: Basin
  seed: number

  center: { lat: number; lon: number }
  movement: { directionLabel: string; headingDeg: number; speedKmh: number }
  currentIntensity: { maxWindKt: number; minPressureHpa: number; sstC: number; windShearKt: number }
  ensemble: Ensemble
  /** This storm's rendered satellite geometry — its own eyewall ring size and hotspot positions. */
  geometry: StormGeometry

  precomputed: {
    identification: {
      /** Normalised [x, y, w, h] around the detected cloud mass. */
      boundingBox: [number, number, number, number]
      confidence: number
      centerCoords: { lat: number; lon: number }
    }
    classification: {
      category: string
      confidence: number
      basinHeadUsed: string
    }
    riPrediction: {
      probability24h: number
      probability12h: number
      uncertaintyRange: { low: number; high: number }
      /** Unsigned magnitude + unit, e.g. "45 km/h" — Predict supplies the "+" and the time window. */
      deltaIntensity: string
      ensemblePasses: number
      /** 5-6 past probability readings leading up to the current one, oldest first. */
      trend: number[]
    }
    explainability: {
      gradCamHotspots: Hotspot[]
      shapFeatures: ShapFeature[]
      attentionSummary: string
      uncertaintyBand: { low: number; high: number }
      plainLanguageExplanation: string
    }
    track: {
      pastPositions: TrackPoint[]
      forecastPositions: ForecastPoint[]
      landfallEta: string
    }
    consensus: { imd: number; adt: number; satcon: number; jtwc: number; note: string }
    alertText: { headline: string; body: string; severity: RiRiskLevel }
  }
}

const KT_TO_KMH = 1.852

// ---------------------------------------------------------------------------
// Random-generation plausibility ranges
// ---------------------------------------------------------------------------

/** Bay of Bengal and Arabian Sea boxes, chosen close enough to India's coastline that a storm generated
 *  anywhere inside them is plausibly on a track that could affect India (anchored on the real spread of
 *  recent North Indian Ocean storms, without naming or reproducing any specific one). */
const BASIN_BOX: Record<Basin, { latMin: number; latMax: number; lonMin: number; lonMax: number }> = {
  'Bay of Bengal': { latMin: 8, latMax: 20, lonMin: 82, lonMax: 92 },
  'Arabian Sea': { latMin: 10, latMax: 22, lonMin: 65, lonMax: 75 },
}

/** Indian coastal stretches a generated storm's forecast track can plausibly head toward, per basin. */
const COASTAL_TARGETS: Record<Basin, string[]> = {
  'Bay of Bengal': ['Odisha coast', 'West Bengal coast', 'Andhra Pradesh coast', 'Tamil Nadu coast'],
  'Arabian Sea': ['Gujarat coast', 'Maharashtra coast', 'Konkan coast', 'Kerala coast'],
}

/** Landward heading range per basin (degrees), so a generated storm's movement plausibly closes on India. */
const HEADING_RANGE: Record<Basin, [number, number]> = {
  'Bay of Bengal': [300, 40], // NW through N to NE, toward the eastern coastline
  'Arabian Sea': [340, 60], // NNW through N to ENE, toward the western coastline
}

const DIRECTION_LABELS: ReadonlyArray<{ max: number; label: string }> = [
  { max: 11.25, label: 'N' },
  { max: 33.75, label: 'NNE' },
  { max: 56.25, label: 'NE' },
  { max: 78.75, label: 'ENE' },
  { max: 101.25, label: 'E' },
  { max: 123.75, label: 'ESE' },
  { max: 146.25, label: 'SE' },
  { max: 168.75, label: 'SSE' },
  { max: 191.25, label: 'S' },
  { max: 213.75, label: 'SSW' },
  { max: 236.25, label: 'SW' },
  { max: 258.75, label: 'WSW' },
  { max: 281.25, label: 'W' },
  { max: 303.75, label: 'WNW' },
  { max: 326.25, label: 'NW' },
  { max: 348.75, label: 'NNW' },
  { max: 360, label: 'N' },
]

function directionLabelFor(headingDeg: number): string {
  const found = DIRECTION_LABELS.find((d) => headingDeg <= d.max)
  return found ? found.label : 'N'
}

/** Builds one randomly generated storm case, deriving everything from a single seed. Same seed, same storm. */
export function generateStormCase(seed: number): StormCase {
  const rand = mulberry32(seed)
  const between = (a: number, b: number) => a + (b - a) * rand()
  const pick = <T,>(items: readonly T[]): T => items[Math.floor(rand() * items.length)]

  const basin: Basin = rand() < 0.5 ? 'Bay of Bengal' : 'Arabian Sea'
  const box = BASIN_BOX[basin]
  const center = { lat: round1(between(box.latMin, box.latMax)), lon: round1(between(box.lonMin, box.lonMax)) }

  const [hMin, hMax] = HEADING_RANGE[basin]
  const headingDeg = Math.round(hMin > hMax ? (between(hMin, hMax + 360) % 360) : between(hMin, hMax))
  const speedKmh = Math.round(between(7, 24))
  const movement = { directionLabel: directionLabelFor(headingDeg), headingDeg, speedKmh }

  // Favourability: how much SST and shear favour rapid strengthening, each in [0, 1].
  const sstC = round1(between(27.8, 31.2))
  const windShearKt = Math.round(between(3, 20))
  const sstFavor = Math.max(0, Math.min(1, (sstC - 27.8) / (31.2 - 27.8)))
  const shearFavor = Math.max(0, Math.min(1, 1 - (windShearKt - 3) / (20 - 3)))
  const favorability = 0.55 * sstFavor + 0.45 * shearFavor

  const maxWindKt = Math.round(between(40, 95))
  const minPressureHpa = Math.round(1005 - maxWindKt * 0.55 - favorability * 8)
  const currentIntensity = { maxWindKt, minPressureHpa, sstC, windShearKt }

  // RI outcome counts (out of 30), correlated with favorability but with enough spread to vary case to case.
  const rapid24 = Math.max(0, Math.min(30, Math.round(favorability * 26 + between(-4, 4))))
  const pace12 = Math.max(0, Math.min(rapid24, Math.round(rapid24 * between(0.45, 0.75))))
  const ensemble = buildEnsemble(seed, maxWindKt, rapid24, pace12)
  const probability24h = Math.round((rapid24 / ENSEMBLE_SIZE) * 1000) / 10
  const probability12h = Math.round((pace12 / ENSEMBLE_SIZE) * 1000) / 10
  const level = riRiskLevel(probability24h)

  // Eyewall organisation: a tighter, smaller ring and tucked-in hotspots read as a more organised storm,
  // matching a higher favorability the same way the old hand-authored cases did.
  const organisedRing = 0.048 + (1 - favorability) * (0.1 - 0.048)
  const hotspotSpan = between(150, 200)
  const hotspotStart = between(0, 360)
  const hotspots = [
    hotspotAt(hotspotStart, 0.1 + between(-0.01, 0.005), 0.03),
    hotspotAt(hotspotStart + hotspotSpan, 0.09 + between(-0.008, 0.006), 0.026),
  ]
  const geometry = buildGeometry(hotspots, Math.round(organisedRing * 1000) / 1000)

  const identificationConfidence = Math.round(between(84, 99))
  const classificationConfidence = Math.round(between(70, 96))

  const deltaKt = ensemble.medianKt[RI_WINDOW_HOURS] - ensemble.startWindKt
  const forecastPositions: ForecastPoint[] = [6, 12, 18, 24].map((h) => {
    const t = h / 24
    return {
      lat: center.lat + ((speedKmh * h) / 111) * Math.cos((headingDeg * Math.PI) / 180),
      lon: center.lon + ((speedKmh * h) / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin((headingDeg * Math.PI) / 180),
      label: `+${h}h`,
      hoursAhead: h,
      uncertaintyRadiusKm: Math.round(15 + 95 * t * t),
    }
  })

  // Past positions: extrapolated backward from the current centre along the reverse of the current heading,
  // with a little wobble so the track does not look perfectly straight.
  const backHeadingRad = ((headingDeg + 180) * Math.PI) / 180
  const pastPositions: TrackPoint[] = [48, 24, 12].map((h) => {
    const wobble = between(-0.4, 0.4)
    return {
      lat: round1(center.lat + ((speedKmh * h) / 111) * Math.cos(backHeadingRad) + wobble * 0.3),
      lon: round1(center.lon + ((speedKmh * h) / (111 * Math.cos((center.lat * Math.PI) / 180))) * Math.sin(backHeadingRad) + wobble),
      label: `-${h}h`,
    }
  })

  const landfallEtaHours = Math.round(between(16, 60))
  const coastalTarget = pick(COASTAL_TARGETS[basin])
  const landfallEta = `~${landfallEtaHours}h (${coastalTarget}, illustrative)`

  const shapFeatures = buildShapFeatures(rand, { sstC, windShearKt, favorability })
  const attentionSummary = buildAttentionSummary(favorability)
  const plainLanguageExplanation = buildPlainLanguageExplanation(level, favorability)

  const consensusNote = buildConsensusNote(rand, level)
  const alertText = buildAlertText(level)

  return {
    id: String(seed),
    basin,
    seed,
    center,
    movement,
    currentIntensity,
    ensemble,
    geometry,
    precomputed: {
      identification: {
        boundingBox: boundingBoxFor(geometry),
        confidence: identificationConfidence,
        centerCoords: center,
      },
      classification: {
        category: imdCategory(maxWindKt),
        confidence: classificationConfidence,
        basinHeadUsed: basin === 'Bay of Bengal' ? 'Bay of Bengal Head' : 'Arabian Sea Head',
      },
      riPrediction: {
        probability24h,
        probability12h,
        uncertaintyRange: { low: Math.max(0, Math.round(probability24h) - 9), high: Math.min(100, Math.round(probability24h) + 9) },
        deltaIntensity: `${Math.round(Math.abs(deltaKt) * KT_TO_KMH)} km/h`,
        ensemblePasses: ENSEMBLE_SIZE,
        trend: trendToward(rand, probability24h),
      },
      explainability: {
        gradCamHotspots: hotspots,
        shapFeatures,
        attentionSummary,
        uncertaintyBand: { low: ensemble.p10Kt[RI_WINDOW_HOURS], high: ensemble.p90Kt[RI_WINDOW_HOURS] },
        plainLanguageExplanation,
      },
      track: { pastPositions, forecastPositions, landfallEta },
      consensus: {
        imd: maxWindKt + Math.round(between(-3, 3)),
        adt: maxWindKt + Math.round(between(-5, 5)),
        satcon: maxWindKt + Math.round(between(-6, 4)),
        jtwc: maxWindKt + Math.round(between(-2, 7)),
        note: consensusNote,
      },
      alertText,
    },
  }
}

/** A short, plausible run-up to the current probability: mostly rising, ending exactly at it. */
function trendToward(rand: () => number, final: number): number[] {
  const steps = 5
  const start = Math.max(2, final - (18 + rand() * 10))
  return Array.from({ length: steps }, (_, i) => {
    if (i === steps - 1) return Math.round(final)
    const frac = (i + 1) / steps
    const wobble = (rand() - 0.5) * 6
    return Math.max(0, Math.round(start + (final - start) * frac + wobble))
  })
}

/** Builds the top handful of SHAP-style drivers, templated from the same quantitative inputs the rest of
 *  the storm was generated from, so a low-shear, warm-water storm reads as favourable and vice versa. */
function buildShapFeatures(
  rand: () => number,
  { sstC, windShearKt, favorability }: { sstC: number; windShearKt: number; favorability: number },
): ShapFeature[] {
  const ringContribution = Math.round(8 + favorability * 20 + (rand() - 0.5) * 4)
  const ringDescriptor = favorability > 0.7 ? 'a tight, fully closed ring' : favorability > 0.4 ? 'a partial ring, not fully closed yet' : 'no closed ring forming'
  const sstContribution = Math.round(4 + ((sstC - 27.8) / (31.2 - 27.8)) * 16)
  const sstDescriptor = sstC > 30.2 ? 'exceptionally warm water' : sstC > 29 ? 'warm water' : 'only marginally warm water'
  const shearContribution = Math.round(-(4 + (windShearKt / 20) * 14))
  const shearDescriptor = windShearKt < 6 ? 'very low wind shear' : windShearKt < 12 ? 'moderate wind shear' : 'strong wind shear'
  const irContribution = Math.round(3 + favorability * 10 + (rand() - 0.5) * 3)
  const wvContribution = Math.round(2 + favorability * 7 + (rand() - 0.5) * 3)

  return [
    {
      name: favorability > 0.6 ? 'Microwave eyewall ring closing' : 'Microwave eyewall signature weak',
      contribution: ringContribution,
      description: `Microwave imagery shows ${ringDescriptor} around the centre.`,
    },
    {
      name: sstC > 30.2 ? 'Exceptionally warm water' : sstC > 29 ? 'Warm open water' : 'Sea surface only marginally warm',
      contribution: sstContribution,
      description: `The sea under the storm is ${sstC.toFixed(1)} °C, ${sstC > 26.5 ? 'above' : 'near'} the ~26.5 °C storms need — ${sstDescriptor}.`,
    },
    {
      name: windShearKt < 6 ? 'Very low wind shear' : windShearKt < 12 ? 'Moderate wind shear' : 'Strong wind shear exposing the centre',
      contribution: shearContribution,
      description: `Winds at different heights differ by ${windShearKt} kt — ${shearDescriptor}, ${windShearKt < 12 ? 'letting the storm organise' : 'tilting and disrupting the storm'}.`,
    },
    {
      name: favorability > 0.55 ? 'Cloud tops sharply cooling in IR' : 'Cloud tops cooling slowly in IR',
      contribution: irContribution,
      description: `Infrared cloud tops are ${favorability > 0.55 ? 'dropping fast' : 'cooling only gradually'} near the centre.`,
    },
    {
      name: favorability > 0.55 ? 'Deep, symmetric moisture envelope' : 'Moisture envelope patchy',
      contribution: wvContribution,
      description: `Water vapour imagery shows ${favorability > 0.55 ? 'deep moisture wrapped symmetrically around the core' : 'a patchier, less symmetric moisture envelope'}.`,
    },
  ]
}

function buildAttentionSummary(favorability: number): string {
  if (favorability > 0.65) {
    return 'Attention is tightly concentrated on the closing microwave eyewall ring, with the warm water ahead of the storm as a strong secondary signal.'
  }
  if (favorability > 0.4) {
    return 'Attention concentrates on the partial microwave ring and the nearest curved band, with secondary weight on the surrounding sea temperature.'
  }
  return 'Attention is split by the shear: it spreads across the exposed low-level centre and the displaced convection nearby, rather than a tight core.'
}

function buildPlainLanguageExplanation(level: RiRiskLevel, favorability: number): string {
  if (level === 'High') return 'A well-formed eyewall, warm water and low wind shear together point to a high chance of rapid strengthening in the next day.'
  if (level === 'Elevated') return 'The storm is organising steadily and conditions are fairly favourable, giving a real but not certain chance of rapid strengthening.'
  if (level === 'Moderate') return 'The storm is organising but has not yet formed a complete eyewall, and wind shear is limiting how quickly it can strengthen.'
  return favorability < 0.25
    ? 'Wind shear is tearing at the storm and keeping it disorganised, so the AI sees little chance of rapid strengthening in the next day.'
    : 'Conditions are only mildly favourable, so the AI sees a low chance of rapid strengthening in the next day.'
}

function buildConsensusNote(rand: () => number, level: RiRiskLevel): string {
  if (level === 'High' || level === 'Elevated') {
    return rand() < 0.5
      ? 'Techniques agree closely and most trend upward, reinforcing this read.'
      : 'Techniques mostly agree, with a little more spread than usual across the estimates.'
  }
  return rand() < 0.5
    ? 'Techniques mostly agree, with satellite consensus running a touch lower than the others.'
    : 'Wider spread than usual across techniques, reflecting the storm’s currently disorganised structure.'
}

const ALERT_COPY: Record<RiRiskLevel, { headline: string; body: string }> = {
  Low: {
    headline: 'Low rapid intensification risk',
    body: 'Current conditions are expected to limit strengthening. Routine monitoring continues; no significant escalation expected.',
  },
  Moderate: {
    headline: 'Moderate rapid intensification risk',
    body: 'The system may strengthen over the next 24 hours. Continue routine monitoring; no immediate escalation indicated.',
  },
  Elevated: {
    headline: 'Elevated rapid intensification risk',
    body: 'Conditions are turning favourable for strengthening within 24 hours. Increased monitoring and readiness are recommended.',
  },
  High: {
    headline: 'High rapid intensification risk',
    body: 'Conditions strongly favour rapid strengthening within 24 hours. Elevated monitoring and early coordination recommended.',
  },
}

function buildAlertText(level: RiRiskLevel): { headline: string; body: string; severity: RiRiskLevel } {
  return { ...ALERT_COPY[level], severity: level }
}

// ---------------------------------------------------------------------------
// Self-check: fails loudly if a generated storm's numbers stop adding up. Cheap enough to run on every
// generation (see store/story.ts), the per-click equivalent of the old import-time check on 4 fixed cases.
// ---------------------------------------------------------------------------

function check(ok: boolean, message: string) {
  if (!ok) throw new Error(`data/cases.ts generateStormCase check failed: ${message}`)
}

export function assertValidStormCase(c: StormCase): void {
  const { riPrediction } = c.precomputed
  check(c.ensemble.paths.length === 30, '30 ensemble members')
  check(
    c.ensemble.paths.every((p) => p.length === 25 && p[0] === c.currentIntensity.maxWindKt),
    'every path has hours 0-24 and starts at the current wind',
  )
  check(riPrediction.probability24h >= 0 && riPrediction.probability24h <= 100, 'probability24h is 0-100')
  check(riPrediction.probability12h >= 0 && riPrediction.probability12h <= riPrediction.probability24h + 0.1, 'probability12h <= probability24h')
  check(riPrediction.uncertaintyRange.low <= riPrediction.uncertaintyRange.high, 'uncertaintyRange is ordered')
  check(c.precomputed.explainability.shapFeatures.length >= 4, 'has at least 4 SHAP features')
  check(c.precomputed.explainability.gradCamHotspots.length === 2, 'has 2 Grad-CAM hotspots')
  check(c.precomputed.track.forecastPositions.length === 4, 'has 4 forecast track points')
  check(
    c.precomputed.track.forecastPositions.every((p, i, arr) => i === 0 || p.uncertaintyRadiusKm >= arr[i - 1].uncertaintyRadiusKm),
    'forecast uncertainty radius grows with lead time',
  )
  check(c.precomputed.riPrediction.trend.length === 5, 'has a 5-point RI trend')
  check(c.precomputed.riPrediction.trend[4] === Math.round(riPrediction.probability24h), 'trend ends at the current 24h probability')
}
