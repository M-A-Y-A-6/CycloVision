import { motion } from 'framer-motion'
import { ArrowRight, Check, Clock, Gauge, Layers, LocateFixed, Satellite, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from '../components/Badge'
import { CountUp } from '../components/CountUp'
import { MiniGauge } from '../components/MiniGauge'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { STORM_IMAGE_PX } from '../config/imagery'
import { RISK_TONE } from '../config/risk'
import { RESULT_BEATS } from '../config/timings'
import { dvorak, riAssessment, storm } from '../data/storm'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

type IconTone = 'accent' | 'primary' | 'amber' | 'green'
// Full class strings so Tailwind can detect them.
const ICON_TONES: Record<IconTone, string> = {
  accent: 'border-accent/30 bg-accent/10 text-accent',
  primary: 'border-primary/30 bg-primary/10 text-primary',
  amber: 'border-amber/30 bg-amber/10 text-amber',
  green: 'border-green/30 bg-green/10 text-green',
}

const SOURCES = ['IR', 'Water Vapor', 'Microwave', 'SST']

interface SummaryRowProps {
  icon: LucideIcon
  tone: IconTone
  label: string
  show: boolean
  children: ReactNode
}

/** One row of the summary card: an icon, a small label and the value. Slides in when `show` turns true. */
function SummaryRow({ icon: Icon, tone, label, show, children }: SummaryRowProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -18 }}
      transition={{ duration: 0.6, ease }}
      aria-hidden={!show}
      className="short:py-1.5 flex min-h-0 flex-1 items-center gap-4 px-6 py-2"
    >
      <motion.span
        initial={false}
        animate={{ scale: show ? 1 : 0.6 }}
        transition={{ type: 'spring', stiffness: 380, damping: 18 }}
        className={cn('short:size-10 grid size-12 shrink-0 place-items-center rounded-xl border', ICON_TONES[tone])}
      >
        <Icon className="size-6" aria-hidden="true" />
      </motion.span>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted uppercase">{label}</p>
        {children}
      </div>
    </motion.div>
  )
}

const valueClass = 'short:text-lg text-xl leading-snug font-semibold text-ink'
const subClass = 'mt-0.5 text-sm text-muted'

/** A data source in the Evidence row: a small chip with a tick that pops in. */
function SourceChip({ label, on }: { label: string; on: boolean }) {
  return (
    <motion.span
      initial={false}
      animate={{ opacity: on ? 1 : 0.25, y: on ? 0 : 4 }}
      transition={{ duration: 0.4, ease }}
      className="inline-flex items-center gap-1.5 rounded-full border border-green/30 bg-green/10 py-1 pr-3 pl-1.5 text-sm font-medium text-ink"
    >
      <motion.span
        initial={false}
        animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
        transition={{ type: 'spring', stiffness: 420, damping: 18 }}
        className="grid size-4.5 place-items-center rounded-full bg-green text-[var(--color-base)]"
      >
        <Check className="size-3" strokeWidth={3.5} aria-hidden="true" />
      </motion.span>
      {label}
    </motion.span>
  )
}

/**
 * Stage 5, Result. A summary card whose rows slide in one after another (Current State, Structure, RI Assessment,
 * Prediction Window, Evidence), the fused storm image with a mini RI gauge, and the "Explore AI Explanation"
 * button. It never advances by itself: the button calls onDone, which moves the story to the explanation.
 * Timing: RESULT_BEATS in config/timings.ts (plain seconds after the screen appears).
 */
