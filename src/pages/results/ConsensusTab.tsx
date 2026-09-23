import { Panel } from '../../components/Panel'
import type { StormCase } from '../../data/cases'
import { cn } from '../../lib/cn'

/**
 * Consensus tab: IMD, ADT, SATCON and JTWC estimates side by side, with CycloVision's own current-intensity
 * read included for the same context, not singled out as authoritative — framed as a comparison for
 * forecaster context, per the brief, not as this system overriding anyone.
 */
export function ConsensusTab({ caseData }: { caseData: StormCase }) {
  const { imd, adt, satcon, jtwc, note } = caseData.precomputed.consensus
  const rows: ReadonlyArray<{ label: string; value: number; emphasis?: boolean }> = [
    { label: 'IMD', value: imd },
    { label: 'ADT', value: adt },
    { label: 'SATCON', value: satcon },
    { label: 'JTWC', value: jtwc },
    { label: 'This assessment', value: caseData.currentIntensity.maxWindKt, emphasis: true },
  ]
  const max = Math.max(...rows.map((r) => r.value))

  return (
    <Panel title="Intensity estimates across techniques">
      <p className="mb-5 text-sm text-muted">
        A side-by-side comparison of current maximum sustained wind estimates, for forecaster context —
        CycloVision's own read sits alongside the others here, not in place of them.
      </p>
      <div className="space-y-3.5">
        {rows.map((r) => (
          <div key={r.label} className="grid grid-cols-[7.5rem_1fr_4rem] items-center gap-3">
            <span className={cn('text-sm', r.emphasis ? 'font-semibold text-accent' : 'text-ink')}>{r.label}</span>
            <div className="h-2.5 overflow-hidden rounded-full bg-line">
              <div className={cn('h-full rounded-full', r.emphasis ? 'bg-accent' : 'bg-primary/70')} style={{ width: `${(r.value / max) * 100}%` }} />
            </div>
            <span className="num text-right text-sm text-ink">{r.value} kt</span>
          </div>
        ))}
      </div>
      <p className="mt-5 border-t border-line pt-3.5 text-sm text-muted">{note}</p>
    </Panel>
  )
}
