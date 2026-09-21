import { motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { STORY_STEPS, type StoryStage } from '../config/stages'
import { cn } from '../lib/cn'

/** Five-step tracker: finished steps are ticked, the current step glows. After Result (explain) all are ticked. */
export function ProgressTracker({ stage }: { stage: StoryStage }) {
  const found = STORY_STEPS.findIndex((s) => s.stage === stage)
  const currentIndex = found === -1 ? STORY_STEPS.length : found

  return (
    <nav aria-label="Story progress">
      <ol className="flex items-center">
        {STORY_STEPS.map((step, i) => {
          const state = i < currentIndex ? 'done' : i === currentIndex ? 'current' : 'upcoming'
          const isLast = i === STORY_STEPS.length - 1
          return (
            <li key={step.stage} className={cn('flex items-center', !isLast && 'flex-1')} aria-current={state === 'current' ? 'step' : undefined}>
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'num grid size-9 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors duration-500',
                    state === 'done' && 'border-green/60 bg-green/15 text-green',
                    state === 'current' && 'step-glow border-primary bg-primary/15 text-accent',
                    state === 'upcoming' && 'border-line bg-panel text-muted',
                  )}
                >
                  {state === 'done' ? (
                    <motion.span
                      initial={{ scale: 0.4, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                    >
                      <Check className="size-[18px]" strokeWidth={3} aria-label="completed" />
                    </motion.span>
                  ) : (
                    i + 1
                  )}
                </span>
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap transition-colors duration-500',
                    state === 'current' ? 'text-ink' : state === 'done' ? 'text-ink/80' : 'text-muted',
                    state !== 'current' && 'hidden sm:inline',
                  )}
                >
                  {step.label}
                </span>
              </div>

              {!isLast && (
                <span className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mx-4">
                  <motion.span
                    className="absolute inset-0 origin-left bg-green/70"
                    initial={false}
                    animate={{ scaleX: state === 'done' ? 1 : 0 }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
