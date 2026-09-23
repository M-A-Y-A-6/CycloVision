import { motion } from 'framer-motion'
import { useEffect, type ReactNode } from 'react'
import { Badge } from '../components/Badge'
import { ContinueButton } from '../components/ContinueButton'
import { CountUp } from '../components/CountUp'
import { CoverSquare } from '../components/CoverSquare'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { BASIN_TONE } from '../config/basin'
import { STORM_IMAGE_PX } from '../config/imagery'
import { CLASSIFY_BEATS, STAGE_SECONDS } from '../config/timings'
import { cn } from '../lib/cn'
import { useBeats } from '../lib/useBeats'
import { useCase } from '../lib/useCase'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.classify

function Stat({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="text-right">
      <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="num text-xl leading-tight font-semibold text-ink">{children}</p>
    </div>
  )
}

/** One of the four inputs the Physics-Guided GAT fuses, arranged around the centre "Fused" node. */
const GAT_NODES: ReadonlyArray<{ label: string; x: number; y: number }> = [
  { label: 'Cloud pattern', x: 40, y: 20 },
  { label: 'Wind shear', x: 240, y: 20 },
  { label: 'SST', x: 40, y: 82 },
  { label: 'Moisture', x: 240, y: 82 },
]
const GAT_CENTER = { x: 140, y: 51 }

/**
 * A small node-graph sketch of the Physics-Guided GAT's relational fusion: four labelled nodes (cloud
 * pattern, wind shear, SST, moisture) light up and connect to a centre node one by one; the centre node
 * itself lights up once all four have joined it.
 */
function RelationalFusionGraph({ pulses, fused }: { pulses: boolean[]; fused: boolean }) {
  return (
    <svg
      viewBox="0 0 280 108"
      className="mx-auto w-full max-w-[240px]"
      role="img"
      aria-label="Physics-Guided GAT fusing cloud pattern, wind shear, SST and moisture into one fused representation"
    >
      {GAT_NODES.map((n, i) => (
        <motion.line
          key={`line-${n.label}`}
          x1={n.x}
          y1={n.y}
          x2={GAT_CENTER.x}
          y2={GAT_CENTER.y}
          stroke="var(--color-accent)"
          strokeWidth={1.5}
          initial={false}
          animate={{ pathLength: pulses[i] ? 1 : 0, opacity: pulses[i] ? 0.55 : 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
        />
      ))}
      {GAT_NODES.map((n, i) => (
        <g key={n.label}>
          <motion.circle
            cx={n.x}
            cy={n.y}
            r={12}
            fill="var(--color-panel)"
            strokeWidth={1.5}
            initial={false}
            animate={{ stroke: pulses[i] ? 'var(--color-accent)' : 'var(--color-line)', scale: pulses[i] ? 1.08 : 1 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            transition={{ duration: 0.4, ease }}
          />
          <text x={n.x} y={n.y + 22} textAnchor="middle" fontSize={9.5} fill="var(--color-muted)">
            {n.label}
          </text>
        </g>
      ))}
      <motion.circle
        cx={GAT_CENTER.x}
        cy={GAT_CENTER.y}
        r={15}
        fill="var(--color-accent)"
        stroke="var(--color-accent)"
        strokeWidth={2}
        initial={false}
        animate={{ fillOpacity: fused ? 0.25 : 0.05, opacity: fused ? 1 : 0.55, scale: fused ? 1.1 : 1 }}
        style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
        transition={{ duration: 0.5, ease }}
      />
      <text x={GAT_CENTER.x} y={GAT_CENTER.y + 3.5} textAnchor="middle" fontSize={9.5} fontWeight={700} fill="var(--color-accent)">
        Fused
      </text>
    </svg>
  )
}

/**
 * Stage 3, Classify (model: ConvNeXt feature extraction, then Physics-Guided GAT relational fusion). The
 * cropped storm image sits in the main visual; the status column shows the fusion graph (cloud pattern, wind
 * shear, SST and moisture nodes pulsing into a fused centre), then a "Basin Head Active" badge and the
 * intensity category with its confidence, then "Structure classified" and a Continue button. The animation
 * follows STAGE_SECONDS.classify and CLASSIFY_BEATS in config/timings.ts; the story only moves to Predict
 * when the visitor clicks Continue. If the progress tracker jumped straight here because it was already
 * finished, `instant` skips the whole build-up and shows the finished result immediately.
 */
export function Classify({ onDone }: StageProps) {
  const caseData = useCase()
  const instant = useStory((s) => s.doneStages.classify ?? false)
  const markDone = useStory((s) => s.markDone)
  const b = useBeats(TOTAL, CLASSIFY_BEATS, instant)
  useEffect(() => {
    if (b.structure) markDone('classify')
  }, [b.structure, markDone])

  const pulses = [b.node1, b.node2, b.node3, b.node4]
  const { category, confidence } = caseData.precomputed.classification

  return (
    <StageLayout
      stage="classify"
      pipelineLabels={['ConvNeXt — feature extraction', 'Physics-Guided GAT — relational fusion']}
      visual={
        <div className="absolute inset-0">
          <CoverSquare>
            <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} caseData={caseData} className="size-full" />
          </CoverSquare>
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.node1 ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden={!b.node1}
        className="short:py-1.5 rounded-xl border border-line bg-panel px-4 py-2"
      >
        <p className="short:mb-0.5 mb-1 text-center text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Relational fusion</p>
        <RelationalFusionGraph pulses={pulses} fused={b.fused} />
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.basin ? 1 : 0, y: b.basin ? 0 : 8 }}
        transition={{ duration: 0.5, ease }}
        aria-hidden={!b.basin}
      >
        <Badge tone={BASIN_TONE[caseData.basin]} size="lg">
          Basin Head Active: {caseData.basin}
        </Badge>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.category ? 1 : 0, y: b.category ? 0 : 8 }}
        transition={{ duration: 0.6, ease }}
        aria-hidden={!b.category}
        className="short:py-1.5 flex items-center justify-between gap-4 rounded-xl border border-accent/40 bg-accent/10 px-4 py-2.5"
      >
        <div className="min-w-0">
          <p className="text-[10px] font-semibold tracking-[0.14em] text-accent uppercase">Intensity category</p>
          <p className="text-[1rem] leading-tight font-semibold text-ink">{category}</p>
        </div>
        <Stat label="Confidence">
          <CountUp to={confidence} run={b.category} seconds={0.8} />%
        </Stat>
      </motion.div>

      <motion.div
        initial={false}
        animate={{ opacity: b.structure ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        aria-hidden={!b.structure}
        className={cn('short:py-2 rounded-lg border border-green/30 bg-green/10 px-4 py-2.5')}
      >
        <motion.div initial={false} animate={{ opacity: b.structure ? 1 : 0, y: b.structure ? 0 : 6 }} transition={{ duration: 0.6, ease }}>
          <StatusRow label="Structure classified" status={b.structure ? 'done' : 'idle'} className="font-medium" />
        </motion.div>
      </motion.div>

      <ContinueButton show={b.structure} label="Continue to Prediction" onClick={onDone} />
    </StageLayout>
  )
}
