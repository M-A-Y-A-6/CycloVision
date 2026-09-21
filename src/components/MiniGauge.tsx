import { motion } from 'framer-motion'
import type { RiRiskLevel } from '../data/storm'
import { CountUp } from './CountUp'

// Literal colours (the design tokens green, accent, amber, red) so SVG can use them directly.
const GREEN = '#22c55e'
const ACCENT = '#22d3ee'
const AMBER = '#f59e0b'
const RED = '#ef4444'

/** The four risk zones as shares of the ring, matching the risk levels: <25 Low, <50 Moderate, <=75 Elevated, else High. */
const ZONES = [
  { from: 0, colour: GREEN },
  { from: 25, colour: ACCENT },
  { from: 50, colour: AMBER },
  { from: 75, colour: RED },
]
const LEVEL_COLOUR: Record<RiRiskLevel, string> = { Low: GREEN, Moderate: ACCENT, Elevated: AMBER, High: RED }

interface MiniGaugeProps {
  probabilityPct: number
  level: RiRiskLevel
  /** The gauge fills when this turns true. */
  run: boolean
  seconds: number
}

/**
 * A small ring gauge for the RI probability: the ring is split into the four risk zones, and a bright arc
 * fills counter-clockwise from the top up to the probability, ending in the zone that gives the risk level.
 */
export function MiniGauge({ probabilityPct, level, run, seconds }: MiniGaugeProps) {
  const colour = LEVEL_COLOUR[level]
  return (
    <div className="flex items-center gap-3">
      <div className="relative size-16 shrink-0">
        {/* Mirrored and turned so the ring starts at the top and runs counter-clockwise. */}
        <svg viewBox="0 0 64 64" className="absolute inset-0 rotate-90 -scale-x-100" aria-hidden="true">
          {ZONES.map((zone) => (
            <circle
              key={zone.from}
              cx="32"
              cy="32"
              r="26"
              fill="none"
              stroke={zone.colour}
              strokeOpacity={0.3}
              strokeWidth="6"
              pathLength={100}
              strokeDasharray="23 77"
              strokeDashoffset={-zone.from}
            />
          ))}
          <motion.circle
            cx="32"
            cy="32"
            r="26"
            fill="none"
            stroke={colour}
            strokeWidth="6"
            strokeLinecap="round"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: run ? probabilityPct / 100 : 0, opacity: run ? 1 : 0 }}
            transition={{ pathLength: { duration: seconds, ease: 'easeOut' }, opacity: { duration: 0.2 } }}
          />
        </svg>
        <span className="num absolute inset-0 grid place-items-center text-[15px] font-semibold text-ink">
          <span>
            <CountUp to={Math.round(probabilityPct)} run={run} seconds={seconds} />%
          </span>
        </span>
      </div>
      <div>
        <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">RI risk</p>
        <p className="text-sm font-semibold" style={{ color: colour }}>
          {level}
        </p>
      </div>
    </div>
  )
}
