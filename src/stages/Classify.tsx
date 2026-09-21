import { motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { CountUp } from '../components/CountUp'
import { CoverSquare } from '../components/CoverSquare'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { StructureOverlay } from '../components/StructureOverlay'
import { STORM_IMAGE_PX } from '../config/imagery'
import { CLASSIFY_BEATS, STAGE_SECONDS } from '../config/timings'
import { dvorak } from '../data/storm'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useLatest } from '../lib/useLatest'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.classify
/** Seconds between two beats of the stage. */
const between = (from: keyof typeof CLASSIFY_BEATS, to: keyof typeof CLASSIFY_BEATS) =>
  (CLASSIFY_BEATS[to] - CLASSIFY_BEATS[from]) * TOTAL
const FILL_SECONDS = 0.08 * TOTAL

interface BarRowProps {
  label: string
  pct: number
  isTop: boolean
  fill: boolean
}

/** One Dvorak pattern: its name, a bar that fills to its probability, and the number counting up. */
function BarRow({ label, pct, isTop, fill }: BarRowProps) {
  return (
    <div className="grid grid-cols-[8.25rem_1fr_3rem] items-center gap-3">
      <span className={cn('text-sm', isTop ? 'font-semibold text-ink' : 'text-muted')}>{label}</span>
      <div className="h-2 overflow-hidden rounded-full bg-line">
        <motion.div
          className={cn('h-full rounded-full', isTop ? 'bg-accent shadow-[0_0_10px_rgb(34_211_238/0.6)]' : 'bg-primary/70')}
          initial={false}
          animate={{ width: fill ? `${pct}%` : '0%' }}
          transition={{ duration: FILL_SECONDS, ease: 'easeOut' }}
        />
      </div>
      <span className={cn('num text-right text-sm', isTop ? 'font-semibold text-ink' : 'text-muted')}>
        <CountUp to={pct} run={fill} seconds={FILL_SECONDS} />%
      </span>
    </div>
  )
}

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="num text-xl leading-tight font-semibold text-ink">{children}</p>
    </div>
  )
}

/**
 * Stage 3, Classify. The storm image stays in view while the Dvorak-aligned structure is drawn on it
 * (curved bands, CDO outline, centre, each labelled); then five probability bars fill one by one and the
 * top match is highlighted with its confidence and the Dvorak T-number. Timing: STAGE_SECONDS.classify and
 * CLASSIFY_BEATS in config/timings.ts.
 */
export function Classify({ onDone }: StageProps) {
  const doneRef = useLatest(onDone)
  const b = useBeats(TOTAL, CLASSIFY_BEATS)
  useEffect(() => {
    if (b.end) doneRef.current()
  }, [b.end, doneRef])

  const barsFilled = [b.bar1, b.bar2, b.bar3, b.bar4, b.bar5]
  const top = dvorak.topPattern
  const arcWindow = between('bands', 'bandsLabel')

  return (
    <StageLayout
      stage="classify"
      visual={
        <div className="absolute inset-0">
          <CoverSquare>
            <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} className="size-full" />
            <StructureOverlay
              bands={b.bands}
              bandsLabel={b.bandsLabel}
              cdo={b.cdo}
              cdoLabel={b.cdoLabel}
              center={b.center}
              centerLabel={b.centerLabel}
              arcSeconds={arcWindow * 0.6}
              arcStagger={arcWindow * 0.2}
              cdoSeconds={between('cdo', 'cdoLabel')}
            />
          </CoverSquare>
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.results ? 1 : 0, y: b.results ? 0 : 8 }}
        transition={{ duration: 0.5, ease }}
        aria-hidden={!b.results}
        className="short:space-y-1 short:py-2 space-y-2 rounded-xl border border-line bg-panel px-4 py-3"
      >
        <p className="mb-1 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Cloud pattern match</p>
        {dvorak.patterns.map((p, i) => (
          <BarRow key={p.id} label={p.label} pct={p.probabilityPct} isTop={p.id === top.id} fill={barsFilled[i]} />
        ))}
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.topMatch ? 1 : 0, y: b.topMatch ? 0 : 8 }}
        transition={{ duration: 0.6, ease }}
        aria-hidden={!b.topMatch}
        className="short:py-2 flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">Top match</p>
          <p className="text-[1rem] leading-tight font-semibold text-ink">
            {top.fullName} ({top.label})
          </p>
        </div>
        <div className="flex shrink-0 gap-5">
          <Stat label="Confidence">
            <CountUp to={top.probabilityPct} run={b.topMatch} seconds={0.8} />%
          </Stat>
          <Stat label="T-number">
            <CountUp to={dvorak.tNumber} decimals={1} run={b.topMatch} seconds={0.8} />
          </Stat>
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.structure ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden={!b.structure}
        className="short:space-y-1 short:py-2 space-y-1.5 rounded-lg border border-green/30 bg-green/10 px-4 py-2.5"
      >
        <motion.div initial={false} animate={{ opacity: b.structure ? 1 : 0, y: b.structure ? 0 : 6 }} transition={{ duration: 0.6, ease }}>
          <StatusRow label="Structure classified" status={b.structure ? 'done' : 'idle'} className="font-medium" />
        </motion.div>
        <motion.div initial={false} animate={{ opacity: b.assessment ? 1 : 0, y: b.assessment ? 0 : 6 }} transition={{ duration: 0.6, ease }}>
          <StatusRow label="Dvorak-aligned assessment available" status={b.assessment ? 'done' : 'idle'} className="font-medium" />
        </motion.div>
      </motion.div>
    </StageLayout>
  )
}
