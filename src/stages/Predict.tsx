import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Badge } from '../components/Badge'
import { CountUp } from '../components/CountUp'
import { EnsembleChart } from '../components/EnsembleChart'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { STORM_IMAGE_PX } from '../config/imagery'
import { RISK_TONE } from '../config/risk'
import { PREDICT_BEATS, STAGE_SECONDS } from '../config/timings'
import { ensemble, riAssessment } from '../data/storm'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useElementSize } from '../lib/useElementSize'
import { useLatest } from '../lib/useLatest'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.predict
/** Seconds between two beats of the stage. */
const between = (from: keyof typeof PREDICT_BEATS, to: keyof typeof PREDICT_BEATS) =>
  (PREDICT_BEATS[to] - PREDICT_BEATS[from]) * TOTAL

/** Where the satellite image ends up: a small thumbnail in the top-left corner of the chart area. */
const THUMB = { inset: 14, size: 84 }

interface ProbabilityStatProps {
  label: string
  value: number
  paths: number
  run: boolean
  seconds: number
  emphasis?: boolean
}

/** One rapid-intensification probability: the number counts up, with how many of the 30 paths it comes from. */
function ProbabilityStat({ label, value, paths, run, seconds, emphasis }: ProbabilityStatProps) {
  return (
    <div>
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className={cn('num mt-1 leading-none font-semibold', emphasis ? 'short:text-4xl text-5xl text-amber' : 'short:text-2xl text-3xl text-ink')}>
        <CountUp to={value} run={run} seconds={seconds} />%
      </p>
      <p className="mt-1.5 text-xs text-muted">
        {paths} of {riAssessment.memberCount} paths
      </p>
    </div>
  )
}

/**
 * Stage 4, Predict RI: the big reveal. The satellite image shrinks to a corner thumbnail and a chart takes over:
 * 30 possible futures draw outward from "now", then the median, the 10-90% band and the +30 kt line; the paths
 * that reach it turn warm. Then the probabilities, risk level and callouts appear, and the completion lines tick.
 * Timing: STAGE_SECONDS.predict and PREDICT_BEATS in config/timings.ts.
 */
export function Predict({ onDone }: StageProps) {
  const doneRef = useLatest(onDone)
  const b = useBeats(TOTAL, PREDICT_BEATS)
  useEffect(() => {
    if (b.end) doneRef.current()
  }, [b.end, doneRef])

  const areaRef = useRef<HTMLDivElement>(null)
  const area = useElementSize(areaRef)

  const pathSeconds = 0.1 * TOTAL
  const pathStagger = Math.max(0.01, (between('paths', 'median') - pathSeconds) / (ensemble.memberCount - 1))
  const probability24h = Math.round(riAssessment.probability24hPct)
  const probability12h = Math.round(riAssessment.probability12hPct)

  return (
    <StageLayout
      stage="predict"
      visual={
        <div ref={areaRef} className="absolute inset-0">
          {area && (
            <>
              <EnsembleChart
                width={area.w}
                height={area.h}
                axes={b.axes}
                paths={b.paths}
                median={b.median}
                band={b.band}
                riLine={b.riLine}
                warm={b.warm}
                spreadLabel={b.spread}
                bandLabel={b.bandLabel}
                pathSeconds={pathSeconds}
                pathStagger={pathStagger}
                medianSeconds={0.09 * TOTAL}
                bandSeconds={0.09 * TOTAL}
                riLineSeconds={0.07 * TOTAL}
                warmStagger={0.0035 * TOTAL}
              />

              {/* The storm image, full size at first, then shrinking into the corner as the chart takes over. */}
              <motion.div
                className="absolute z-20 overflow-hidden border border-accent/40 bg-base shadow-[0_6px_24px_rgb(0_0_0/0.5)]"
                initial={false}
                animate={
                  b.shrink
                    ? { left: THUMB.inset, top: THUMB.inset, width: THUMB.size, height: THUMB.size, borderRadius: 12 }
                    : { left: 0, top: 0, width: area.w, height: area.h, borderRadius: 0 }
                }
                transition={{ duration: 1, ease: [0.5, 0, 0.2, 1] }}
              >
                <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} className="size-full object-cover" />
              </motion.div>
            </>
          )}
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.results ? 1 : 0, y: b.results ? 0 : 8 }}
        transition={{ duration: 0.6, ease }}
        aria-hidden={!b.results}
        className="short:py-2.5 rounded-xl border border-line bg-panel px-4 py-3.5"
      >
        <div className="grid grid-cols-2 gap-4">
          <ProbabilityStat
            label="RI probability · 24 h"
            value={probability24h}
            paths={riAssessment.rapidMembers24h}
            run={b.results}
            seconds={0.12 * TOTAL}
            emphasis
          />
          <ProbabilityStat
            label="RI probability · 12 h"
            value={probability12h}
            paths={riAssessment.paceMembers12h}
            run={b.results}
            seconds={0.1 * TOTAL}
          />
        </div>
        <motion.div
          initial={false}
          animate={{ opacity: b.badge ? 1 : 0, scale: b.badge ? 1 : 0.9 }}
          transition={{ duration: 0.5, ease }}
          className="short:mt-2 mt-3.5 flex items-center justify-between border-t border-line pt-3"
        >
          <span className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Risk level</span>
          <Badge tone={RISK_TONE[riAssessment.level]} size="lg">
            {riAssessment.level}
          </Badge>
        </motion.div>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.line1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden={!b.line1}
        className="short:space-y-0.5 short:py-2 space-y-1.5 rounded-lg border border-green/30 bg-green/10 px-4 py-2.5"
      >
        {(
          [
            ['RI assessment generated', b.line1],
            ['12-24h forecast window', b.line2],
            ['Probability spread', b.line3],
            ['Uncertainty band', b.line4],
          ] as const
        ).map(([label, on]) => (
          <motion.div key={label} initial={false} animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6 }} transition={{ duration: 0.6, ease }}>
            <StatusRow label={label} status={on ? 'done' : 'idle'} className="font-medium" />
          </motion.div>
        ))}
      </motion.div>
    </StageLayout>
  )
}
