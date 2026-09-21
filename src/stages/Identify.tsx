import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useMap } from 'react-leaflet'
import { LockReticle, ScanLine, TighteningGrid, UncertaintyCircle } from '../components/AnalysisOverlay'
import { CountUp } from '../components/CountUp'
import { CoverSquare } from '../components/CoverSquare'
import { MonitoringMap } from '../components/MonitoringMap'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { DetectionMarker, StormSwirl } from '../components/StormMapOverlays'
import { STORM_IMAGE_PX } from '../config/imagery'
import { IDENTIFY_BEATS, STAGE_SECONDS } from '../config/timings'
import { storm } from '../data/storm'
import { cn } from '../lib/cn'
import { swirlPixels } from '../lib/swirlSize'
import { useBeats } from '../lib/useBeats'
import { useLatest } from '../lib/useLatest'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.identify
/** Seconds between two beats of the stage. */
const between = (from: keyof typeof IDENTIFY_BEATS, to: keyof typeof IDENTIFY_BEATS) =>
  (IDENTIFY_BEATS[to] - IDENTIFY_BEATS[from]) * TOTAL

/** Sits inside the map and reports where the storm is on screen, in pixels, so the zoom can aim at it. */
function StormProbe({ onPoint }: { onPoint: (point: { x: number; y: number }) => void }) {
  const map = useMap()
  useEffect(() => {
    const p = map.latLngToContainerPoint([storm.center.latN, storm.center.lonE])
    onPoint({ x: p.x, y: p.y })
  }, [map, onPoint])
  return null
}

/** Progress ring that fills counter-clockwise from the top. */
function ConfidenceRing({ fraction, run }: { fraction: number; run: boolean }) {
  return (
    <svg viewBox="0 0 44 44" className="size-11 shrink-0 rotate-90 -scale-x-100" aria-hidden="true">
      <circle cx="22" cy="22" r="18" fill="none" stroke="var(--color-line)" strokeWidth="4" />
      <motion.circle
        cx="22"
        cy="22"
        r="18"
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth="4"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: run ? fraction : 0 }}
        transition={{ duration: 1, ease: 'easeOut' }}
      />
    </svg>
  )
}

/** One line of the info panel: a small label and its value, settling in when `show` turns true. */
function ReadoutRow({ label, show, children }: { label: string; show: boolean; children: ReactNode }) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0, x: show ? 0 : -10 }}
      transition={{ duration: 0.5, ease }}
      aria-hidden={!show}
      className="grid grid-cols-[6.5rem_1fr] items-center gap-3 rounded-xl border border-line bg-panel px-4 py-3"
    >
      <span className="text-[11px] font-semibold tracking-[0.14em] text-muted uppercase">{label}</span>
      <div className="flex items-center gap-3 text-xl font-semibold">{children}</div>
    </motion.div>
  )
}

/**
 * Stage 2, Identify. The map zooms into the storm and cross-fades into the fused satellite image; the AI
 * analysis then scans it, tightens a grid, locks a crosshair on the centre and draws an uncertainty circle,
 * while the storm's centre, movement and confidence settle into the info panel. Timing: STAGE_SECONDS.identify
 * and IDENTIFY_BEATS in config/timings.ts.
 */
