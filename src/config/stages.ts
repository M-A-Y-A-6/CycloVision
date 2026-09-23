import type { Stage } from '../store/story'

/** A stage that belongs to the story (everything except Dashboard). */
export type StoryStage = Exclude<Stage, 'idle'>

/**
 * The five pipeline nodes shown in the progress tracker (Phase 14): Simulate Cyclone, Identify, Classify,
 * Predict RI, Explain Result. `result` is still the internal stage id (unchanged, so the manual-Continue and
 * clickable-tracker mechanics need no rework) — only its tracker label and its content changed.
 */
export const STORY_STEPS: ReadonlyArray<{ stage: StoryStage; label: string }> = [
  { stage: 'detect', label: 'Simulate Cyclone' },
  { stage: 'identify', label: 'Identify' },
  { stage: 'classify', label: 'Classify' },
  { stage: 'predict', label: 'Predict RI' },
  { stage: 'result', label: 'Explain Result' },
]

/** Big stage title plus the one plain-language sentence shown on every stage. */
export const STAGE_COPY: Record<StoryStage, { title: string; sentence: string }> = {
  detect: {
    title: 'SIMULATING CYCLONE',
    sentence: 'CycloVision ingests raw observations from five sources and prepares them for the model, the same way a real pipeline would.',
  },
  identify: {
    title: 'IDENTIFYING CYCLONE',
    sentence: 'The AI searches the image for the storm, drawing a box around it and locking onto its exact centre.',
  },
  classify: {
    title: 'CLASSIFYING STORM STRUCTURE',
    sentence: "The AI fuses what the clouds look like with the surrounding physical conditions to judge the storm's structure.",
  },
  predict: {
    title: 'PREDICTING RAPID INTENSIFICATION',
    sentence:
      'Instead of guessing one number, the AI runs many possible futures and counts how many turn into rapid intensification.',
  },
  result: {
    // The one question this screen answers. Its sentence is written from the case's own data, so the text
    // below is only a fallback (see lib/useCase.ts and stages/Result.tsx).
    title: 'Why is the RI risk elevated?',
    sentence: 'Here is a quick look at why the AI reached this assessment, and how sure it is.',
  },
}
