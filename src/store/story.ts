import { create } from 'zustand'
import { assertValidStormCase, generateStormCase, type StormCase } from '../data/cases'

/**
 * Every screen of the story, in order. `idle` is Dashboard (before Simulate Cyclone is clicked). `result` is
 * the LAST story stage — its tracker label and content are a compact "Explain Result" panel
 * (`stages/Result.tsx`), whose own exit is not a normal advance: its "[ View Full Results ]" button
 * navigates to the separate "/results" route instead (see `resultsPanelReached` below). There is no stage
 * after `result`.
 */
export const STAGES = ['idle', 'detect', 'identify', 'classify', 'predict', 'result'] as const
export type Stage = (typeof STAGES)[number]

interface StoryState {
  stage: Stage
  /** The randomly generated storm the story is currently running — null until Simulate Cyclone is clicked.
   *  Analysis redirects back to Dashboard if it is ever null when the story would need it. */
  currentCase: StormCase | null
  /**
   * Stages whose own animation has finished at least once, whether or not Continue has since been clicked.
   * The progress tracker uses this: clicking an already-done step jumps back to it and shows it exactly as it
   * looked when it finished, instead of replaying it. Never cleared except by reset()/beginSimulation().
   */
  doneStages: Partial<Record<Stage, true>>
  /**
   * True once the visitor has clicked "[ View Full Results ]" on the last story stage. `/results` redirects
   * back to `/analysis` if this is false, so it is never reached except by that deliberate click.
   */
  resultsPanelReached: boolean
  /** Marks the results panel reached: called by the "[ View Full Results ]" button before it navigates. */
  reachResultsPanel: () => void
  /**
   * Dashboard's one "Simulate Cyclone" button: generates a fresh random storm from a new seed and jumps
   * straight into the story. Always sets every piece of state at once (stage, currentCase, doneStages,
   * resultsPanelReached) instead of relying on a prior `stage === 'idle'`, so it is safe to call no matter
   * what state a previous run left behind — this is the lesson from a real bug (see CLAUDE.md's History):
   * Dashboard used to only commit a new pick without resetting first, so reaching it mid- or post-story via
   * the persistent nav link could leave a previous run's doneStages/resultsPanelReached stale.
   */
  beginSimulation: () => void
  /**
   * A stage calls this when it has finished. It moves to the next stage, but only if `from` is still
   * the current stage, so a late or duplicate call can never skip a stage. There is no `advance('result')`
   * call anywhere — `result` is the last stage, and its own exit is `reachResultsPanel` plus a route
   * navigation, not this.
   */
  advance: (from: Stage) => void
  /** A stage calls this once its own animation reaches its end, whether or not Continue has been clicked yet. */
  markDone: (stage: Stage) => void
  /**
   * The progress tracker: jump to a stage that has already finished, to view its result again without
   * replaying it. Ignored for the stage already being viewed and for any stage that has not finished yet —
   * ProgressTracker itself is responsible for not calling this in those cases.
   */
  view: (stage: Stage) => void
  /** The Replay/New Simulation button: back to Dashboard with a clean slate. */
  reset: () => void
}

export const useStory = create<StoryState>()((set, get) => ({
  stage: 'idle',
  currentCase: null,
  doneStages: {},
  resultsPanelReached: false,
  reachResultsPanel: () => set({ resultsPanelReached: true }),
  beginSimulation: () => {
    // A fresh, unpredictable seed per click (not seeded off anything reproducible) — each simulation is a
    // one-off random storm, but generateStormCase itself stays deterministic for that seed.
    const seed = Math.floor(Math.random() * 0xffffffff)
    const stormCase = generateStormCase(seed)
    assertValidStormCase(stormCase)
    set({ stage: 'detect', currentCase: stormCase, doneStages: {}, resultsPanelReached: false })
  },
  advance: (from) =>
    set((state) => {
      if (state.stage !== from) return state
      const next = STAGES[STAGES.indexOf(from) + 1]
      if (!next) return state
      return { stage: next }
    }),
  markDone: (stage) => {
    if (get().doneStages[stage]) return
    set((state) => ({ doneStages: { ...state.doneStages, [stage]: true } }))
  },
  view: (stage) => {
    const state = get()
    if (stage === state.stage || !state.doneStages[stage]) return
    set({ stage })
  },
  reset: () => set({ stage: 'idle', currentCase: null, doneStages: {}, resultsPanelReached: false }),
}))
