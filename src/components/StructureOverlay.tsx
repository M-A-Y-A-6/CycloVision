import { motion } from 'framer-motion'
import { useMemo } from 'react'
import type { Point, StormGeometry } from '../lib/satellite'

/**
 * The Dvorak-aligned structural overlay: the three curved-band arcs, the CDO outline and the cloud-system
 * centre, each with a small label. Everything is drawn from the case's own geometry (normalised 0-1), so it
 * must be placed inside a <CoverSquare> over the fused satellite image; the strokes then lie exactly on the
 * features. Geometry comes in as a prop since each case has its own eyewall ring and hotspots.
 */

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

// Colours are the design tokens (amber, accent, ink).
const BAND_COLOR = 'var(--color-amber)'
const CDO_COLOR = 'var(--color-accent)'
const CENTER_COLOR = 'var(--color-ink)'

/** The drawing space is 1000 x 1000 so strokes can be sized in ordinary numbers. */
const VIEW = 1000
const toPath = (points: Point[], close = false) =>
  'M' + points.map((p) => `${(p.x * VIEW).toFixed(1)} ${(p.y * VIEW).toFixed(1)}`).join(' L') + (close ? ' Z' : '')

export interface LabelProps {
  show: boolean
  text: string
  color: string
  from: Point
  at: Point
}

/** A small pill with a leader line to the feature it names. */
export function FeatureLabel({ show, text, color, from, at }: LabelProps) {
  return (
    <>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <motion.line
          x1={from.x * VIEW}
          y1={from.y * VIEW}
          x2={at.x * VIEW}
          y2={at.y * VIEW}
          stroke={color}
          strokeWidth={1.6}
          strokeOpacity={0.8}
          initial={false}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </svg>
      <motion.div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${at.x * 100}%`, top: `${at.y * 100}%` }}
        initial={false}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.85 }}
        transition={{ duration: 0.45, ease }}
        aria-hidden={!show}
      >
        <span
          className="flex items-center gap-1.5 rounded-md border bg-base/85 px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-ink shadow-lg backdrop-blur-sm"
          style={{ borderColor: color }}
        >
          <span className="size-1.5 rounded-full" style={{ background: color }} />
          {text}
        </span>
      </motion.div>
    </>
  )
}

interface StructureOverlayProps {
  geometry: StormGeometry
  bands: boolean
  bandsLabel: boolean
  cdo: boolean
  cdoLabel: boolean
  center: boolean
  centerLabel: boolean
  /** Seconds for one arc to draw, and the delay between one arc and the next. */
  arcSeconds: number
  arcStagger: number
  /** Seconds for the CDO outline to draw. */
  cdoSeconds: number
}

export function StructureOverlay(props: StructureOverlayProps) {
  const { bands, cdo, center } = props.geometry

  // Where each label sits and what it points at, in normalised coordinates. Chosen from the geometry to stay
  // clear of the other features and inside the visible part of the (cropped) image.
  const derived = useMemo(() => {
    const bandPaths = bands.map((band) => toPath(band))
    const cdoPath = toPath(cdo, true)
    const bandAnchor = bands[0][24] // the strongest arc, on the east side of the storm
    return {
      bandPaths,
      cdoPath,
      labels: {
        band: { from: bandAnchor, at: { x: bandAnchor.x + 0.105, y: bandAnchor.y } },
        cdo: { from: { x: center.x, y: cdo[24].y }, at: { x: center.x, y: cdo[24].y - 0.052 } }, // top of the CDO
        center: { from: { x: center.x, y: center.y }, at: { x: center.x, y: center.y + 0.112 } },
      },
    }
  }, [bands, cdo, center])

  return (
    <>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        {/* Curved bands: three arcs, drawn one after another. */}
        {derived.bandPaths.map((d, i) => (
          <motion.path
            key={i}
            d={d}
            fill="none"
            stroke={BAND_COLOR}
            strokeWidth={4}
            strokeLinecap="round"
            style={{ filter: 'drop-shadow(0 0 5px rgb(245 158 11 / 0.7))' }}
            initial={false}
            animate={{ pathLength: props.bands ? 1 : 0, opacity: props.bands ? 1 : 0 }}
            transition={{ duration: props.arcSeconds, delay: i * props.arcStagger, ease: 'easeInOut' }}
          />
        ))}

        {/* Central dense overcast: outline draws round, then the inside takes a faint tint. */}
        <motion.path
          d={derived.cdoPath}
          fill={CDO_COLOR}
          stroke={CDO_COLOR}
          strokeWidth={3.5}
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 5px rgb(34 211 238 / 0.7))' }}
          initial={false}
          animate={{ pathLength: props.cdo ? 1 : 0, opacity: props.cdo ? 1 : 0, fillOpacity: props.cdo ? 0.09 : 0 }}
          transition={{
            pathLength: { duration: props.cdoSeconds, ease: 'easeInOut' },
            opacity: { duration: 0.3 },
            fillOpacity: { duration: 0.8, delay: props.cdoSeconds },
          }}
        />
      </svg>

      {/* Cloud-system centre marker. */}
      <motion.div
        className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
        style={{ left: `${center.x * 100}%`, top: `${center.y * 100}%` }}
        initial={false}
        animate={{ opacity: props.center ? 1 : 0, scale: props.center ? 1 : 1.8 }}
        transition={{ duration: 0.6, ease }}
        aria-hidden="true"
      >
        <svg viewBox="-24 -24 48 48" className="size-11 overflow-visible">
          {/* Each mark is drawn twice, a dark halo under a light stroke, so it reads on the white cloud too. */}
          {[
            { stroke: 'var(--color-base)', width: 6, dot: 5.4 },
            { stroke: CENTER_COLOR, width: 2.6, dot: 2.8 },
          ].map(({ stroke, width, dot }) => (
            <g key={stroke}>
              <g stroke={stroke} strokeWidth={width} strokeLinecap="round">
                <line x1="0" y1="-20" x2="0" y2="-8" />
                <line x1="0" y1="8" x2="0" y2="20" />
                <line x1="-20" y1="0" x2="-8" y2="0" />
                <line x1="8" y1="0" x2="20" y2="0" />
              </g>
              <circle r={dot} fill={stroke} />
            </g>
          ))}
        </svg>
      </motion.div>

      <FeatureLabel show={props.bandsLabel} text="Curved Band" color={BAND_COLOR} {...derived.labels.band} />
      <FeatureLabel show={props.cdoLabel} text="CDO" color={CDO_COLOR} {...derived.labels.cdo} />
      <FeatureLabel show={props.centerLabel} text="Cloud system center" color={CENTER_COLOR} {...derived.labels.center} />
    </>
  )
}
