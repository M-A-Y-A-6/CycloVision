import { AnimatePresence, motion } from 'framer-motion'
import { Cpu, Radio, Satellite, TriangleAlert, Waves, Wind, type LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { ContinueButton } from '../components/ContinueButton'
import { MonitoringMap } from '../components/MonitoringMap'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { DetectionMarker, StormSwirl } from '../components/StormMapOverlays'
import { DETECT_BEATS, STAGE_SECONDS } from '../config/timings'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useCase } from '../lib/useCase'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.detect

const SOURCES: ReadonlyArray<{ label: string; icon: LucideIcon }> = [
  { label: 'INSAT', icon: Satellite },
  { label: 'SAPHIR Microwave', icon: Radio },
  { label: 'Ocean', icon: Waves },
  { label: 'Atmospheric', icon: Wind },
  { label: 'NWP', icon: Cpu },
]
const ICON_BEATS = ['icon1', 'icon2', 'icon3', 'icon4', 'icon5'] as const

const PREPROCESS_STEPS = ['Data Cleaning', 'Geocoding & Reprojection', 'Storm-Centered Cropping', 'Normalization & Calibration']
const STEP_BEATS = ['step1', 'step2', 'step3', 'step4'] as const

/** One data-source chip: dim until its turn, then lights up in the accent colour. */
function SourceIcon({ icon: Icon, label, lit }: { icon: LucideIcon; label: string; lit: boolean }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: lit ? 1 : 0.4, scale: lit ? 1 : 0.94 }}
      transition={{ duration: 0.5, ease }}
      className={cn(
        'flex flex-col items-center gap-1.5 rounded-lg border px-2 py-3 text-center transition-colors duration-500',
        lit ? 'border-accent/60 bg-accent/10 text-accent shadow-[0_0_14px_rgb(34_211_238/0.25)]' : 'border-line bg-panel text-muted',
      )}
    >
      <Icon className="size-5" aria-hidden="true" />
      <span className="text-[10px] leading-tight font-medium">{label}</span>
    </motion.div>
  )
}

/**
 * Stage 1, Detect ("Simulate Cyclone" on the tracker; model stage: Data Ingestion & Preprocessing). Five
 * source icons (INSAT, SAPHIR microwave, Ocean, Atmospheric, NWP) light up one after another, then the row
 * gives way to a four-step preprocessing checklist (Data Cleaning, Geocoding & Reprojection, Storm-Centered
 * Cropping, Normalization & Calibration) that ticks off one by one. A swirl builds on the map behind it as
 * the sources arrive; the final tick shows a calm pulsing amber marker and "Preprocessing complete", then a
 * Continue button. The animation follows STAGE_SECONDS.detect and DETECT_BEATS in config/timings.ts; the
 * story only moves to Identify when the visitor clicks Continue. If the progress tracker jumped straight
 * here because it was already finished, `instant` skips straight to the end.
 */
export function Detect({ onDone }: StageProps) {
  const caseData = useCase()
  const instant = useStory((s) => s.doneStages.detect ?? false)
  const markDone = useStory((s) => s.markDone)
  const b = useBeats(TOTAL, DETECT_BEATS, instant)
  useEffect(() => {
    if (b.complete) markDone('detect')
  }, [b.complete, markDone])

  const litCount = ICON_BEATS.filter((k) => b[k]).length
  const stepDone = STEP_BEATS.map((k) => b[k])
  const swirlProgress = b.checklist ? 1 : litCount / SOURCES.length
  const receiving = !b.complete

  const stepStatus = (i: number): 'idle' | 'active' | 'done' => {
    if (stepDone[i]) return 'done'
    const active = i === 0 ? b.checklist : stepDone[i - 1]
    return active ? 'active' : 'idle'
  }

  return (
    <StageLayout
      stage="detect"
      pipelineLabels={['Data Ingestion & Preprocessing']}
      visual={
        <div className="absolute inset-0">
          <MonitoringMap className="size-full">
            <StormSwirl caseData={caseData} progress={swirlProgress} />
            <DetectionMarker caseData={caseData} show={b.complete} />
          </MonitoringMap>
        </div>
      }
    >
      <p className={cn('text-[1rem] font-medium transition-colors duration-500', receiving ? 'text-ink' : 'text-muted')}>
        {b.checklist ? 'Preparing the storm scene for the model' : 'Consulting the data sources'}
      </p>

      <AnimatePresence mode="wait" initial={false}>
        {!b.checklist ? (
          <motion.div
            key="sources"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.35, ease } }}
            transition={{ duration: 0.4, ease }}
            className="grid grid-cols-5 gap-2"
          >
            {SOURCES.map((source, i) => (
              <SourceIcon key={source.label} {...source} lit={i < litCount} />
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="checklist"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease, delay: 0.1 }}
            className="space-y-2.5"
          >
            {PREPROCESS_STEPS.map((step, i) => (
              <div key={step} className="short:py-1.5 rounded-lg border border-line bg-panel px-4 py-2">
                <StatusRow label={step} status={stepStatus(i)} />
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={false}
        animate={{ opacity: b.complete ? 1 : 0, y: b.complete ? 0 : 8 }}
        transition={{ duration: 0.7, ease }}
        aria-hidden={!b.complete}
        className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3"
      >
        <TriangleAlert className="size-5 shrink-0 text-amber" aria-hidden="true" />
        <span className="font-medium text-ink">Preprocessing complete</span>
      </motion.div>

      <ContinueButton show={b.complete} label="Continue to Identification" onClick={onDone} />
    </StageLayout>
  )
}
