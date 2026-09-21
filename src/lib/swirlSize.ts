/** On-screen size of the storm swirl on the map: 17% of the viewport width, between 150 and 230 px. */
const SWIRL_SIZE = { min: 150, vw: 17, max: 230 }

/** The same rule as CSS, for styling the swirl. */
export const SWIRL_CSS_SIZE = `clamp(${SWIRL_SIZE.min}px, ${SWIRL_SIZE.vw}vw, ${SWIRL_SIZE.max}px)`

/** The swirl's current size in pixels (same rule as above), for working out how far to zoom. */
export function swirlPixels(): number {
  return Math.min(SWIRL_SIZE.max, Math.max(SWIRL_SIZE.min, (SWIRL_SIZE.vw / 100) * window.innerWidth))
}
