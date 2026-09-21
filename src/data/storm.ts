/**
 * Synthetic data for the one fictional storm in the demo. Everything here is pre-written or
 * generated from a fixed seed, so it is identical on every run.
 *
 * Conventions: probabilities and shares are percent numbers (0-100) with a `Pct` suffix;
 * contributions are signed percentage points (`Pp`); winds are knots (`Kt`).
 */
import { mulberry32 } from '../lib/random'

/** Seed for everything random in the demo (SIH26070). Also used for the satellite imagery. */
export const STORM_SEED = 26070

// ---------------------------------------------------------------------------
// Identity and current state
// ---------------------------------------------------------------------------

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

export const storm = {
  /** Fictional name and ID: not from any real naming list. */
  name: 'Meghavi',
  id: 'BOB-01',
  basin: 'Bay of Bengal',
  center: { latN: 13.4, lonE: 86.9 },
  movement: { directionLabel: 'NW', headingDeg: 315, speedKmh: 14 },
  identificationConfidencePct: 94,
  current: {
    maxWindKt: 55,
    minPressureHpa: 986,
    /** Sea surface temperature under the storm, in degrees Celsius. */
    sstC: 30.1,
    windShearKt: 6,
    category: imdCategory(55),
  },
} as const

// ---------------------------------------------------------------------------
// Dvorak-aligned structure
// ---------------------------------------------------------------------------

export type DvorakPatternId = 'CDO' | 'EMBEDDED_CENTRE' | 'CURVED_BAND' | 'EYE' | 'SHEAR'

export interface DvorakPattern {
  id: DvorakPatternId
  label: string
  probabilityPct: number
}

/** Ranked by probability, highest first. Probabilities add up to 100. */
const dvorakPatterns: DvorakPattern[] = [
  { id: 'CDO', label: 'CDO', probabilityPct: 71 },
  { id: 'EMBEDDED_CENTRE', label: 'Embedded Centre', probabilityPct: 14 },
  { id: 'CURVED_BAND', label: 'Curved Band', probabilityPct: 9 },
  { id: 'EYE', label: 'Eye', probabilityPct: 4 },
  { id: 'SHEAR', label: 'Shear', probabilityPct: 2 },
]

export const dvorak = {
  patterns: dvorakPatterns,
  topPattern: { ...dvorakPatterns[0], fullName: 'Central Dense Overcast' },
  tNumber: 3.5,
}

// ---------------------------------------------------------------------------
// Intensity ensemble (next 24 hours)
// ---------------------------------------------------------------------------

/** Rapid Intensification: a wind increase of at least this many knots within 24 hours. */
export const RI_THRESHOLD_KT = 30
export const RI_WINDOW_HOURS = 24
/** A member is "on an RI-consistent pace" at hour h if it has gained RI_THRESHOLD_KT * h / 24. */
export const RI_PACE_CHECK_HOUR = 12

const ENSEMBLE_SIZE = 30
const HOURS = Array.from({ length: RI_WINDOW_HOURS + 1 }, (_, h) => h)
const START_KT = storm.current.maxWindKt

const round1 = (x: number) => Math.round(x * 10) / 10

/** Linear-interpolated percentile (0-1) of a list of numbers. */
function percentile(values: number[], p: number): number {
  const sorted = [...values].sort((a, b) => a - b)
  const pos = p * (sorted.length - 1)
  const lo = Math.floor(pos)
  const hi = Math.ceil(pos)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo)
}

function buildEnsemble() {
  const rand = mulberry32(STORM_SEED)
  const between = (a: number, b: number) => a + (b - a) * rand()

  // Each member is defined by its wind gain at hour 12 and hour 24. The three groups below are
  // what guarantee the counts: 12 members are on RI pace at hour 12 (gain >= 15 kt) and go on to
  // RI; 8 more reach RI later (gain < 15 kt at hour 12, >= 30 kt at hour 24); 10 never do.
  const targets: Array<[gain12: number, gain24: number]> = []
  for (let i = 0; i < 12; i++) {
    const g12 = between(16, 25)
    targets.push([g12, Math.max(g12 + 8, between(32, 54))])
  }
  for (let i = 0; i < 8; i++) targets.push([between(6, 12.5), between(32, 42)])
  for (let i = 0; i < 10; i++) targets.push([between(-3, 11), between(-8, 25)])

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
        START_KT +
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
    startWindKt: START_KT,
    /** Wind in knots: paths[member][hour]. */
    paths,
    medianKt: HOURS.map((h) => round1(percentile(atHour(h), 0.5))),
    /** 10th and 90th percentile across members: the uncertainty band. */
    p10Kt: HOURS.map((h) => round1(percentile(atHour(h), 0.1))),
    p90Kt: HOURS.map((h) => round1(percentile(atHour(h), 0.9))),
  }
}

export const ensemble = buildEnsemble()

// ---------------------------------------------------------------------------
// RI assessment
// ---------------------------------------------------------------------------

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

const gainAt = (path: number[], hour: number) => path[hour] - START_KT
const rapidCount24 = ensemble.paths.filter((p) => gainAt(p, RI_WINDOW_HOURS) >= RI_THRESHOLD_KT).length
const paceCount12 = ensemble.paths.filter(
  (p) => gainAt(p, RI_PACE_CHECK_HOUR) >= (RI_THRESHOLD_KT * RI_PACE_CHECK_HOUR) / RI_WINDOW_HOURS,
).length
const riProbability24hPct = (rapidCount24 / ensemble.memberCount) * 100

