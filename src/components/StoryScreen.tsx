import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { StoryStage } from '../config/stages'
import { STAGE_MOTION } from '../config/timings'
import { STAGE_COMPONENTS } from '../stages'
import { useStory } from '../store/story'
import { ProgressTracker } from './ProgressTracker'

/**
 * The story after the button is clicked: progress tracker on top, and below it the current stage.
 * The controller lives here: each stage gets an onDone callback, and calling it moves to the next stage.
 * Every screen change uses the one shared transition, STAGE_MOTION (config/timings.ts).
 */
export function StoryScreen() {
  const stage = useStory((s) => s.stage)
  const advance = useStory((s) => s.advance)

  // On Replay the store goes back to `idle` while this screen is still fading out, so keep showing the last
  // real stage until it has gone.
  const [shown, setShown] = useState<StoryStage>(stage === 'idle' ? 'detect' : stage)
  if (stage !== 'idle' && stage !== shown) setShown(stage)

  const Stage = STAGE_COMPONENTS[shown]

  return (
    <motion.div
      className="short:gap-3 short:p-3 mx-auto flex w-full max-w-[1500px] flex-1 flex-col gap-5 p-4 sm:p-6"
      // The whole screen only fades in (the stage below adds the slide), and slides out like any stage does.
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={STAGE_MOTION.exit}
      transition={STAGE_MOTION.transition}
    >
      <ProgressTracker stage={shown} />
      <AnimatePresence mode="wait">
        <motion.div
          key={shown}
          className="flex flex-1 flex-col"
          initial={STAGE_MOTION.initial}
          animate={STAGE_MOTION.animate}
          exit={STAGE_MOTION.exit}
          transition={STAGE_MOTION.transition}
        >
          <Stage onDone={() => advance(shown)} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  )
}
