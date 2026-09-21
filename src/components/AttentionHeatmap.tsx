import { motion } from 'framer-motion'
import { STORM_GEOMETRY, type Point } from '../lib/satellite'
import { FeatureLabel } from './StructureOverlay'

/**
 * The AI's "attention" on the storm: a heatmap showing where in the image the evidence for rapid intensification
 * is strongest. Drawn from STORM_GEOMETRY (the eyewall ring, the two hotspots, the strongest curved band), so it
 * is the same over every satellite channel and must be placed inside a <CoverSquare> over the image.
 */

const VIEW = 1000
const { center, innerRingRadius, hotspots, bands } = STORM_GEOMETRY
const BAND_ANCHOR = bands[0][24]

const AMBER = 'var(--color-amber)'

interface Blob {
  id: string
  at: Point
  /** Radius in image widths. */
  radius: number
  /** How strongly the AI attended here, 0-1. */
  weight: number
}

// Soft blobs of attention. Weights follow the driver contributions: the ring matters most.
const BLOBS: Blob[] = [
  { id: 'a', at: hotspots[0], radius: 0.095, weight: 0.85 },
  { id: 'b', at: hotspots[1], radius: 0.085, weight: 0.7 },
  { id: 'c', at: BAND_ANCHOR, radius: 0.12, weight: 0.5 },
]

// Labels, in Dvorak-style vocabulary. Each points at the feature it names; pill positions were chosen to clear
// the other features and to stay inside the visible (cropped) part of the image.
const LABELS = [
  { text: 'Eyewall ring', from: { x: center.x, y: center.y + innerRingRadius }, at: { x: center.x, y: center.y + 0.125 } },
  { text: 'CDO cold tops', from: hotspots[0], at: { x: hotspots[0].x + 0.15, y: hotspots[0].y - 0.14 } },
  { text: 'Inner core convection', from: hotspots[1], at: { x: hotspots[1].x - 0.15, y: hotspots[1].y + 0.14 } },
  { text: 'Curved band', from: BAND_ANCHOR, at: { x: BAND_ANCHOR.x + 0.115, y: BAND_ANCHOR.y } },
]

interface AttentionHeatmapProps {
  /** The heatmap fades in when this turns true. */
  show: boolean
  /** Which of the four labels are showing. */
  labels: [boolean, boolean, boolean, boolean]
  fadeSeconds: number
}

export function AttentionHeatmap({ show, labels, fadeSeconds }: AttentionHeatmapProps) {
  const px = (v: number) => v * VIEW
  return (
    <>
      <svg viewBox={`0 0 ${VIEW} ${VIEW}`} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <defs>
          <radialGradient id="attention-blob">
            <stop offset="0%" stopColor="#ef4444" stopOpacity="0.95" />
            <stop offset="35%" stopColor="#f59e0b" stopOpacity="0.7" />
            <stop offset="70%" stopColor="#f59e0b" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          {/* The filter covers the whole image; a region hugging the ring would clip the glow into a visible square. */}
          <filter id="attention-soft" filterUnits="userSpaceOnUse" x="0" y="0" width={VIEW} height={VIEW}>
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* The microwave eyewall ring: the hottest thing on the image, a glowing ring rather than a blob. */}
        <motion.g
          initial={false}
          animate={{ opacity: show ? 1 : 0 }}
          transition={{ duration: fadeSeconds, ease: 'easeInOut' }}
          filter="url(#attention-soft)"
        >
          <circle cx={px(center.x)} cy={px(center.y)} r={px(innerRingRadius)} fill="none" stroke="#f59e0b" strokeOpacity={0.8} strokeWidth={54} />
          <circle cx={px(center.x)} cy={px(center.y)} r={px(innerRingRadius)} fill="none" stroke="#ef4444" strokeOpacity={0.95} strokeWidth={26} />
        </motion.g>

        {BLOBS.map((blob, i) => (
          <motion.circle
            key={blob.id}
            cx={px(blob.at.x)}
            cy={px(blob.at.y)}
            r={px(blob.radius)}
            fill="url(#attention-blob)"
            initial={false}
            animate={{ opacity: show ? blob.weight : 0 }}
            transition={{ duration: fadeSeconds, delay: show ? 0.15 * (i + 1) : 0, ease: 'easeInOut' }}
          />
        ))}
      </svg>

      {LABELS.map((label, i) => (
        <FeatureLabel key={label.text} show={labels[i]} text={label.text} color={AMBER} from={label.from} at={label.at} />
      ))}
    </>
  )
}