export function Result({ onDone }: StageProps) {
  // Coming back from the explanation, the reveal replays about five times faster.
  const seenBefore = useStory((s) => s.resultSeen)
  const b = useBeats(seenBefore ? 0.2 : 1, RESULT_BEATS)
  const chips = [b.chip1, b.chip2, b.chip3, b.chip4]
  const { latN, lonE } = storm.center
  const forecast = riAssessment.forecastWindowHours

  return (
    <StageLayout
      stage="result"
      visual={
        <div className="flex flex-1 flex-col bg-gradient-to-br from-panel via-panel to-base/60">
          <motion.header
            initial={false}
            animate={{ opacity: b.card ? 1 : 0 }}
            transition={{ duration: 0.6 }}
            className="short:py-2.5 flex items-center justify-between gap-3 border-b border-line px-6 py-4"
          >
            <div className="flex items-center gap-2.5">
              <span className="size-2 rounded-full bg-green shadow-[0_0_10px_2px_rgb(34_197_94/0.55)]" />
              <span className="text-[11px] font-semibold tracking-[0.18em] text-muted uppercase">Assessment summary</span>
            </div>
            <Badge>
              Cyclone {storm.name} · {storm.id}
            </Badge>
          </motion.header>

          <div className="flex flex-1 flex-col divide-y divide-line">
            <SummaryRow icon={LocateFixed} tone="accent" label="Current state" show={b.row1}>
              <p className={valueClass}>Cyclone identified</p>
              <p className={subClass}>
                <span className="num">
                  {latN}° N, {lonE}° E
                </span>{' '}
                · moving {storm.movement.directionLabel} at <span className="num">{storm.movement.speedKmh} km/h</span>
              </p>
            </SummaryRow>

            <SummaryRow icon={Layers} tone="primary" label="Structure" show={b.row2}>
              <p className={valueClass}>Dvorak-aligned classification</p>
              <p className={subClass}>
                {dvorak.topPattern.fullName} ({dvorak.topPattern.label}) · T <span className="num">{dvorak.tNumber.toFixed(1)}</span>
              </p>
            </SummaryRow>

            <SummaryRow icon={Gauge} tone="amber" label="RI assessment" show={b.row3}>
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <motion.span
                  initial={false}
                  animate={{ opacity: b.badge ? 1 : 0, scale: b.badge ? 1 : 0.8 }}
                  transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                >
                  <Badge tone={RISK_TONE[riAssessment.level]} size="lg">
                    {riAssessment.level}
                  </Badge>
                </motion.span>
                <span className="text-lg font-semibold text-ink">
                  <span className="num">
                    <CountUp to={Math.round(riAssessment.probability24hPct)} run={b.row3} seconds={1} />%
                  </span>{' '}
                  <span className="text-sm font-normal text-muted">probability</span>
                </span>
              </div>
            </SummaryRow>

            <SummaryRow icon={Clock} tone="accent" label="Prediction window" show={b.row4}>
              <p className={valueClass}>
                <span className="num">
                  {forecast.from}-{forecast.to}
                </span>{' '}
                hours
              </p>
              <p className={subClass}>Rapid intensification outlook</p>
            </SummaryRow>

            <SummaryRow icon={Satellite} tone="green" label="Evidence" show={b.row5}>
              <div className="mt-1.5 flex flex-wrap gap-2" aria-label="IR plus Water Vapor plus Microwave plus SST">
                {SOURCES.map((label, i) => (
                  <SourceChip key={label} label={label} on={chips[i]} />
                ))}
              </div>
            </SummaryRow>
          </div>
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.image ? 1 : 0, y: b.image ? 0 : 10 }}
        transition={{ duration: 0.8, ease }}
        className="short:h-36 relative h-56 overflow-hidden rounded-xl border border-line bg-base"
      >
        <motion.div
          className="size-full"
          initial={false}
          animate={{ scale: b.image ? 1 : 1.12 }}
          transition={{ duration: 2.2, ease: 'easeOut' }}
        >
          <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} className="size-full object-cover" />
        </motion.div>
        <span className="absolute top-3 left-3 rounded-md border border-line bg-base/80 px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.14em] text-muted uppercase backdrop-blur-sm">
          Fused satellite view
        </span>
        <div className="absolute right-3 bottom-3 rounded-xl border border-line bg-base/85 py-2 pr-4 pl-2.5 backdrop-blur-sm">
          <MiniGauge probabilityPct={riAssessment.probability24hPct} level={riAssessment.level} run={b.gauge} seconds={1.2} />
        </div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.button ? 1 : 0, y: b.button ? 0 : 12 }}
        transition={{ duration: 0.6, ease }}
      >
        <button
          type="button"
          onClick={onDone}
          disabled={!b.button}
          tabIndex={b.button ? 0 : -1}
          className="btn-glow short:py-3 flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold tracking-wide"
        >
          Explore AI Explanation
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </motion.div>
    </StageLayout>
  )
}
