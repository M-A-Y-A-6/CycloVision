import { motion } from 'framer-motion'
import { ArrowLeft } from 'lucide-react'
import { AttentionHeatmap } from '../components/AttentionHeatmap'
import { CoverSquare } from '../components/CoverSquare'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { TypeText } from '../components/TypeText'
import { STORM_IMAGE_PX } from '../config/imagery'
import { EXPLAIN_BEATS } from '../config/timings'
import { explanation, riAssessment, type DataSourceId, type RiDriver } from '../data/storm'
import { cn } from '../lib/cn'
import { explanationSentence } from '../lib/explanationSentence'
import type { SatelliteChannel } from '../lib/satellite'
import { useBeats } from '../lib/useBeats'
import { useStory } from '../store/story'
import { useState } from 'react'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

const CHANNELS: ReadonlyArray<{ id: SatelliteChannel; label: string; note: string }> = [
  { id: 'fused', label: 'Fused', note: 'All four sources combined' },
  { id: 'ir', label: 'IR', note: 'Cloud-top temperature: no clear eye' },
  { id: 'wv', label: 'WV', note: 'Moisture in the air (dark = dry)' },
  { id: 'mw', label: 'MW', note: 'Rain inside the clouds: the ring shows' },
  { id: 'sst', label: 'SST', note: 'Sea temperature: a warm pool' },
]

// Full class strings so Tailwind can detect them.
const SOURCE_COLOURS: Record<DataSourceId, string> = {
  MW: 'bg-accent',
  IR: 'bg-primary',
  SST: 'bg-green',
  WV: 'bg-muted',
}

const SENTENCE = explanationSentence(explanation.drivers)
const MAX_PP = Math.max(...explanation.drivers.map((d) => Math.abs(d.contributionPp)))
const DRIVERS_TOTAL_PP = explanation.drivers.reduce((sum, d) => sum + d.contributionPp, 0)

interface DriverRowProps {
  driver: RiDriver
  show: boolean
}

/** One ranked driver: its name, a bar (amber pushes the risk up, blue pushes it down), and what it means in plain words. */
function DriverRow({ driver, show }: DriverRowProps) {
  const up = driver.contributionPp > 0
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -12 }}
      transition={{ duration: 0.5, ease }}
      aria-hidden={!show}
      className="grid grid-cols-[minmax(0,0.85fr)_minmax(0,1.15fr)] items-center gap-3"
    >
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <span className="short:text-[12px] truncate text-[13px] font-semibold text-ink">{driver.label}</span>
          <span className={cn('num text-sm font-semibold', up ? 'text-amber' : 'text-primary')}>
            {up ? '+' : '−'}
            {Math.abs(driver.contributionPp)}
          </span>
        </div>
        <div className="mt-1 h-2 overflow-hidden rounded-full bg-line">
          <motion.div
            className={cn('h-full rounded-full', up ? 'bg-amber shadow-[0_0_8px_rgb(245_158_11/0.5)]' : 'bg-primary')}
            initial={false}
            animate={{ width: show ? `${(Math.abs(driver.contributionPp) / MAX_PP) * 100}%` : '0%' }}
            transition={{ duration: 0.9, delay: 0.1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <p className="short:text-[11px] short:leading-tight text-xs leading-snug text-muted">{driver.description}</p>
    </motion.div>
  )
}

/**
 * The explanation screen, answering one question: "Why is the RI risk elevated?" On the left, the storm image with
 * the AI's attention heatmap over it and a switch between the satellite channels (the heatmap stays put). On the
 * right, a summary sentence written from the top drivers, the ranked drivers as bars, how much each data source
 * contributed, and a button back to the result. It is the last screen and never advances.
 * Timing: EXPLAIN_BEATS in config/timings.ts (plain seconds after the screen appears).
 */
