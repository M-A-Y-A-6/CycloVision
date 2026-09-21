import type { Stage } from '../store/story'

/** A stage that belongs to the story (everything except the initial screen). */
export type StoryStage = Exclude<Stage, 'idle'>

/** The five steps shown in the progress tracker. `explain` comes after them and is not a step. */
export const STORY_STEPS: ReadonlyArray<{ stage: StoryStage; label: string }> = [
  { stage: 'detect', label: 'Detect' },
  { stage: 'identify', label: 'Identify' },
  { stage: 'classify', label: 'Classify' },
  { stage: 'predict', label: 'Predict RI' },
  { stage: 'result', label: 'Result' },
]

/** Big stage title plus the one plain-language sentence shown on every stage. */
export const STAGE_COPY: Record<StoryStage, { title: string; sentence: string }> = {
  detect: {
    title: 'RECEIVING SATELLITE DATA',
    sentence: 'CycloVision starts by collecting observations from four different satellite sources.',
  },
  identify: {
    title: 'IDENTIFYING CYCLONE',
    sentence: 'The AI searches the images to find the exact centre of the storm and how it is moving.',
  },
  classify: {
    title: 'CLASSIFYING STORM STRUCTURE',
    sentence: 'The AI reads the shape of the clouds, the same way forecasters do, using the Dvorak method.',
  },
  predict: {
    title: 'PREDICTING RAPID INTENSIFICATION',
    sentence:
      'Instead of guessing one number, the AI runs many possible futures and counts how many turn into rapid intensification.',
  },
  result: {
    title: 'CYCLONE ASSESSMENT COMPLETE',
    sentence: 'Here is everything CycloVision has concluded about the storm, in one place.',
  },
  explain: {
    // The one question this screen answers. Its sentence is written on the fly from the top drivers
    // (lib/explanationSentence.ts), so the text below is only a fallback.
    title: 'Why is the RI risk elevated?',
    sentence: 'Here is why CycloVision reached this assessment, and how much each satellite source mattered.',
  },
}
