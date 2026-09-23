/**
 * Pacing of the story. Tune the numbers here; nothing else needs to change.
 * All values are in seconds.
 */

/**
 * How many seconds each stage's own animation is scaled to: the fractions in its BEATS object (below) are
 * multiplied by this to get real seconds. The story never auto-advances — every stage plays this animation
 * through, then shows a "Continue" button (see components/ContinueButton.tsx), and only a click moves it on.
 * Result (tracker label "Explain Result") has no duration of its own: it waits for a click from the moment
 * it appears.
 */
export const STAGE_SECONDS = {
  detect: 8,
  identify: 7,
  classify: 7,
  predict: 9,
} as const

/**
 * Order of events inside the Detect stage, as fractions of STAGE_SECONDS.detect (so changing that duration
 * rescales the whole sequence). With the default 8 s: the five source icons light up one by one from 0.4 to
 * 3.0 s, then the row gives way to the four-step preprocessing checklist (3.7 s), whose steps tick at 4.5,
 * 5.3, 6.1 and 6.9 s; "Preprocessing complete" shows at 7.4 s, then the Continue button fades in.
 */
export const DETECT_BEATS = {
  icon1: 0.05,
  icon2: 0.13,
  icon3: 0.21,
  icon4: 0.29,
  icon5: 0.37,
  /** The icon row gives way to the checklist; its first step becomes active. */
  checklist: 0.46,
  step1: 0.56,
  step2: 0.66,
  step3: 0.76,
  step4: 0.86,
  complete: 0.93,
} as const

/**
 * Order of events inside the Identify stage, as fractions of STAGE_SECONDS.identify. With the default 7 s:
 * the map zooms into the storm 0.35 to 2.1 s, cross-fading into the satellite image from 1.3 s; the bounding
 * box draws itself around the storm (2.4 to 3.4 s), then the "Cyclone Detected" label settles above it; the
 * crosshair searches and locks onto the centre (3.5 to 4.5 s); movement settles in (4.5 s); "Cyclone center
 * identified" shows at 5.7 s, then the Continue button fades in.
 */
export const IDENTIFY_BEATS = {
  zoom: 0.05,
  crossfade: 0.19,
  zoomEnd: 0.3,
  /** Bounding box starts drawing. */
  box: 0.34,
  /** Bounding box finishes drawing; the detection label appears. */
  boxEnd: 0.48,
  crosshair: 0.5,
  lock: 0.64,
  movement: 0.7,
  identified: 0.82,
} as const

/**
 * Order of events inside the Classify stage, as fractions of STAGE_SECONDS.classify. With the default 7 s:
 * the four relational-fusion nodes (cloud pattern, wind shear, SST, moisture) pulse and connect one after
 * another (0.6 to 2.7 s), the centre "Fused" node lights at 3.35 s; the "Basin Head Active" badge appears
 * (4.05 s), then the intensity category and confidence (4.75 s); "Structure classified" shows at 5.6 s, then
 * the Continue button fades in.
 */
export const CLASSIFY_BEATS = {
  node1: 0.08,
  node2: 0.18,
  node3: 0.28,
  node4: 0.38,
  fused: 0.48,
  basin: 0.58,
  category: 0.68,
  structure: 0.8,
} as const

/**
 * Order of events inside the Predict stage (the big reveal), as fractions of STAGE_SECONDS.predict. With the
 * default 9 s: the satellite image shrinks to a corner thumbnail (0.2 s) and the chart frame fades in (0.6 s);
 * the 30 ensemble paths draw one after another (1.1 to 3.2 s), then the median (3.2 s), the 10-90% band fades
 * in (4.0 s) and the dashed +30 kt line draws (4.7 s); the paths that cross it turn warm (5.4 s); the chart's
 * own "Probability spread" and "Uncertainty band" callouts appear (5.8, 6.0 s). In the status column: the
 * trend sparkline draws (6.3 s), the RI risk gauge fills (6.7 s), the delta-intensity and probability-range
 * callouts appear (7.1, 7.5 s), the risk badge pops (7.8 s), and the three completion lines tick one by one
 * (8.1, 8.4, 8.6 s), then the Continue button fades in.
 */
export const PREDICT_BEATS = {
  shrink: 0.02,
  axes: 0.07,
  paths: 0.12,
  median: 0.36,
  band: 0.44,
  riLine: 0.52,
  warm: 0.6,
  /** The chart's own "Probability spread" bracket and "Uncertainty band" leader (drawn on the chart itself). */
  spread: 0.64,
  bandLabel: 0.67,
  trend: 0.7,
  gauge: 0.74,
  deltaCallout: 0.79,
  rangeCallout: 0.83,
  badge: 0.87,
  line1: 0.9,
  line2: 0.93,
  line3: 0.96,
} as const

/**
 * Order of events on the Result screen (tracker label "Explain Result"; Phase 14). Unlike Detect/Identify/
 * Classify/Predict it has no duration of its own (it waits for a click), so these are plain SECONDS after
 * the screen appears. The attention heatmap fades in over the image (0.3 s); the compact panel appears
 * (0.6 s) with its two SHAP bars (0.9, 1.15 s), then the bell-curve sketch (1.5 s); the plain-language
 * sentence types itself out from 1.9 s (1.6 s long); "Explanation generated" shows once it finishes (3.7 s),
 * then the "View Full Results" button becomes available (4.0 s).
 */
export const RESULT_BEATS = {
  heatmap: 0.3,
  card: 0.6,
  bar1: 0.9,
  bar2: 1.15,
  curve: 1.5,
  sentence: 1.9,
  explanation: 3.7,
  button: 4.0,
} as const

/** Transitions between screens. */
export const TRANSITION_SECONDS = {
  /** The fade every screen change uses: first stage in, stage to stage, route to route, and story out on Replay. */
  stageFade: 0.4,
} as const

/**
 * THE stage transition. Every change of story screen uses this same fade-and-slide (in from slightly below, out
 * slightly upward, 0.4 s, same easing): Detect appearing, every stage-to-stage swap, and the story leaving on
 * Replay. Change it here and the whole story changes together.
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
