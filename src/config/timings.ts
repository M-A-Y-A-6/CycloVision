/**
 * Pacing of the story. Tune the numbers here; nothing else needs to change.
 * All values are in seconds.
 */

/**
 * How many seconds each stage's own animation is scaled to: the fractions in its BEATS object (below) are
 * multiplied by this to get real seconds. The story never auto-advances — every stage plays this animation
 * through, then shows a "Continue" button (see components/ContinueButton.tsx), and only a click moves it on.
 * Result and Explain have no duration of their own: they wait for a click from the moment they appear.
 */
export const STAGE_SECONDS = {
  detect: 8,
  identify: 7,
  classify: 7,
  predict: 9,
} as const

/**
 * Order of events inside the Detect stage, as fractions of STAGE_SECONDS.detect (so changing that duration
 * rescales the whole sequence). With the default 8 s: rows appear at 0.5, 1.5, 2.5 and 3.5 s, each ticks
 * 0.9 s later, "Cyclone-like system detected" shows 0.6 s after the last tick (5.0 s), and the Continue
 * button fades in shortly after that.
 */
export const DETECT_BEATS = {
  /** First source row appears. */
  firstRow: 0.0625,
  /** Gap between one row appearing and the next. */
  rowGap: 0.125,
  /** How long a row spins before it turns into a tick. */
  spin: 0.1125,
  /** Pause between the last tick and the detection marker and message. */
  detectionLag: 0.075,
} as const

/**
 * Order of events inside the Identify stage, as fractions of STAGE_SECONDS.identify. With the default 7 s:
 * the map zooms into the storm 0.35 to 2.1 s, cross-fading into the satellite image from 1.3 s; a scan line
 * sweeps the image (2.1 to 2.9 s); a grid appears and tightens toward the centre (2.4 to 3.85 s); the crosshair
 * searches and locks on (2.9 to 4.05 s) while the coordinates settle; the uncertainty circle appears (4.2 s);
 * movement (4.5 s) and confidence (5.0 s) settle in; "Cyclone center identified" shows at 5.7 s, then the
 * Continue button fades in.
 */
export const IDENTIFY_BEATS = {
  zoom: 0.05,
  crossfade: 0.19,
  zoomEnd: 0.3,
  scan: 0.3,
  scanEnd: 0.42,
  grid: 0.34,
  tighten: 0.4,
  tightenEnd: 0.55,
  crosshair: 0.42,
  lock: 0.58,
  uncertainty: 0.6,
  movement: 0.64,
  confidence: 0.72,
  identified: 0.82,
} as const

/**
 * Order of events inside the Classify stage, as fractions of STAGE_SECONDS.classify. With the default 7 s:
 * the three curved-band arcs draw one after another (0.35 to 1.4 s) and get their label; the CDO outline draws
 * (1.75 to 2.6 s) and gets its label; the centre marker appears (2.8 s) with its label; the result panel shows
 * (3.3 s) and its five bars fill one by one, 0.35 s apart (3.4 to 5.4 s); the top match and T-number show
 * (5.25 s); "Structure classified" (5.65 s) and "Dvorak-aligned assessment available" (6.1 s), then the
 * Continue button fades in.
 */
export const CLASSIFY_BEATS = {
  bands: 0.05,
  bandsLabel: 0.2,
  cdo: 0.25,
  cdoLabel: 0.37,
  center: 0.4,
  centerLabel: 0.45,
  results: 0.47,
  bar1: 0.49,
  bar2: 0.54,
  bar3: 0.59,
  bar4: 0.64,
  bar5: 0.69,
  topMatch: 0.75,
  structure: 0.81,
  assessment: 0.87,
} as const

/**
 * Order of events inside the Predict stage (the big reveal), as fractions of STAGE_SECONDS.predict. With the
 * default 9 s: the satellite image shrinks to a corner thumbnail (0.2 s) and the chart frame fades in (0.6 s);
 * the 30 ensemble paths draw one after another (1.1 to 3.2 s), then the median (3.2 s), the 10-90% band fades
 * in (4.0 s) and the dashed +30 kt line draws (4.7 s); the paths that cross it turn warm (5.4 s). The results
 * appear (5.6 s), then the "Probability spread" (6.1 s) and "Uncertainty band" (6.3 s) callouts and the risk
 * badge (6.6 s), and the four completion lines tick one by one (6.8, 7.3, 7.7, 8.2 s), then the Continue
 * button fades in.
 */
export const PREDICT_BEATS = {
  shrink: 0.02,
  axes: 0.07,
  paths: 0.12,
  median: 0.36,
  band: 0.44,
  riLine: 0.52,
  warm: 0.6,
  results: 0.62,
  spread: 0.68,
  bandLabel: 0.7,
  badge: 0.73,
  line1: 0.76,
  line2: 0.81,
  line3: 0.86,
  line4: 0.91,
} as const

/**
 * Order of events on the Result screen. Unlike the other stages it has no duration (it waits for a click),
 * so these are plain SECONDS after the screen appears, not fractions. The summary rows come in one after
 * another 0.5 s apart; the storm image fades in early and its mini RI gauge fills when the RI row lands; the
 * four evidence chips tick; and the "Explore AI Explanation" button becomes available last.
 */
export const RESULT_BEATS = {
  card: 0.15,
  image: 0.4,
  row1: 0.5,
  row2: 1.0,
  row3: 1.5,
  gauge: 1.5,
  row4: 2.0,
  /** The ELEVATED badge pops once the probability has finished counting up. */
  badge: 2.55,
  row5: 2.5,
  chip1: 2.85,
  chip2: 3.05,
  chip3: 3.25,
  chip4: 3.45,
  button: 3.9,
} as const

/**
 * Order of events on the Explain screen. Like Result it has no duration (it stays until the visitor goes back),
 * so these are plain SECONDS after the screen appears. The heatmap fades in over the image and its four labels
 * follow one by one; the summary sentence types itself out; the six driver bars appear ranked, one after another;
 * then the data-source strip and the "Back to result" button.
 */
export const EXPLAIN_BEATS = {
  switcher: 0.1,
  sentence: 0.4,
  heatmap: 0.6,
  card: 1.5,
  label1: 1.7,
  driver1: 1.8,
  label2: 2.0,
  driver2: 2.05,
  label3: 2.3,
  driver3: 2.3,
  label4: 2.6,
  driver4: 2.55,
  driver5: 2.8,
  driver6: 3.05,
  sources: 3.4,
  button: 3.8,
} as const

/** Transitions between screens. */
export const TRANSITION_SECONDS = {
  /** Landing screen -> story: the map fades and zooms slightly (the one cinematic transition). */
  landingExit: 1.1,
  /** Text and button on the landing screen fade out faster than the map. */
  landingItemExit: 0.45,
  /** The fade every story screen change uses: first stage in, stage to stage, and story out on Replay. */
  stageFade: 0.4,
} as const

/**
 * THE stage transition. Every change of story screen uses this same fade-and-slide (in from slightly below, out
 * slightly upward, 0.4 s, same easing): Detect appearing, every stage to stage swap, Result to Explain and back,
 * and the story leaving on Replay. Change it here and the whole story changes together.
 */
export const STAGE_MOTION = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: {
    duration: TRANSITION_SECONDS.stageFade,
    ease: [0.4, 0, 0.2, 1] as [number, number, number, number],
  },
}
