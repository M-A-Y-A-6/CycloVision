/**
 * What every stage component receives. A stage plays its own animation and calls `onDone()` when it has
 * finished; the story controller then moves to the next stage. Result and Explain wait for the user instead.
 */
export interface StageProps {
  onDone: () => void
}
