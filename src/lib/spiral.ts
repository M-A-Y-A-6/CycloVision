/**
 * Geometry for the CycloVision logo: a three-armed cyclone spiral on a
 * 24x24 grid that rotates counter-clockwise like a northern-hemisphere storm:
 * moving outward, each arm trails clockwise (same handedness as the storm imagery).
 * Deterministic, so the UI icon and public/favicon.svg always match.
 */
const CENTER = 12
const ARMS = 3
const STEPS = 24
const TURN = 1.5 * Math.PI // how far each arm winds
const R_INNER = 3.2
const R_OUTER = 10.4

export const SPIRAL_PATHS: string[] = Array.from({ length: ARMS }, (_, arm) => {
  const start = (arm * 2 * Math.PI) / ARMS
  const points = Array.from({ length: STEPS + 1 }, (_, i) => {
    const t = i / STEPS
    const theta = start - t * TURN
    const r = R_INNER + t * (R_OUTER - R_INNER)
    const x = CENTER + r * Math.cos(theta)
    const y = CENTER - r * Math.sin(theta)
    return `${x.toFixed(2)} ${y.toFixed(2)}`
  })
  return `M${points.join(' L')}`
})
