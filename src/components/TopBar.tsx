import { AnimatePresence, motion } from 'framer-motion'
import { FlaskConical, RotateCcw } from 'lucide-react'
import { SYNTHETIC_CHIP_LABEL } from '../config/app'
import { STAGE_MOTION } from '../config/timings'
import { useStory } from '../store/story'
import { Badge } from './Badge'
import { CycloneIcon } from './CycloneIcon'

/**
 * Always-visible top bar: logo + name on the left; on the right, a small Replay button (only on the Result and
 * Explain screens) and the "Synthetic demo data" chip.
 */
export function TopBar() {
  const stage = useStory((s) => s.stage)
  const reset = useStory((s) => s.reset)
  const canReplay = stage === 'result' || stage === 'explain'

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-line bg-base/85 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-accent">
          <CycloneIcon className="size-5" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          Cyclo<span className="text-accent">Vision</span>
        </span>
      </div>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {canReplay && (
            <motion.button
              key="replay"
              type="button"
              onClick={reset}
              aria-label="Replay the demo from the start"
              // The story moves on to Result while Predict is still fading out, so wait one fade before
              // appearing: the button then arrives together with the Result screen. It leaves quickly.
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { ...STAGE_MOTION.transition, delay: STAGE_MOTION.transition.duration } }}
              exit={{ opacity: 0, transition: { duration: 0.2 } }}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1 text-xs leading-none font-medium text-muted transition-colors hover:border-accent/50 hover:text-accent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              {/* The counter-clockwise arrow, like every rotation in the app. */}
              <RotateCcw className="size-3.5" aria-hidden="true" />
              Replay
            </motion.button>
          )}
        </AnimatePresence>

        <Badge tone="amber">
          <FlaskConical className="size-3.5" aria-hidden="true" />
          {SYNTHETIC_CHIP_LABEL}
        </Badge>
      </div>
    </header>
  )
}
