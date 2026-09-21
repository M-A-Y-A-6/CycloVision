import { motion } from 'framer-motion'
import { useMemo, type ReactNode } from 'react'
import { ensemble, riAssessment } from '../data/storm'

/**
 * The Predict-stage chart, in custom SVG: the 30 intensity paths of the ensemble over the next 24 hours, the
 * median path, the 10-90% uncertainty band and the dashed +30 kt rapid-intensification line. Everything is
 * drawn from the data in data/storm.ts and revealed piece by piece through the boolean props.
 */

// Animated colours must be literal values: these are the design tokens.
const PRIMARY = '#1e90ff'
const AMBER = '#f59e0b'
const ACCENT = '#22d3ee'
const INK = '#e6edf7'
const MUTED = '#8494b0'
const BASE = '#0a101c'

const HOURS = 24
const WIND_MIN = 40
const WIND_MAX = 120
const MARGIN = { left: 56, right: 46, top: 22, bottom: 52 }
const START_KT = ensemble.startWindKt
const RI_LINE_KT = START_KT + riAssessment.thresholdKt

/** Which members reach rapid intensification by hour 24, and each one's place among those (for staggering). */
const REACHES_RI = ensemble.paths.map((p) => p[HOURS] - START_KT >= riAssessment.thresholdKt)
const RI_ORDER = REACHES_RI.map((_, i) => REACHES_RI.slice(0, i).filter(Boolean).length)
/** Cool paths first, warm on top, so the warm ones are never buried. */
const DRAW_ORDER = ensemble.paths.map((_, i) => i).sort((a, b) => Number(REACHES_RI[a]) - Number(REACHES_RI[b]))

/** The hour the "Uncertainty band" callout points at: inside the forecast window, where the band is wide. */
const BAND_LABEL_HOUR = 15

const FINAL = ensemble.paths.map((p) => p[HOURS])
const FINAL_MIN = Math.min(...FINAL)
const FINAL_MAX = Math.max(...FINAL)

type Pt = readonly [number, number]

/** Smooth curve through the points (Catmull-Rom as cubic Beziers), as the "C ..." commands after an M. */
function curve(points: Pt[]): string {
  let d = ''
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i - 1] ?? points[i]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[i + 2] ?? p2
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C ${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}
const line = (points: Pt[]) => `M ${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}${curve(points)}`

interface CalloutProps {
  show: boolean
  x: number
  y: number
  text: string
  color: string
}

/** Small label pill, centred on (x, y), same look as the labels on the storm image. */
function Callout({ show, x, y, text, color }: CalloutProps) {
  return (
    <motion.div
      className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: x, top: y }}
      initial={false}
      animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.85 }}
      transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
      aria-hidden={!show}
    >
      <span
        className="flex items-center gap-1.5 rounded-md border bg-base/90 px-2 py-1 text-[11px] leading-none font-semibold whitespace-nowrap text-ink shadow-lg"
        style={{ borderColor: color }}
      >
        <span className="size-1.5 rounded-full" style={{ background: color }} />
        {text}
      </span>
    </motion.div>
  )
}

interface EnsembleChartProps {
  width: number
  height: number
  /** Frame: axes, grid, the 12h and 24h markers and the forecast window. */
  axes: boolean
  paths: boolean
  median: boolean
  band: boolean
  riLine: boolean
  /** The paths that cross the +30 kt line turn warm. */
  warm: boolean
  spreadLabel: boolean
  bandLabel: boolean
  /** Seconds for one path to draw and the delay between one path and the next. */
  pathSeconds: number
  pathStagger: number
  medianSeconds: number
  bandSeconds: number
  riLineSeconds: number
  warmStagger: number
}

