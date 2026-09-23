import { motion } from 'framer-motion'
import type { Point } from '../lib/satellite'

/**
 * The AI analysis crosshair drawn on top of the storm image. Positions are the storm's normalised 0-1
 * coordinates, so this must be placed inside a <CoverSquare> (or any square that exactly covers the image).
 * The centre comes in as a prop, since each case has its own. (This file used to also hold TighteningGrid,
 * UncertaintyCircle and ScanLine, for Identify's earlier scan/grid/uncertainty-circle build-up; Phase 14
 * replaced that with a bounding box and a detection label instead — see stages/Identify.tsx — and removed
 * them as dead code.)
 */

const pct = (v: number) => `${v * 100}%`

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
  /** The case's storm centre, normalised 0-1: where the crosshair locks on. */
  center: Point
  /**
   * Already resolved (revisiting a finished stage): render settled on the centre and skip the lock-on ripple.
   * The search itself is a keyframe path (an array of positions), which framer-motion always plays through on
   * mount regardless of `initial`, so instant mode needs its own, single-position target to avoid replaying it.
   */
  instant?: boolean
}

/** A crosshair that appears off-centre, searches, and locks onto the storm centre. */
export function LockReticle({ show, lockSeconds, locked, center, instant = false }: ReticleProps) {
  const start = { left: pct(center.x + SEARCH_PATH.x[0]), top: pct(center.y + SEARCH_PATH.y[0]), scale: SEARCH_PATH.scale[0] }
  const settled = { left: pct(center.x), top: pct(center.y), scale: 1 }
  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      initial={false}
      animate={
        !show
          ? { ...start, opacity: 0 }
          : instant
            ? { ...settled, opacity: 1 }
            : {
                left: SEARCH_PATH.x.map((dx) => pct(center.x + dx)),
                top: SEARCH_PATH.y.map((dy) => pct(center.y + dy)),
                scale: SEARCH_PATH.scale,
                opacity: 1,
              }
      }
      transition={{ duration: lockSeconds, times: instant ? undefined : SEARCH_PATH.times, ease: 'easeInOut', opacity: { duration: 0.4 } }}
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
      {locked && !instant && (
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
