import { motion } from 'framer-motion'
import { ArrowUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { useMap } from 'react-leaflet'
import { LockReticle } from '../components/AnalysisOverlay'
import { ContinueButton } from '../components/ContinueButton'
import { CountUp } from '../components/CountUp'
import { CoverSquare } from '../components/CoverSquare'
import { MonitoringMap } from '../components/MonitoringMap'
import { SatelliteCanvas } from '../components/SatelliteCanvas'
import { StageLayout } from '../components/StageLayout'
import { StatusRow } from '../components/StatusRow'
import { DetectionMarker, StormSwirl } from '../components/StormMapOverlays'
import { STORM_IMAGE_PX } from '../config/imagery'
import { IDENTIFY_BEATS, STAGE_SECONDS } from '../config/timings'
import { cn } from '../lib/cn'
import { swirlPixels } from '../lib/swirlSize'
import { useBeats } from '../lib/useBeats'
import { useCase } from '../lib/useCase'
import { useStory } from '../store/story'
import type { StageProps } from './types'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]
const TOTAL = STAGE_SECONDS.identify
/** Seconds between two beats of the stage. */
const between = (from: keyof typeof IDENTIFY_BEATS, to: keyof typeof IDENTIFY_BEATS) =>
  (IDENTIFY_BEATS[to] - IDENTIFY_BEATS[from]) * TOTAL
/** The bounding-box/label/crosshair overlay is drawn in a 1000x1000 space, matching every other overlay in the app. */
const VIEW = 1000

/** Sits inside the map and reports where the storm is on screen, in pixels, so the zoom can aim at it. */
function StormProbe({ lat, lon, onPoint }: { lat: number; lon: number; onPoint: (point: { x: number; y: number }) => void }) {
  const map = useMap()
  useEffect(() => {
    const p = map.latLngToContainerPoint([lat, lon])
    onPoint({ x: p.x, y: p.y })
  }, [map, lat, lon, onPoint])
  return null
}

/** The bounding box YOLO-NAS draws around the detected cloud mass, from identification.boundingBox. */
function BoundingBox({ box, show, seconds }: { box: readonly [number, number, number, number]; show: boolean; seconds: number }) {
  const [x, y, w, h] = box
  const path = `M ${x * VIEW} ${y * VIEW} L ${(x + w) * VIEW} ${y * VIEW} L ${(x + w) * VIEW} ${(y + h) * VIEW} L ${x * VIEW} ${(y + h) * VIEW} Z`
  return (
    <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <motion.path
        d={path}
        fill="none"
        stroke="var(--color-accent)"
        strokeWidth={3.5}
        strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 0 6px rgb(34 211 238 / 0.7))' }}
        initial={false}
        animate={{ pathLength: show ? 1 : 0, opacity: show ? 1 : 0 }}
        transition={{ duration: seconds, ease: 'easeInOut' }}
      />
    </svg>
  )
}

interface DetectionLabelProps {
  box: readonly [number, number, number, number]
  show: boolean
  confidence: number
  lat: number
  lon: number
}

/** The floating "Cyclone Detected" tag, pinned above the bounding box's top-left corner. */
function DetectionLabel({ box, show, confidence, lat, lon }: DetectionLabelProps) {
  const [x, y] = box
  return (
    <motion.div
      className="pointer-events-none absolute -translate-y-[calc(100%+10px)]"
      style={{ left: `${x * 100}%`, top: `${y * 100}%` }}
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 6 }}
      transition={{ duration: 0.5, ease }}
      aria-hidden={!show}
    >
      <span className="num flex items-center gap-1.5 rounded-md border border-accent bg-base/85 px-2.5 py-1.5 text-[11px] leading-none font-semibold whitespace-nowrap text-accent shadow-lg backdrop-blur-sm">
        <span className="size-1.5 rounded-full bg-accent" />
        Cyclone Detected &mdash; {confidence}% confidence &mdash; {lat.toFixed(1)}&deg; N, {lon.toFixed(1)}&deg; E
      </span>
    </motion.div>
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
 * Stage 2, Identify (model: YOLO-NAS). The map zooms into the storm and cross-fades into the fused satellite
 * image; a bounding box then draws itself around the storm (identification.boundingBox), a "Cyclone Detected"
 * label settles above it with the confidence and coordinates, and a crosshair locks onto the centre — while
 * Movement settles into the info panel — then a Continue button appears. The animation follows
 * STAGE_SECONDS.identify and IDENTIFY_BEATS in config/timings.ts; the story only moves to Classify when the
 * visitor clicks Continue. If the progress tracker jumped straight here because it was already finished,
 * `instant` skips the whole build-up and shows the finished result immediately.
 */
export function Identify({ onDone }: StageProps) {
  const caseData = useCase()
  const instant = useStory((s) => s.doneStages.identify ?? false)
  const markDone = useStory((s) => s.markDone)
  const b = useBeats(TOTAL, IDENTIFY_BEATS, instant)
  useEffect(() => {
    if (b.identified) markDone('identify')
  }, [b.identified, markDone])

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
  const { confidence, centerCoords, boundingBox } = caseData.precomputed.identification

  return (
    <StageLayout
      stage="identify"
      pipelineLabels={['YOLO-NAS — cyclone detection & center localization']}
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
              <StormSwirl caseData={caseData} progress={1} />
              <DetectionMarker caseData={caseData} show={!b.zoom} />
              <StormProbe lat={caseData.center.lat} lon={caseData.center.lon} onPoint={onPoint} />
            </MonitoringMap>
          </motion.div>

          {/* Layer 2: the fused satellite image with the bounding box, label and crosshair, fading in as the zoom ends. */}
          <motion.div
            className="absolute inset-0"
            initial={false}
            animate={{ opacity: b.crossfade ? 1 : 0 }}
            transition={{ duration: between('crossfade', 'zoomEnd'), ease: 'easeInOut' }}
          >
            <CoverSquare>
              <SatelliteCanvas channel="fused" size={STORM_IMAGE_PX} caseData={caseData} className="size-full" />
              <BoundingBox box={boundingBox} show={b.box} seconds={between('box', 'boxEnd')} />
              <DetectionLabel box={boundingBox} show={b.boxEnd} confidence={confidence} lat={centerCoords.lat} lon={centerCoords.lon} />
              <LockReticle show={b.crosshair} lockSeconds={lockSeconds} locked={b.lock} center={caseData.geometry.center} instant={instant} />
            </CoverSquare>
          </motion.div>
        </div>
      }
    >
      <div className="space-y-2.5">
        <ReadoutRow label="Movement" show={b.movement}>
          <motion.span
            initial={false}
            animate={{ rotate: b.movement ? caseData.movement.headingDeg - 360 : 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="grid size-9 place-items-center rounded-full border border-line bg-base text-accent"
          >
            <ArrowUp className="size-5" strokeWidth={2.5} aria-label={`pointing ${caseData.movement.directionLabel}`} />
          </motion.span>
          <span className="num">
            {caseData.movement.directionLabel} at{' '}
            <CountUp to={caseData.movement.speedKmh} run={b.movement} seconds={0.9} /> km/h
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

      <ContinueButton show={b.identified} label="Continue to Classification" onClick={onDone} />
    </StageLayout>
  )
}