export const riAssessment = {
  thresholdKt: RI_THRESHOLD_KT,
  /** The lead-time window the forecast covers, in hours ahead. */
  forecastWindowHours: { from: 12, to: 24 },
  memberCount: ensemble.memberCount,
  /** Members that gain >= 30 kt by hour 24. */
  rapidMembers24h: rapidCount24,
  /** Members on an RI-consistent pace by hour 12. */
  paceMembers12h: paceCount12,
  probability12hPct: (paceCount12 / ensemble.memberCount) * 100,
  probability24hPct: riProbability24hPct,
  level: riRiskLevel(riProbability24hPct),
}

// ---------------------------------------------------------------------------
// Explanation
// ---------------------------------------------------------------------------

export interface RiDriver {
  id: string
  label: string
  /** Plain-language description for a non-meteorologist. */
  description: string
  /** Signed contribution to the RI probability, in percentage points. */
  contributionPp: number
  /**
   * How this driver reads inside the auto-written summary sentence (see lib/explanationSentence.ts):
   * "The AI sees <sees...>, over <over...> with <with...>."
   */
  phrase: { kind: 'sees' | 'over' | 'with'; text: string }
}

/** Ranked by size of contribution. With the baseline, they add up to the 24 h RI probability. */
const drivers: RiDriver[] = [
  {
    id: 'mw-eyewall-ring',
    label: 'Microwave eyewall ring forming',
    description:
      'Microwave imagery sees a ring of heavy rain closing around the centre, a sign the storm core is tightening and about to strengthen.',
    contributionPp: 22,
    phrase: { kind: 'sees', text: 'a ring forming in the microwave image that is not yet visible in infrared' },
  },
  {
    id: 'warm-sst',
    label: 'Warm sea surface',
    description: `The sea under the storm is ${storm.current.sstC} °C, well above the ~26.5 °C storms need, so it is a rich supply of heat energy.`,
    contributionPp: 15,
    phrase: { kind: 'over', text: 'very warm water' },
  },
  {
    id: 'low-shear',
    label: 'Low wind shear',
    description: `Winds at different heights are almost the same (${storm.current.windShearKt} kt difference), so nothing is tearing the storm apart.`,
    contributionPp: 12,
    phrase: { kind: 'with', text: 'low wind shear' },
  },
  {
    id: 'ir-cooling-tops',
    label: 'Cooling cloud tops in IR',
    description:
      'In infrared, the cloud tops are getting colder: thunderstorms are growing taller and more intense around the centre.',
    contributionPp: 8,
    phrase: { kind: 'sees', text: 'cloud tops cooling in infrared' },
  },
  {
    id: 'wv-deep-moisture',
    label: 'Deep moisture in water vapour',
    description:
      'Water vapour imagery shows a deep moist layer around the core: fuel for sustained thunderstorms.',
    contributionPp: 7,
    phrase: { kind: 'with', text: 'deep moisture around the core' },
  },
  {
    id: 'dry-air',
    label: 'Dry-air intrusion',
    description:
      'A pocket of dry air to the south-west could weaken storms on that side, slightly lowering the chance of rapid intensification.',
    contributionPp: -6,
    phrase: { kind: 'with', text: 'a pocket of dry air to the south-west' },
  },
]

export type DataSourceId = 'MW' | 'IR' | 'SST' | 'WV'

export const explanation = {
  /** Chance of RI before looking at this storm's evidence (typical background rate). */
  baselinePct: 9,
  drivers,
  /** How much each data source contributed to the decision. Adds up to 100. */
  sourceShares: [
    { id: 'MW', label: 'Passive Microwave', sharePct: 34 },
    { id: 'IR', label: 'Infrared', sharePct: 24 },
    { id: 'SST', label: 'Sea Surface Temperature', sharePct: 24 },
    { id: 'WV', label: 'Water Vapour', sharePct: 18 },
  ] as ReadonlyArray<{ id: DataSourceId; label: string; sharePct: number }>,
}

// ---------------------------------------------------------------------------
// Self-check: fails loudly at import time if the pre-written story ever stops adding up.
// ---------------------------------------------------------------------------

function check(ok: boolean, message: string) {
  if (!ok) throw new Error(`storm.ts data check failed: ${message}`)
}

check(ensemble.paths.length === 30, '30 ensemble members')
check(
  ensemble.paths.every((p) => p.length === 25 && p[0] === START_KT),
  'every path has hours 0-24 and starts at the current wind',
)
check(riAssessment.rapidMembers24h === 20, 'exactly 20 of 30 members gain >= 30 kt by hour 24')
check(riAssessment.paceMembers12h === 12, 'exactly 12 of 30 members on RI pace by hour 12')
check(riAssessment.level === 'Elevated', 'RI risk level is Elevated')
check(dvorak.patterns.reduce((s, p) => s + p.probabilityPct, 0) === 100, 'Dvorak probabilities add up to 100')
check(dvorak.topPattern.id === 'CDO', 'top Dvorak pattern is CDO')
check(explanation.sourceShares.reduce((s, x) => s + x.sharePct, 0) === 100, 'source shares add up to 100')
check(
  explanation.baselinePct + explanation.drivers.reduce((s, d) => s + d.contributionPp, 0) ===
    Math.round(riAssessment.probability24hPct),
  'baseline + driver contributions equal the rounded 24 h RI probability',
)
