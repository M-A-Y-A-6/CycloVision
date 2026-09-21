import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MonitoringMap } from '../components/MonitoringMap'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { DetectionMarker, StormSwirl } from '../components/StormMapOverlays'
import { THUMB_PX } from '../config/imagery'
import { DETECT_BEATS, STAGE_SECONDS } from '../config/timings'
import { cn } from '../lib/cn'
import type { SatelliteChannel } from '../lib/satellite'
import { useLatest } from '../lib/useLatest'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

const SOURCES: ReadonlyArray<{ label: string; channel: SatelliteChannel }> = [
  { label: 'IR (INSAT-3D/3DR)', channel: 'ir' },
  { label: 'Water Vapor', channel: 'wv' },
  { label: 'Microwave', channel: 'mw' },
  { label: 'SST', channel: 'sst' },
]

/** Three dots that fade in and out one after another. */
function Ellipsis({ animate }: { animate: boolean }) {
  return (
    <span aria-hidden="true">
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          animate={{ opacity: animate ? [0.25, 1, 0.25] : 1 }}
          transition={animate ? { duration: 1.4, repeat: Infinity, delay: i * 0.22, ease: 'easeInOut' } : { duration: 0.3 }}
        >
          .
        </motion.span>
      ))}
    </span>
  )
}

interface SourceRowProps {
  label: string
  channel: SatelliteChannel
  visible: boolean
  status: 'idle' | 'active' | 'done'
}

/** One data source: the status row on the left, and its satellite thumbnail fading in on the right when it is ticked. */
function SourceRow({ label, channel, visible, status }: SourceRowProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: visible ? 1 : 0, x: visible ? 0 : -14 }}
      transition={{ duration: 0.45, ease }}
      aria-hidden={!visible}
      className="short:py-1.5 flex items-center justify-between gap-4 rounded-lg border border-line bg-panel px-4 py-2"
    >
      <StatusRow label={label} status={status} />
      <motion.div
        initial={false}
        animate={{ opacity: status === 'done' ? 1 : 0, scale: status === 'done' ? 1 : 0.85 }}
        transition={{ duration: 0.6, ease }}
        className="short:size-10 size-12 shrink-0 overflow-hidden rounded-md border border-line bg-base"
      >
        <SatelliteCanvas channel={channel} size={THUMB_PX} className="size-full" />
      </motion.div>
    </motion.div>
  )
}

/**
 * Stage 1, Detect. Four sources appear one after another, each spinning, then ticking with its thumbnail.
 * A swirl builds on the map as they arrive; after the fourth tick a marker and "Cyclone-like system detected"
 * appear. The timing follows STAGE_SECONDS.detect and DETECT_BEATS in config/timings.ts.
 */
export function Detect({ onDone }: StageProps) {
  const doneRef = useLatest(onDone)
  const [shown, setShown] = useState(0) // rows on screen
  const [ticked, setTicked] = useState(0) // rows finished
  const [detected, setDetected] = useState(false)

  useEffect(() => {
    const total = STAGE_SECONDS.detect
    const at = (fraction: number, fn: () => void) => setTimeout(fn, fraction * total * 1000)
    const { firstRow, rowGap, spin, detectionLag } = DETECT_BEATS

    const timers = SOURCES.flatMap((_, i) => {
      const appears = firstRow + i * rowGap
      return [at(appears, () => setShown(i + 1)), at(appears + spin, () => setTicked(i + 1))]
    })
    const lastTick = firstRow + (SOURCES.length - 1) * rowGap + spin
    timers.push(at(lastTick + detectionLag, () => setDetected(true)))
    timers.push(at(1, () => doneRef.current()))

    return () => timers.forEach(clearTimeout)
  }, [doneRef])

  const receiving = ticked < SOURCES.length

  return (
    <StageLayout
      stage="detect"
      visual={
        <div className="absolute inset-0">
          <MonitoringMap className="size-full">
            <StormSwirl progress={ticked / SOURCES.length} />
            <DetectionMarker show={detected} />
          </MonitoringMap>
        </div>
      }
    >
      <p className={cn('text-[1rem] font-medium transition-colors duration-500', receiving ? 'text-ink' : 'text-muted')}>
        Receiving multi-source satellite observations
        <Ellipsis animate={receiving} />
      </p>

      <div className="space-y-2.5">
        {SOURCES.map((source, i) => (
          <SourceRow
            key={source.channel}
            {...source}
            visible={i < shown}
            status={i < ticked ? 'done' : i < shown ? 'active' : 'idle'}
          />
        ))}
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: detected ? 1 : 0, y: detected ? 0 : 8 }}
        transition={{ duration: 0.7, ease }}
        aria-hidden={!detected}
        className="flex items-center gap-3 rounded-lg border border-amber/30 bg-amber/10 px-4 py-3"
      >
        <TriangleAlert className="size-5 shrink-0 text-amber" aria-hidden="true" />
        <span className="font-medium text-ink">Cyclone-like system detected</span>
      </motion.div>
    </StageLayout>
  )
}
