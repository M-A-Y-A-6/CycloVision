import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { Badge } from '../components/Badge'
import { ContinueButton } from '../components/ContinueButton'
import { EnsembleChart } from '../components/EnsembleChart'
import { MiniGauge } from '../components/MiniGauge'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { STORM_IMAGE_PX } from '../config/imagery'
import { RISK_TONE } from '../config/risk'
import { PREDICT_BEATS, STAGE_SECONDS } from '../config/timings'
import { RI_THRESHOLD_KT, riRiskLevel } from '../data/cases'
import { useBeats } from '../lib/useBeats'
import { useCase } from '../lib/useCase'
import { useElementSize } from '../lib/useElementSize'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.predict
/** Seconds between two beats of the stage. */
const between = (from: keyof typeof PREDICT_BEATS, to: keyof typeof PREDICT_BEATS) =>
  (PREDICT_BEATS[to] - PREDICT_BEATS[from]) * TOTAL

/** Where the satellite image ends up: a small thumbnail in the top-left corner of the chart area. */
const THUMB = { inset: 14, size: 84 }

/** A small sparkline of riPrediction.trend: the run-up of past readings leading to today's RI probability. */
function TrendSparkline({ trend, show }: { trend: readonly number[]; show: boolean }) {
  const w = 220
  const h = 46
  const pad = 5
  const min = Math.min(...trend)
  const max = Math.max(...trend)
  const range = Math.max(1, max - min)
  const points = trend.map((v, i) => {
    const x = pad + (i / (trend.length - 1)) * (w - pad * 2)
    const y = h - pad - ((v - min) / range) * (h - pad * 2)
    return [x, y] as const
  })
  const d = 'M ' + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(' L ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label="Sparkline of the RI probability's recent trend, rising toward today's figure">
      <motion.path
        d={d}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={false}
        animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
      />
      {points.map(([x, y], i) => (
        <motion.circle
          key={i}
          cx={x}
          cy={y}
          r={i === points.length - 1 ? 3.2 : 2.2}
          fill="var(--color-accent)"
          initial={false}
          animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.4 }}
          style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
          transition={{ duration: 0.3, delay: show ? 0.14 * i : 0 }}
        />
      ))}
    </svg>
  )
}

/**
 * Stage 4, Predict RI: the big reveal (model: TCN + Attention feeding the RI Head). The satellite image
 * shrinks to a corner thumbnail and the ensemble chart takes over: 30 possible futures draw outward from
 * "now", then the median, the 10-90% band and the +30 kt line; the paths that reach it turn warm. Then, in
 * the status column: a small sparkline of the RI probability's recent trend, an RI risk gauge animating from
 * 0 to the 24h probability, two callouts (expected intensity change, and the probability with its
 * uncertainty and ensemble size), the risk badge, three completion lines and a Continue button. The
 * animation follows STAGE_SECONDS.predict and PREDICT_BEATS in config/timings.ts; the story only moves to
 * the Explain Result stage when the visitor clicks Continue. If the progress tracker jumped straight here
 * because it was already finished, `instant` skips the whole build-up and shows the finished chart
 * immediately.
 */
export function Predict({ onDone }: StageProps) {
  const caseData = useCase()
  const { ensemble } = caseData
  const instant = useStory((s) => s.doneStages.predict ?? false)
  const markDone = useStory((s) => s.markDone)
  const b = useBeats(TOTAL, PREDICT_BEATS, instant)
  useEffect(() => {
    if (b.line3) markDone('predict')
  }, [b.line3, markDone])

  const areaRef = useRef<HTMLDivElement>(null)
  const area = useElementSize(areaRef)

  const pathSeconds = 0.1 * TOTAL
  const pathStagger = Math.max(0.01, (between('paths', 'median') - pathSeconds) / (ensemble.memberCount - 1))
  const { probability24h: probability24hRaw, uncertaintyRange, deltaIntensity, ensemblePasses, trend } = caseData.precomputed.riPrediction
  const probability24h = Math.round(probability24hRaw)
  const level = riRiskLevel(probability24h)
  const plusMinus = Math.round((uncertaintyRange.high - uncertaintyRange.low) / 2)

  return (
    <StageLayout
      stage="predict"
      pipelineLabels={['TCN + Attention — temporal evolution']}
      pipelineHint="RI Head combines deep spatio-temporal features with environmental indicators (SST, shear, OHC)."
      visual={
        <div ref={areaRef} className="absolute inset-0">
          {area && (
            <>
              <EnsembleChart
                width={area.w}
                height={area.h}
                ensemble={ensemble}
                thresholdKt={RI_THRESHOLD_KT}
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
                <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} caseData={caseData} className="size-full object-cover" />
              </motion.div>
            </>
          )}
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.trend ? 1 : 0, y: b.trend ? 0 : 8 }}
        transition={{ duration: 0.5, ease }}
        aria-hidden={!b.trend}
        className="short:space-y-1.5 short:py-2 space-y-2 rounded-xl border border-line bg-panel px-4 py-3"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">RI risk · 24 h</p>
            <p className="mt-0.5 text-[11px] text-muted">RI Head output</p>
          </div>
          <motion.span
            initial={false}
            animate={{ opacity: b.badge ? 1 : 0, scale: b.badge ? 1 : 0.9 }}
            transition={{ duration: 0.5, ease }}
            aria-hidden={!b.badge}
          >
            <Badge tone={RISK_TONE[level]} size="lg">
              {level}
            </Badge>
          </motion.span>
        </div>

        <div className="flex items-center gap-4">
          <MiniGauge probabilityPct={probability24h} level={level} run={b.gauge} seconds={0.5 * TOTAL} size={68} />
          <div className="min-w-0 flex-1">
            <p className="short:mb-0.5 mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted/80 uppercase">Recent trend</p>
            <TrendSparkline trend={trend} show={b.trend} />
          </div>
        </div>

        <div className="short:space-y-0.5 space-y-1 border-t border-line pt-2">
          <motion.p
            initial={false}
            animate={{ opacity: b.deltaCallout ? 1 : 0, y: b.deltaCallout ? 0 : 6 }}
            transition={{ duration: 0.5, ease }}
            aria-hidden={!b.deltaCallout}
            className="num short:text-xs text-sm text-ink"
          >
            <span className="font-semibold text-amber">+{deltaIntensity}</span> expected within 24h
          </motion.p>
          <motion.p
            initial={false}
            animate={{ opacity: b.rangeCallout ? 1 : 0, y: b.rangeCallout ? 0 : 6 }}
            transition={{ duration: 0.5, ease }}
            aria-hidden={!b.rangeCallout}
            className="num short:text-xs text-sm text-muted"
          >
            <span className="font-semibold text-ink">{probability24h}%</span> &plusmn; {plusMinus}%, based on {ensemblePasses} ensemble passes
          </motion.p>
        </div>
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
            ['Uncertainty band', b.line3],
          ] as const
        ).map(([label, on]) => (
          <motion.div key={label} initial={false} animate={{ opacity: on ? 1 : 0, y: on ? 0 : 6 }} transition={{ duration: 0.6, ease }}>
            <StatusRow label={label} status={on ? 'done' : 'idle'} className="font-medium" />
          </motion.div>
        ))}
      </motion.div>

      <ContinueButton show={b.line3} label="Continue to Explain Result" onClick={onDone} />
    </StageLayout>
  )
}