export function EnsembleChart(props: EnsembleChartProps): ReactNode {
  const { width, height } = props

  const g = useMemo(() => {
    const left = MARGIN.left
    const right = width - MARGIN.right
    const top = MARGIN.top
    const bottom = height - MARGIN.bottom
    const x = (hour: number) => left + (hour / HOURS) * (right - left)
    const y = (kt: number) => bottom - ((kt - WIND_MIN) / (WIND_MAX - WIND_MIN)) * (bottom - top)
    const at = (series: readonly number[]): Pt[] => series.map((kt, hour) => [x(hour), y(kt)] as const)

    const upper = at(ensemble.p90Kt)
    const lower = at(ensemble.p10Kt)
    return {
      left,
      right,
      top,
      bottom,
      x,
      y,
      pathD: ensemble.paths.map((p) => line(at(p))),
      medianD: line(at(ensemble.medianKt)),
      bandD: `M ${upper[0][0].toFixed(1)} ${upper[0][1].toFixed(1)}${curve(upper)} L ${lower[HOURS][0].toFixed(1)} ${lower[HOURS][1].toFixed(1)}${curve([...lower].reverse())} Z`,
    }
  }, [width, height])

  const { left, right, top, bottom, x, y } = g
  /** Height of the top strip, above the highest path, where the labels sit. */
  const callY = y(113)

  return (
    <div className="absolute inset-0">
      <svg
        width={width}
        height={height}
        className="absolute inset-0"
        role="img"
        aria-label="Chart of 30 possible wind-speed paths for the next 24 hours, with the median path, the 10 to 90 percent band and the rapid intensification line at 85 knots"
      >
        {/* Frame: forecast window, grid, axes. */}
        <motion.g initial={false} animate={{ opacity: props.axes ? 1 : 0 }} transition={{ duration: 0.6 }}>
          <rect x={x(12)} y={top} width={x(24) - x(12)} height={bottom - top} fill={ACCENT} fillOpacity={0.06} />
          {[12, 24].map((h) => (
            <line key={h} x1={x(h)} x2={x(h)} y1={top} y2={bottom} stroke={ACCENT} strokeOpacity={0.45} strokeDasharray="4 5" />
          ))}
          {[40, 60, 80, 100, 120].map((kt) => (
            <line key={kt} x1={left} x2={right} y1={y(kt)} y2={y(kt)} stroke={MUTED} strokeOpacity={kt === 40 ? 0.5 : 0.16} />
          ))}
          {[40, 60, 80, 100].map((kt) => (
            <text key={kt} x={left - 10} y={y(kt) + 4} textAnchor="end" className="num" fontSize={11} fill={MUTED}>
              {kt}
            </text>
          ))}
          {Array.from({ length: HOURS / 3 + 1 }, (_, i) => i * 3).map((h) => (
            <line key={h} x1={x(h)} x2={x(h)} y1={bottom} y2={bottom + (h % 6 === 0 ? 6 : 3)} stroke={MUTED} strokeOpacity={0.6} />
          ))}
          {[0, 6, 12, 18, 24].map((h) => {
            const key = h === 12 || h === 24
            return (
              <text key={h} x={x(h)} y={bottom + 22} textAnchor="middle" className="num" fontSize={key ? 13 : 11} fontWeight={key ? 700 : 400} fill={key ? ACCENT : MUTED}>
                {h === 0 ? 'Now' : `${h}h`}
              </text>
            )
          })}
          <text x={(left + right) / 2} y={height - 8} textAnchor="middle" fontSize={12} fill={MUTED}>
            Next 24 hours
          </text>
          <text transform={`translate(16 ${(top + bottom) / 2}) rotate(-90)`} textAnchor="middle" fontSize={12} fill={MUTED}>
            Storm wind speed (kt)
          </text>
          {/* Along the bottom of the window: no path ever drops below 48 kt, so this strip is always clear. */}
          <text x={x(12) + 10} y={y(43.2) + 4} fontSize={11} fontWeight={600} letterSpacing="0.06em" fill={ACCENT}>
            12-24h forecast window
          </text>
        </motion.g>

        {/* 10-90% uncertainty band: behind the paths, fades in after the median. */}
        <motion.path
          d={g.bandD}
          fill={ACCENT}
          stroke={ACCENT}
          strokeWidth={1}
          strokeOpacity={0.5}
          initial={false}
          animate={{ fillOpacity: props.band ? 0.17 : 0, opacity: props.band ? 1 : 0 }}
          transition={{ duration: props.bandSeconds, ease: 'easeInOut' }}
        />

        {/* The 30 possible futures, each drawn outward from "now". Cool blue; the ones reaching RI turn warm. */}
        {DRAW_ORDER.map((i) => {
          const warm = props.warm && REACHES_RI[i]
          const recolour = { duration: 0.6, delay: RI_ORDER[i] * props.warmStagger }
          return (
            <motion.path
              key={i}
              d={g.pathD[i]}
              fill="none"
              strokeWidth={1.5}
              strokeLinejoin="round"
              initial={false}
              animate={{ pathLength: props.paths ? 1 : 0, stroke: warm ? AMBER : PRIMARY, strokeOpacity: warm ? 0.75 : 0.5 }}
              transition={{
                pathLength: { duration: props.pathSeconds, delay: i * props.pathStagger, ease: 'easeOut' },
                stroke: recolour,
                strokeOpacity: recolour,
              }}
            />
          )
        })}

        {/* Rapid-intensification threshold: +30 kt above the current wind. */}
        <motion.line
          x1={left}
          y1={y(RI_LINE_KT)}
          y2={y(RI_LINE_KT)}
          stroke={AMBER}
          strokeWidth={2}
          strokeDasharray="9 6"
          initial={false}
          animate={{ x2: props.riLine ? right : left, opacity: props.riLine ? 1 : 0 }}
          transition={{ x2: { duration: props.riLineSeconds, ease: 'easeInOut' }, opacity: { duration: 0.2 } }}
        />
        <motion.g initial={false} animate={{ opacity: props.riLine ? 1 : 0 }} transition={{ duration: 0.5, delay: props.riLineSeconds * 0.6 }}>
          <text x={left - 10} y={y(RI_LINE_KT) + 4} textAnchor="end" className="num" fontSize={11} fontWeight={700} fill={AMBER}>
            {RI_LINE_KT}
          </text>
          <text
            x={left + 8}
            y={y(RI_LINE_KT) - 9}
            fontSize={12}
            fontWeight={700}
            fill={AMBER}
            stroke={BASE}
            strokeWidth={4}
            strokeLinejoin="round"
            paintOrder="stroke"
          >
            +30 kt = Rapid Intensification
          </text>
        </motion.g>

        {/* Median path, with the 12h and 24h points marked on it. */}
        <motion.path
          d={g.medianD}
          fill="none"
          stroke={INK}
          strokeWidth={3.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: 'drop-shadow(0 0 4px rgb(230 237 247 / 0.55))' }}
          initial={false}
          animate={{ pathLength: props.median ? 1 : 0, opacity: props.median ? 1 : 0 }}
          transition={{ pathLength: { duration: props.medianSeconds, ease: 'easeInOut' }, opacity: { duration: 0.15 } }}
        />
        {[12, 24].map((h) => (
          <motion.circle
            key={h}
            cx={x(h)}
            cy={y(ensemble.medianKt[h])}
            r={5.5}
            fill={INK}
            stroke={BASE}
            strokeWidth={2}
            initial={false}
            animate={{ opacity: props.median ? 1 : 0, scale: props.median ? 1 : 0.4 }}
            style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            transition={{ duration: 0.4, delay: props.median ? props.medianSeconds * (h / HOURS) : 0 }}
          />
        ))}

        {/* "Now": where every future starts. */}
        <motion.circle
          cx={x(0)}
          cy={y(START_KT)}
          r={5}
          fill={ACCENT}
          stroke={BASE}
          strokeWidth={2}
          initial={false}
          animate={{ opacity: props.axes ? 1 : 0 }}
          transition={{ duration: 0.6 }}
        />

        {/* Probability spread: how far apart the 30 outcomes end up at 24 hours. */}
        <motion.g initial={false} animate={{ opacity: props.spreadLabel ? 1 : 0 }} transition={{ duration: 0.5 }} stroke={INK} strokeOpacity={0.85} strokeWidth={1.8} fill="none" strokeLinecap="round">
          <path d={`M ${right + 8} ${y(FINAL_MAX)} H ${right + 14} V ${y(FINAL_MIN)} H ${right + 8}`} />
          <line x1={right + 14} x2={right + 14} y1={y(FINAL_MAX)} y2={callY + 12} />
        </motion.g>

        {/* Leader from the uncertainty-band label down to the top edge of the band, where it is wide. */}
        <motion.line
          x1={x(BAND_LABEL_HOUR)}
          x2={x(BAND_LABEL_HOUR)}
          y1={callY + 12}
          y2={y(ensemble.p90Kt[BAND_LABEL_HOUR])}
          stroke={ACCENT}
          strokeWidth={1.6}
          strokeOpacity={0.8}
          initial={false}
          animate={{ opacity: props.bandLabel ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        />
      </svg>

      <Callout show={props.bandLabel} x={x(BAND_LABEL_HOUR)} y={callY} text="Uncertainty band" color={ACCENT} />
      <Callout show={props.spreadLabel} x={right + 14 - 56} y={callY} text="Probability spread" color={INK} />
    </div>
  )
}
