import { motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '../components/Badge'
import { BASIN_TONE } from '../config/basin'
import { STAGE_MOTION } from '../config/timings'
import { cn } from '../lib/cn'
import { useCase } from '../lib/useCase'
import { useStory } from '../store/story'
import { AlertTab } from './results/AlertTab'
import { ConsensusTab } from './results/ConsensusTab'
import { ExplainTab } from './results/ExplainTab'
import { ResultsTab } from './results/ResultsTab'
import { TrackTab } from './results/TrackTab'

const TABS = [
  { id: 'results', label: 'Results' },
  { id: 'explain', label: 'Explain' },
  { id: 'track', label: 'Track' },
  { id: 'consensus', label: 'Consensus' },
  { id: 'alert', label: 'Alert' },
] as const
type TabId = (typeof TABS)[number]['id']

/**
 * Results Panel ("/results", Phase 15). Reached only by the "[ View Full Results ]" button at the end of the
 * Explain Result stage, which sets `resultsPanelReached` before navigating here — so a direct or stale visit
 * (the flag is false: no run has reached it yet, or Replay/New Simulation cleared it) redirects back to
 * Analysis instead of showing an empty page out of context.
 *
 * Header: the basin chip, then "Back to Analysis" (a plain route change — the story's stage, doneStages and
 * everything else in the store are untouched, so every completed stage's data is exactly as it was) and
 * "New Simulation" (the same clean-slate reset the Replay button uses, then back to Dashboard).
 * A five-tab bar below switches between Results (default), Explain, Track, Consensus and Alert — each tab is
 * its own component in `pages/results/`.
 */
export function ResultsPanel() {
  const resultsPanelReached = useStory((s) => s.resultsPanelReached)
  const reset = useStory((s) => s.reset)
  const navigate = useNavigate()
  const caseData = useCase()
  const [tab, setTab] = useState<TabId>('results')

  if (!resultsPanelReached) return <Navigate to="/analysis" replace />

  const handleNewSimulation = () => {
    reset()
    navigate('/')
  }

  return (
    <motion.main
      className="mx-auto flex w-full max-w-[1100px] flex-1 flex-col px-4 py-6 sm:px-6"
      initial={STAGE_MOTION.initial}
      animate={STAGE_MOTION.animate}
      exit={STAGE_MOTION.exit}
      transition={STAGE_MOTION.transition}
    >
      <header className="mb-5 flex flex-col gap-3 border-b border-line pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <Badge tone={BASIN_TONE[caseData.basin]}>{caseData.basin}</Badge>
          <h1 className="mt-2.5 text-2xl font-semibold tracking-tight text-ink">Full Results</h1>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          <Link
            to="/analysis"
            className="rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            ← Back to Analysis
          </Link>
          <button
            type="button"
            onClick={handleNewSimulation}
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3.5 py-1.5 text-sm font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <RotateCcw className="size-3.5" aria-hidden="true" />
            New Simulation
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Results sections" className="mb-5 flex gap-1 overflow-x-auto rounded-lg border border-line bg-panel p-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cn(
              'rounded-md px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
              tab === t.id ? 'bg-accent/15 text-accent' : 'text-muted hover:text-ink',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" className="flex-1">
        {tab === 'results' && <ResultsTab caseData={caseData} />}
        {tab === 'explain' && <ExplainTab caseData={caseData} />}
        {tab === 'track' && <TrackTab caseData={caseData} />}
        {tab === 'consensus' && <ConsensusTab caseData={caseData} />}
        {tab === 'alert' && <AlertTab caseData={caseData} />}
      </div>
    </motion.main>
  )
}
