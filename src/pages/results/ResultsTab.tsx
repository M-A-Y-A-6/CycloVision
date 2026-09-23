import { Panel } from '../../components/Panel'
import { MiniGauge } from '../../components/MiniGauge'
import type { StormCase } from '../../data/cases'
import { riRiskLevel } from '../../data/cases'

/** A small SVG line preview of the track — deliberately lightweight, unlike the full Leaflet map on the Track tab. */
function TrackPreview({ caseData }: { caseData: StormCase }) {
  const { pastPositions, forecastPositions } = caseData.precomputed.track
  const current = caseData.center
  const w = 100
  const h = 100
  const pad = 10

  const lats = [...pastPositions, current, ...forecastPositions].map((p) => p.lat)
  const lons = [...pastPositions, current, ...forecastPositions].map((p) => p.lon)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLon = Math.min(...lons)
  const maxLon = Math.max(...lons)
  const latSpan = Math.max(0.001, maxLat - minLat)
  const lonSpan = Math.max(0.001, maxLon - minLon)
  const sx = (lon: number) => pad + ((lon - minLon) / lonSpan) * (w - 2 * pad)
  // Latitude increases northward, but SVG y increases downward, so this flips it.
  const sy = (lat: number) => pad + (1 - (lat - minLat) / latSpan) * (h - 2 * pad)

  const pastPts = pastPositions.map((p) => [sx(p.lon), sy(p.lat)] as const)
  const curPt = [sx(current.lon), sy(current.lat)] as const
  const fcPts = forecastPositions.map((p) => [sx(p.lon), sy(p.lat)] as const)
  const path = (pts: readonly (readonly [number, number])[]) => 'M ' + pts.map((p) => p.join(' ')).join(' L ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full max-w-[220px]" role="img" aria-label="Small preview of the storm's past and forecast track">
      <path d={path([...pastPts, curPt])} fill="none" stroke="var(--color-muted)" strokeWidth={1.6} strokeLinecap="round" />
      <path d={path([curPt, ...fcPts])} fill="none" stroke="var(--color-amber)" strokeWidth={1.6} strokeLinecap="round" strokeDasharray="4 3" />
      {pastPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2} fill="var(--color-muted)" />
      ))}
      <circle cx={curPt[0]} cy={curPt[1]} r={3} fill="var(--color-accent)" />
      {fcPts.map((p, i) => (
        <circle key={i} cx={p[0]} cy={p[1]} r={2} fill="var(--color-amber)" />
      ))}
    </svg>
  )
}

/**
 * Results tab (default): the intensity category, the RI gauge (MiniGauge, reused from Predict RI) showing the
 * final 24h probability, and a lightweight track preview.
 */
export function ResultsTab({ caseData }: { caseData: StormCase }) {
  const { category, confidence } = caseData.precomputed.classification
  const { probability24h } = caseData.precomputed.riPrediction
  const level = riRiskLevel(probability24h)
  const { landfallEta } = caseData.precomputed.track

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Panel title="Structure">
        <p className="text-xl leading-tight font-semibold text-ink">{category}</p>
        <p className="mt-1.5 text-sm text-muted">
          <span className="num">{confidence}%</span> classification confidence
        </p>
      </Panel>

      <Panel title="RI risk · 24 h">
        <MiniGauge probabilityPct={probability24h} level={level} run seconds={1.2} size={88} />
      </Panel>

      <Panel title="Track preview" className="sm:col-span-2">
        <div className="flex flex-wrap items-center gap-6">
          <TrackPreview caseData={caseData} />
          <div className="min-w-0">
            <p className="text-sm text-ink">{landfallEta || 'No landfall expected in this window'}</p>
            <p className="mt-1 text-xs text-muted">See the Track tab for the full map and uncertainty cone.</p>
          </div>
        </div>
      </Panel>
    </div>
  )
}
