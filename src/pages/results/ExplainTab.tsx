import { AttentionHeatmap } from '../../components/AttentionHeatmap'
import { CoverSquare } from '../../components/CoverSquare'
import { Panel } from '../../components/Panel'
import { SatelliteCanvas } from '../../components/SatelliteCanvas'
import { THUMB_PX, STORM_IMAGE_PX } from '../../config/imagery'
import type { StormCase, ShapFeature } from '../../data/cases'
import { cn } from '../../lib/cn'

const NO_LABELS: [boolean, boolean, boolean, boolean] = [false, false, false, false]

/** One SHAP feature, full width: name, signed contribution, a bar, and its full plain-language description. */
function FullShapBar({ feature, maxAbs }: { feature: ShapFeature; maxAbs: number }) {
  const up = feature.contribution > 0
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-sm font-semibold text-ink">{feature.name}</span>
        <span className={cn('num shrink-0 text-sm font-semibold', up ? 'text-amber' : 'text-primary')}>
          {up ? '+' : '−'}
          {Math.abs(feature.contribution)}
        </span>
      </div>
      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-line">
        <div className={cn('h-full rounded-full', up ? 'bg-amber' : 'bg-primary')} style={{ width: `${(Math.abs(feature.contribution) / maxAbs) * 100}%` }} />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-muted">{feature.description}</p>
    </div>
  )
}

/** A schematic bell curve (not a real statistical plot) sketching the uncertainty band around the 24h wind. */
function BellCurveFull({ low, high }: { low: number; high: number }) {
  const w = 260
  const h = 64
  const curve = `M 6 ${h - 8} C ${w * 0.28} ${h - 8}, ${w * 0.35} 8, ${w / 2} 8 C ${w * 0.65} 8, ${w * 0.72} ${h - 8}, ${w - 6} ${h - 8}`
  return (
    <div>
      <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`Uncertainty sketch: 24 hour wind speed likely between ${low} and ${high} knots`}>
        <rect x={w * 0.3} y={4} width={w * 0.4} height={h - 10} fill="var(--color-accent)" opacity={0.14} />
        <path d={curve} fill="none" stroke="var(--color-accent)" strokeWidth={2} strokeLinecap="round" />
        <line x1={6} y1={h - 6} x2={w - 6} y2={h - 6} stroke="var(--color-line)" strokeWidth={1} />
      </svg>
      <p className="num mt-1 text-center text-xs text-muted">
        Wind speed likely {low}-{high} kt at 24h
      </p>
    </div>
  )
}

/**
 * Explain tab: the full-size version of the compact panel shown on the story's Explain Result stage. ONE
 * consolidated panel — Grad-CAM, SHAP, attention and the uncertainty sketch are presented together under one
 * heading, never as three separately labelled techniques (see the Architecture pipeline section in
 * CLAUDE.md). The plain-language explanation leads, set off as a pull-quote; the full SHAP bar chart (every
 * feature, not just the top 2 shown on the story stage) and the uncertainty sketch sit beside the heatmap
 * image, with a small attention-map thumbnail and its caption underneath.
 */
export function ExplainTab({ caseData }: { caseData: StormCase }) {
  const { shapFeatures, attentionSummary, uncertaintyBand, plainLanguageExplanation } = caseData.precomputed.explainability
  const maxAbs = Math.max(...shapFeatures.map((f) => Math.abs(f.contribution)))

  return (
    <Panel title="Why CycloVision reached this assessment">
      <p className="border-l-2 border-accent pl-4 text-lg leading-relaxed text-ink italic">{plainLanguageExplanation}</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
        <div className="relative aspect-square overflow-hidden rounded-xl border border-line bg-base">
          <CoverSquare>
            <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} caseData={caseData} className="size-full" />
            <div className="absolute inset-0 bg-base" style={{ opacity: 0.35 }} />
            <AttentionHeatmap geometry={caseData.geometry} show labels={NO_LABELS} fadeSeconds={0.01} />
          </CoverSquare>
          <span className="absolute top-3 left-3 rounded-md border border-line bg-base/80 px-2 py-1 text-[10px] leading-none font-semibold tracking-[0.14em] text-muted uppercase backdrop-blur-sm">
            Grad-CAM attention
          </span>
        </div>

        <div className="space-y-5">
          <div>
            <p className="mb-2.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Signal contributions (SHAP)</p>
            <div className="space-y-3">
              {shapFeatures.map((f) => (
                <FullShapBar key={f.name} feature={f} maxAbs={maxAbs} />
              ))}
            </div>
          </div>

          <div className="flex gap-3 rounded-lg border border-line bg-panel p-3">
            <div className="relative size-16 shrink-0 overflow-hidden rounded-md border border-line bg-base">
              <CoverSquare>
                <SatelliteCanvas channel="fused" size={THUMB_PX} caseData={caseData} className="size-full object-cover" />
                <div className="absolute inset-0 bg-base" style={{ opacity: 0.3 }} />
                <AttentionHeatmap geometry={caseData.geometry} show labels={NO_LABELS} fadeSeconds={0.01} />
              </CoverSquare>
            </div>
            <p className="text-xs leading-relaxed text-muted">{attentionSummary}</p>
          </div>

          <div>
            <p className="mb-1.5 text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Uncertainty band</p>
            <BellCurveFull low={uncertaintyBand.low} high={uncertaintyBand.high} />
          </div>
        </div>
      </div>
    </Panel>
  )
}
