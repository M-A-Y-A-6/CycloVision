import { create } from 'zustand'

/** Every screen of the story, in order. `idle` is the initial screen with the Simulate Cyclone button. */
export const STAGES = ['idle', 'detect', 'identify', 'classify', 'predict', 'result', 'explain'] as const
export type Stage = (typeof STAGES)[number]

interface StoryState {
  stage: Stage
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
  /** The Replay button: back to the initial screen with a clean slate, for retakes. */
  reset: () => void
}

export const useStory = create<StoryState>()((set, get) => ({
  stage: 'idle',
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
  reset: () => set({ stage: 'idle', resultSeen: false }),
}))
