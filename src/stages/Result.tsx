import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { AttentionHeatmap } from '../components/AttentionHeatmap'
import { CoverSquare } from '../components/CoverSquare'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { TypeText } from '../components/TypeText'
import { STORM_IMAGE_PX } from '../config/imagery'
import { RESULT_BEATS } from '../config/timings'
import type { ShapFeature } from '../data/cases'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useCase } from '../lib/useCase'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const NO_LABELS: [boolean, boolean, boolean, boolean] = [false, false, false, false]

/** One of the top 2 SHAP features: its name and a short bar (amber pushes the risk up, blue pushes it down). */
function ShapBar({ feature, show, maxAbs }: { feature: ShapFeature; show: boolean; maxAbs: number }) {
  const up = feature.contribution > 0
  return (
    <motion.div initial={false} animate={{ opacity: show ? 1 : 0, x: show ? 0 : -10 }} transition={{ duration: 0.5, ease }} aria-hidden={!show}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="truncate text-xs font-semibold text-ink">{feature.name}</span>
        <span className={cn('num text-xs font-semibold', up ? 'text-amber' : 'text-primary')}>
          {up ? '+' : '−'}
          {Math.abs(feature.contribution)}
        </span>
      </div>
      <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-line">
        <motion.div
          className={cn('h-full rounded-full', up ? 'bg-amber' : 'bg-primary')}
          initial={false}
          animate={{ width: show ? `${(Math.abs(feature.contribution) / maxAbs) * 100}%` : '0%' }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </motion.div>
  )
}

/** A schematic bell curve (not a real statistical plot) sketching the uncertainty band around the 24h wind. */
function BellCurveSketch({ low, high, show }: { low: number; high: number; show: boolean }) {
  const w = 220
  const h = 40
  const curve = `M 4 ${h - 6} C ${w * 0.28} ${h - 6}, ${w * 0.35} 6, ${w / 2} 6 C ${w * 0.65} 6, ${w * 0.72} ${h - 6}, ${w - 4} ${h - 6}`
  return (
    <>
      <svg
        viewBox={`0 0 ${w} ${h}`}
        className="w-full"
        role="img"
        aria-label={`Uncertainty sketch: 24 hour wind speed likely between ${low} and ${high} knots`}
      >
        <motion.rect
          x={w * 0.3}
          y={2}
          width={w * 0.4}
          height={h - 6}
          fill="var(--color-accent)"
          initial={false}
          animate={{ opacity: show ? 0.14 : 0 }}
          transition={{ duration: 0.6, delay: show ? 0.35 : 0 }}
        />
        <motion.path
          d={curve}
          fill="none"
          stroke="var(--color-accent)"
          strokeWidth={1.8}
          strokeLinecap="round"
          initial={false}
          animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
          transition={{ duration: 0.9, ease: 'easeOut' }}
        />
        <line x1={4} y1={h - 4} x2={w - 4} y2={h - 4} stroke="var(--color-line)" strokeWidth={1} />
      </svg>
      <p className="num mt-1 text-center text-[11px] text-muted">
        Wind speed likely {low}-{high} kt at 24h
      </p>
    </>
  )
}

/**
 * Stage 5, Result (tracker label: "Explain Result"; model: Explainability & Uncertainty, consolidated). The
 * fused image carries a Grad-CAM-style attention glow over the case's own gradCamHotspots; the status column
 * is one compact panel: the top 2 SHAP features as short bars, a schematic bell-curve sketch of the
 * uncertainty band, then the case's plain-language explanation, typed out. It ends with "Explanation
 * generated" and a "[ View Full Results ]" button — not a Continue button: it marks the results panel
 * reached and navigates to the separate "/results" route, rather than advancing the story (this is the last
 * story stage). Timing: RESULT_BEATS in config/timings.ts (plain seconds after the screen appears, since,
 * like the rest of this row, it waits for a click rather than running on its own duration).
 */
export function Result(_props: StageProps) {
  const caseData = useCase()
  const b = useBeats(1, RESULT_BEATS)
  const reachResultsPanel = useStory((s) => s.reachResultsPanel)
  const navigate = useNavigate()

  // gradCamHotspots and caseData.geometry.hotspots are the same array by construction (see data/cases.ts),
  // so AttentionHeatmap's `geometry` prop already draws the glow at gradCamHotspots.
  const { shapFeatures, uncertaintyBand, plainLanguageExplanation } = caseData.precomputed.explainability
  const topFeatures = [...shapFeatures].sort((a, b2) => Math.abs(b2.contribution) - Math.abs(a.contribution)).slice(0, 2)
  const maxAbs = Math.max(...topFeatures.map((f) => Math.abs(f.contribution)))

  const handleViewResults = () => {
    reachResultsPanel()
    navigate('/results')
  }

  return (
    <StageLayout
      stage="result"
      pipelineLabels={['Explainability & Uncertainty — Grad-CAM, SHAP, attention, MC Dropout (consolidated)']}
      visual={
        <div className="absolute inset-0">
          <CoverSquare>
            <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} caseData={caseData} className="size-full" />
            <motion.div
              className="absolute inset-0 bg-base"
              initial={false}
              animate={{ opacity: b.heatmap ? 0.4 : 0 }}
              transition={{ duration: 1.2, ease: 'easeInOut' }}
            />
            <AttentionHeatmap geometry={caseData.geometry} show={b.heatmap} labels={NO_LABELS} fadeSeconds={1.2} />
          </CoverSquare>
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.card ? 1 : 0, y: b.card ? 0 : 8 }}
        transition={{ duration: 0.5, ease }}
        aria-hidden={!b.card}
        className="short:space-y-1.5 short:py-2 space-y-2.5 rounded-xl border border-line bg-panel px-4 py-3"
      >
        <div>
          <p className="short:mb-1 mb-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Top signals</p>
          <div className="short:space-y-1 space-y-1.5">
            <ShapBar feature={topFeatures[0]} show={b.bar1} maxAbs={maxAbs} />
            <ShapBar feature={topFeatures[1]} show={b.bar2} maxAbs={maxAbs} />
          </div>
        </div>

        <motion.div initial={false} animate={{ opacity: b.curve ? 1 : 0 }} transition={{ duration: 0.5 }} aria-hidden={!b.curve}>
          <p className="short:mb-0.5 mb-1 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Uncertainty</p>
          <BellCurveSketch low={uncertaintyBand.low} high={uncertaintyBand.high} show={b.curve} />
        </motion.div>

        <p className="short:pt-1.5 short:text-xs border-t border-line pt-2 text-sm leading-relaxed text-ink">
          <TypeText text={plainLanguageExplanation} run={b.sentence} seconds={1.6} />
        </p>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.explanation ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden={!b.explanation}
        className="short:py-1.5 rounded-lg border border-green/30 bg-green/10 px-4 py-2"
      >
        <StatusRow label="Explanation generated" status={b.explanation ? 'done' : 'idle'} className="font-medium" />
      </motion.div>

      <motion.div initial={false} animate={{ opacity: b.button ? 1 : 0, y: b.button ? 0 : 12 }} transition={{ duration: 0.6, ease }}>
        <button
          type="button"
          onClick={handleViewResults}
          disabled={!b.button}
          tabIndex={b.button ? 0 : -1}
          className="btn-glow short:py-2.5 flex w-full items-center justify-center gap-3 rounded-xl px-8 py-3.5 text-lg font-semibold tracking-wide"
        >
          View Full Results
          <ArrowRight className="size-5" aria-hidden="true" />
        </button>
      </motion.div>
    </StageLayout>
  )
}
