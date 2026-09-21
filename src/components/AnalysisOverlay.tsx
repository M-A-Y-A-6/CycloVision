import { motion } from 'framer-motion'
import { STORM_GEOMETRY } from '../lib/satellite'

/**
 * The "AI analysis" layers drawn on top of the storm image. All positions are the storm's normalised 0-1
 * coordinates, so these must be placed inside a <CoverSquare> (or any square that exactly covers the image).
 */

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const pct = (v: number) => `${v * 100}%`
const { center, innerRingRadius } = STORM_GEOMETRY

// --- Grid -------------------------------------------------------------------------------------------------

const GRID_LINES = 13
const EVENLY_SPACED = Array.from({ length: GRID_LINES }, (_, i) => (i + 1) / (GRID_LINES + 1))
/** The same lines pulled toward the middle: spacing shrinks steadily towards the centre. */
const TIGHTENED = EVENLY_SPACED.map((u) => 0.5 + Math.sign(u - 0.5) * 0.5 * Math.abs(2 * u - 1) ** 1.9)

interface GridProps {
  visible: boolean
  tighten: boolean
  tightenSeconds: number
}

/** A faint grid that appears evenly spaced, then tightens toward the storm centre. */
export function TighteningGrid({ visible, tighten, tightenSeconds }: GridProps) {
  const transition = { left: { duration: tightenSeconds, ease }, top: { duration: tightenSeconds, ease }, opacity: { duration: 0.6 } }
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      {EVENLY_SPACED.map((u, i) => (
        <motion.span
          key={`v${i}`}
          className="absolute inset-y-0 w-px bg-accent"
          initial={false}
          animate={{ left: pct(tighten ? TIGHTENED[i] : u), opacity: visible ? 0.2 : 0 }}
          transition={transition}
        />
      ))}
      {EVENLY_SPACED.map((u, i) => (
        <motion.span
          key={`h${i}`}
          className="absolute inset-x-0 h-px bg-accent"
          initial={false}
          animate={{ top: pct(tighten ? TIGHTENED[i] : u), opacity: visible ? 0.2 : 0 }}
          transition={transition}
        />
      ))}
    </div>
  )
}

// --- Crosshair --------------------------------------------------------------------------------------------

/** Where the crosshair wanders before it settles: offsets from the true centre, in image widths. */
const SEARCH_PATH = {
  x: [0.16, -0.06, 0.04, -0.012, 0],
  y: [-0.16, 0.07, -0.04, 0.012, 0],
  scale: [1.8, 1.4, 1.15, 1.04, 1],
  times: [0, 0.3, 0.6, 0.85, 1],
}

interface ReticleProps {
  show: boolean
  /** How long the search takes, ending in the lock. */
  lockSeconds: number
  locked: boolean
}

/** A crosshair that appears off-centre, searches, and locks onto the storm centre (STORM_GEOMETRY.center). */
export function LockReticle({ show, lockSeconds, locked }: ReticleProps) {
  const start = { left: pct(center.x + SEARCH_PATH.x[0]), top: pct(center.y + SEARCH_PATH.y[0]), scale: SEARCH_PATH.scale[0] }
  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={
        show
          ? {
              left: SEARCH_PATH.x.map((dx) => pct(center.x + dx)),
              top: SEARCH_PATH.y.map((dy) => pct(center.y + dy)),
              scale: SEARCH_PATH.scale,
              opacity: 1,
            }
          : { ...start, opacity: 0 }
      }
      transition={{ duration: lockSeconds, times: SEARCH_PATH.times, ease: 'easeInOut', opacity: { duration: 0.4 } }}
      aria-hidden="true"
    >
      <svg viewBox="-52 -52 104 104" className="size-[104px] overflow-visible">
        <g stroke="var(--color-accent)" strokeWidth="2.2" strokeLinecap="round">
          <line x1="0" y1="-46" x2="0" y2="-24" />
          <line x1="0" y1="24" x2="0" y2="46" />
          <line x1="-46" y1="0" x2="-24" y2="0" />
          <line x1="24" y1="0" x2="46" y2="0" />
        </g>
        <circle r="46" fill="none" stroke="var(--color-accent)" strokeOpacity="0.4" strokeDasharray="2 6" />
        <circle r="2.6" fill="var(--color-accent)" />
      </svg>
      {locked && (
        <motion.span
          className="absolute inset-0 rounded-full border border-accent"
          initial={{ scale: 0.7, opacity: 0.8 }}
          animate={{ scale: 2.2, opacity: 0 }}
          transition={{ duration: 1.1, ease: 'easeOut' }}
        />
      )}
    </motion.div>
  )
}

// --- Uncertainty circle -----------------------------------------------------------------------------------

/** Small dashed circle around the centre: how sure the AI is about where the storm centre is. */
export function UncertaintyCircle({ show }: { show: boolean }) {
  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-dashed border-accent/80 bg-accent/10"
      style={{ left: pct(center.x), top: pct(center.y), width: pct(innerRingRadius * 1.1), aspectRatio: '1' }}
      initial={false}
      animate={{ scale: show ? 1 : 0, opacity: show ? 1 : 0 }}
      transition={{ duration: 0.7, ease }}
      aria-hidden="true"
    />
  )
}

// --- Scan line --------------------------------------------------------------------------------------------

/** A glowing line that sweeps once from the top of the image to the bottom. Place it over the whole visual. */
export function ScanLine({ run, seconds }: { run: boolean; seconds: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 z-30"
      initial={false}
      animate={run ? { top: ['-3%', '103%'], opacity: [0, 1, 1, 0] } : { top: '-3%', opacity: 0 }}
      transition={{
        top: { duration: seconds, ease: 'linear' },
        opacity: { duration: seconds, ease: 'linear', times: [0, 0.1, 0.9, 1] },
      }}
      aria-hidden="true"
    >
      <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-accent/25 to-transparent" />
      <div className="h-0.5 bg-accent shadow-[0_0_18px_4px_rgb(34_211_238/0.5)]" />
    </motion.div>
  )
}