export function Identify({ onDone }: StageProps) {
  const doneRef = useLatest(onDone)
  const b = useBeats(TOTAL, IDENTIFY_BEATS)
  useEffect(() => {
    if (b.end) doneRef.current()
  }, [b.end, doneRef])

  // Where the storm is on screen and how big the visual is, so the zoom can be aimed at the storm and
  // end with it in the middle of the panel.
  const visualRef = useRef<HTMLDivElement>(null)
  const [frame, setFrame] = useState<{ ox: number; oy: number; w: number; h: number } | null>(null)
  const onPoint = useCallback((p: { x: number; y: number }) => {
    const el = visualRef.current
    if (el) setFrame({ ox: p.x, oy: p.y, w: el.clientWidth, h: el.clientHeight })
  }, [])

  // Zoom until the storm swirl on the map grows to the size of the satellite image that replaces it.
  const zoom = frame && {
    scale: Math.max(frame.w, frame.h) / swirlPixels(),
    x: frame.w / 2 - frame.ox,
    y: frame.h / 2 - frame.oy,
  }
  const zooming = b.zoom && zoom
  const lockSeconds = between('crosshair', 'lock')

  return (
    <StageLayout
      stage="identify"
      visual={
        <div ref={visualRef} className="absolute inset-0">
          {/* Layer 1: the map from the previous stage, zooming in on the storm. */}
          <motion.div
            className="absolute inset-0 will-change-transform"
            style={{ originX: frame ? frame.ox / frame.w : 0.5, originY: frame ? frame.oy / frame.h : 0.5 }}
            initial={false}
            animate={{
              scale: zooming ? zoom.scale : 1,
              x: zooming ? zoom.x : 0,
              y: zooming ? zoom.y : 0,
              opacity: b.zoomEnd ? 0 : 1,
            }}
            transition={{
              scale: { duration: between('zoom', 'zoomEnd'), ease: [0.55, 0, 0.25, 1] },
              x: { duration: between('zoom', 'zoomEnd'), ease: [0.55, 0, 0.25, 1] },
              y: { duration: between('zoom', 'zoomEnd'), ease: [0.55, 0, 0.25, 1] },
              opacity: { duration: 0.3 },
            }}
          >
            <MonitoringMap className="size-full" showLabel={!b.zoom}>
              <StormSwirl progress={1} />
              <DetectionMarker show={!b.zoom} />
              <StormProbe onPoint={onPoint} />
            </MonitoringMap>
          </motion.div>

          {/* Layer 2: the fused satellite image with the AI analysis on top, fading in as the zoom ends. */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: b.crossfade ? 1 : 0 }}
            transition={{ duration: between('crossfade', 'zoomEnd'), ease: 'easeInOut' }}
          >
            <CoverSquare>
              <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} className="size-full" />
              <TighteningGrid visible={b.grid} tighten={b.tighten} tightenSeconds={between('tighten', 'tightenEnd')} />
              <UncertaintyCircle show={b.uncertainty} />
              <LockReticle show={b.crosshair} lockSeconds={lockSeconds} locked={b.lock} />
            </CoverSquare>
          </motion.div>

          <ScanLine run={b.scan} seconds={between('scan', 'scanEnd')} />
        </div>
      }
    >
      <div className="space-y-2.5">
        <ReadoutRow label="Center" show={b.crosshair}>
          <span className="num">
            <CountUp from={storm.center.latN - 3.5} to={storm.center.latN} decimals={1} run={b.crosshair} seconds={lockSeconds} />° N
            <span className="text-muted">,&nbsp;</span>
            <CountUp from={storm.center.lonE - 3.5} to={storm.center.lonE} decimals={1} run={b.crosshair} seconds={lockSeconds} />° E
          </span>
        </ReadoutRow>

        <ReadoutRow label="Movement" show={b.movement}>
          <motion.span
            initial={false}
            animate={{ rotate: b.movement ? storm.movement.headingDeg - 360 : 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="grid size-9 place-items-center rounded-full border border-line bg-base text-accent"
          >
            <ArrowUp className="size-5" strokeWidth={2.5} aria-label="pointing north-west" />
          </motion.span>
          <span className="num">
            {storm.movement.directionLabel} at{' '}
            <CountUp to={storm.movement.speedKmh} run={b.movement} seconds={0.9} /> km/h
          </span>
        </ReadoutRow>

        <ReadoutRow label="Confidence" show={b.confidence}>
          <ConfidenceRing fraction={storm.identificationConfidencePct / 100} run={b.confidence} />
          <span className="num">
            <CountUp to={storm.identificationConfidencePct} run={b.confidence} seconds={1} />%
          </span>
        </ReadoutRow>
      </div>

      <motion.div
        initial={false}
        animate={{ opacity: b.identified ? 1 : 0, y: b.identified ? 0 : 8 }}
        transition={{ duration: 0.7, ease }}
        aria-hidden={!b.identified}
        className={cn('rounded-lg border border-green/30 bg-green/10 px-4 py-3')}
      >
        <StatusRow label="Cyclone center identified" status={b.identified ? 'done' : 'idle'} className="font-medium" />
      </motion.div>
    </StageLayout>
  )
}