export function Explain(_props: StageProps) {
  const b = useBeats(1, EXPLAIN_BEATS)
  const back = useStory((s) => s.back)
  const [channel, setChannel] = useState<SatelliteChannel>('fused')
  const driverShown = [b.driver1, b.driver2, b.driver3, b.driver4, b.driver5, b.driver6]

  return (
    <StageLayout
      stage="explain"
      columns="lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]"
      tight
      sentence={<TypeText text={SENTENCE} run={b.sentence} seconds={1.6} />}
      visual={
        <div className="flex flex-1 flex-col">
          <motion.div
            initial={false}
            animate={{ opacity: b.switcher ? 1 : 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-line px-3 py-2.5"
          >
            <div role="radiogroup" aria-label="Satellite channel" className="flex gap-1 rounded-lg border border-line bg-base/60 p-1">
              {CHANNELS.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  role="radio"
                  aria-checked={channel === c.id}
                  onClick={() => setChannel(c.id)}
                  className={cn(
                    'rounded-md px-3.5 py-1.5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-accent',
                    channel === c.id ? 'bg-accent/15 text-accent shadow-[inset_0_0_0_1px_rgb(34_211_238/0.5)]' : 'text-muted hover:text-ink',
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
            <motion.span
              key={channel}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="text-xs text-muted"
            >
              {CHANNELS.find((c) => c.id === channel)?.note}
            </motion.span>
          </motion.div>

          <div className="relative flex-1">
            <CoverSquare>
              {/* Every channel is stacked; switching cross-fades the one on top. The fused image stays underneath. */}
              {CHANNELS.map((c) => (
                <motion.div
                  key={c.id}
                  className="absolute inset-0"
                  initial={false}
                  animate={{ opacity: c.id === 'fused' || c.id === channel ? 1 : 0 }}
                  transition={{ duration: 0.45, ease: 'easeInOut' }}
                >
                  <SatelliteCanvas channel={c.id} size={STORM_IMAGE_PX} className="size-full" />
                </motion.div>
              ))}
              {/* The image dims a little as the heatmap fades in, so the heat stands out on every channel (IR is orange too). */}
              <motion.div
                className="absolute inset-0 bg-base"
                initial={false}
                animate={{ opacity: b.heatmap ? 0.4 : 0 }}
                transition={{ duration: 1.4, ease: 'easeInOut' }}
              />
              <AttentionHeatmap show={b.heatmap} labels={[b.label1, b.label2, b.label3, b.label4]} fadeSeconds={1.4} />
            </CoverSquare>

            <motion.div
              initial={false}
              animate={{ opacity: b.heatmap ? 1 : 0 }}
              transition={{ duration: 1, delay: 0.4 }}
              className="absolute bottom-3 left-3 flex items-center gap-2 rounded-md border border-line bg-base/85 px-2.5 py-1.5 text-[10px] font-semibold tracking-[0.14em] text-muted uppercase backdrop-blur-sm"
            >
              AI attention
              <span className="h-1.5 w-14 rounded-full bg-gradient-to-r from-amber/10 via-amber to-red" />
              <span>low to high</span>
            </motion.div>
          </div>
        </div>
      }
    >
      <motion.div
        initial={false}
        animate={{ opacity: b.card ? 1 : 0, y: b.card ? 0 : 8 }}
        transition={{ duration: 0.5, ease }}
        aria-hidden={!b.card}
        className="short:py-2 rounded-xl border border-line bg-panel px-4 py-3"
      >
        <div className="short:mb-1.5 mb-2.5 flex items-baseline justify-between gap-3">
          <p className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">What drives the risk</p>
          <p className="num text-[11px] text-muted">
            {explanation.baselinePct}% typical + {DRIVERS_TOTAL_PP} points = {Math.round(riAssessment.probability24hPct)}%
          </p>
        </div>
        <div className="short:space-y-1 space-y-2.5">
          {explanation.drivers.map((driver, i) => (
            <DriverRow key={driver.id} driver={driver} show={driverShown[i]} />
          ))}
        </div>
      </motion.div>

      <div className="flex items-stretch gap-3">
        <motion.div
          initial={false}
          animate={{ opacity: b.sources ? 1 : 0, y: b.sources ? 0 : 8 }}
          transition={{ duration: 0.5, ease }}
          aria-hidden={!b.sources}
          className="short:py-2 min-w-0 flex-1 rounded-xl border border-line bg-panel px-4 py-2.5"
        >
          <p className="text-[10px] font-semibold tracking-[0.14em] text-muted uppercase">Contribution by data source</p>
          <div className="mt-2 flex h-2.5 gap-0.5 overflow-hidden rounded-full">
            {explanation.sourceShares.map((source, i) => (
              <motion.div
                key={source.id}
                className={cn('h-full', SOURCE_COLOURS[source.id])}
                initial={false}
                animate={{ width: b.sources ? `${source.sharePct}%` : '0%' }}
                transition={{ duration: 0.8, delay: 0.15 * i, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div
            className="mt-1.5 grid"
            style={{ gridTemplateColumns: explanation.sourceShares.map((s) => `${s.sharePct}fr`).join(' ') }}
          >
            {explanation.sourceShares.map((source) => (
              <span key={source.id} className="num text-[11px] whitespace-nowrap text-muted">
                <span className="font-semibold text-ink">{source.id}</span> {source.sharePct}%
              </span>
            ))}
          </div>
        </motion.div>

        <motion.button
          type="button"
          onClick={back}
          disabled={!b.button}
          tabIndex={b.button ? 0 : -1}
          initial={false}
          animate={{ opacity: b.button ? 1 : 0, y: b.button ? 0 : 8 }}
          transition={{ duration: 0.5, ease }}
          className="flex shrink-0 items-center gap-2 rounded-xl border border-accent/40 bg-accent/10 px-5 text-[1rem] font-semibold text-accent transition-colors hover:border-accent hover:bg-accent/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <ArrowLeft className="size-5" aria-hidden="true" />
          Back to result
        </motion.button>
      </div>
    </StageLayout>
  )
}
