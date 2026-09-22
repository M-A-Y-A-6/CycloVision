import { create } from 'zustand'

/** Every screen of the story, in order. `idle` is the initial screen with the Simulate Cyclone button. */
export const STAGES = ['idle', 'detect', 'identify', 'classify', 'predict', 'result', 'explain'] as const
export type Stage = (typeof STAGES)[number]

interface StoryState {
  stage: Stage
  /**
   * Stages whose own animation has finished at least once, whether or not Continue has since been clicked.
   * The progress tracker uses this: clicking an already-done step jumps back to it and shows it exactly as it
   * looked when it finished, instead of replaying it. Never cleared except by reset().
   */
  doneStages: Partial<Record<Stage, true>>
  /** True once the visitor has moved on from the Result screen, so coming back to it can replay quickly. */
  resultSeen: boolean
  /** Simulate Cyclone button: idle -> detect. */
  start: () => void
  /**
   * A stage calls this when it has finished. It moves to the next stage, but only if `from` is still
   * the current stage, so a late or duplicate call can never skip a stage.
   * Result -> explain is also an advance, triggered by the user's click.
   */
  advance: (from: Stage) => void
  /** Explain -> result: the "Back to result" button. */
  back: () => void
  /** A stage calls this once its own animation reaches its end, whether or not Continue has been clicked yet. */
  markDone: (stage: Stage) => void
  /**
   * The progress tracker: jump to a stage that has already finished, to view its result again without
   * replaying it. Ignored for the stage already being viewed and for any stage that has not finished yet —
   * ProgressTracker itself is responsible for not calling this in those cases.
   */
  view: (stage: Stage) => void
  /** The Replay button: back to the initial screen with a clean slate, for retakes. */
  reset: () => void
}

export const useStory = create<StoryState>()((set, get) => ({
  stage: 'idle',
  doneStages: {},
  resultSeen: false,
  start: () => get().advance('idle'),
  advance: (from) =>
    set((state) => {
      if (state.stage !== from) return state
      const next = STAGES[STAGES.indexOf(from) + 1]
      if (!next) return state
      return { stage: next, resultSeen: state.resultSeen || from === 'result' }
    }),
  back: () => set((state) => (state.stage === 'explain' ? { stage: 'result' } : state)),
  markDone: (stage) => {
    if (get().doneStages[stage]) return
    set((state) => ({ doneStages: { ...state.doneStages, [stage]: true } }))
  },
  view: (stage) => {
    const state = get()
    if (stage === state.stage || !state.doneStages[stage]) return
    set({ stage })
  },
  reset: () => set({ stage: 'idle', doneStages: {}, resultSeen: false }),
}))
