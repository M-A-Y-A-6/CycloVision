import type { ComponentType } from 'react'
import type { StoryStage } from '../config/stages'
import { Classify } from './Classify'
import { Detect } from './Detect'
import { Explain } from './Explain'
import { Identify } from './Identify'
import { Predict } from './Predict'
import { Result } from './Result'
import type { StageProps } from './types'

/** Which component plays each stage of the story. */
export const STAGE_COMPONENTS: Record<StoryStage, ComponentType<StageProps>> = {
  detect: Detect,
  identify: Identify,
  classify: Classify,
  predict: Predict,
  result: Result,
  explain: Explain,
}
