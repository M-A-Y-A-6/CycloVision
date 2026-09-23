import { MapPin } from 'lucide-react'
import { Badge } from '../../components/Badge'
import { Panel } from '../../components/Panel'
import { TrackMap } from '../../components/TrackMap'
import type { StormCase } from '../../data/cases'

/**
 * Track tab: the case's past and forecast positions on the same dark Leaflet map used everywhere else in the
 * app (`TrackMap`, reusing `config/map.ts`'s tile layers), with a widening uncertainty cone around the
 * forecast points and the landfall ETA — labelled as the Physics-Guided Track Head's output.
 */
export function TrackTab({ caseData }: { caseData: StormCase }) {
  const { landfallEta } = caseData.precomputed.track

  return (
    <Panel>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">Forecast track</p>
        <Badge tone="blue" className="text-[10px] normal-case">
          Physics-Guided Track Head
        </Badge>
      </div>

      <TrackMap caseData={caseData} className="short:h-[280px] h-[360px] rounded-xl border border-line" />

      <div className="mt-3.5 flex items-start gap-2.5 rounded-lg border border-line bg-base px-3.5 py-2.5">
        <MapPin className="mt-0.5 size-4 shrink-0 text-amber" aria-hidden="true" />
        <p className="text-sm text-ink">{landfallEta || 'No landfall expected in this window'}</p>
      </div>
      <p className="mt-2 text-xs text-muted">
        The translucent circles show the growing position uncertainty at each forecast point (6h, 12h, 18h, 24h) — the
        further out the forecast, the wider the possible track.
      </p>
    </Panel>
  )
}
