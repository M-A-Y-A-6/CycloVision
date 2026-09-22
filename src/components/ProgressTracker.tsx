import { AnimatePresence, motion } from 'framer-motion'
import { Check } from 'lucide-react'
import { useEffect, useState } from 'react'
import { STORY_STEPS, type StoryStage } from '../config/stages'
import { cn } from '../lib/cn'
import { useStory } from '../store/story'

type Step = (typeof STORY_STEPS)[number]
type BubbleState = 'current' | 'done' | 'upcoming'

interface StepButtonProps {
  step: Step
  index: number
  bubbleState: BubbleState
  interactive: boolean
  onClick?: () => void
}

/** The numbered circle: a real button for Detect/Identify/Classify/Predict RI, a plain marker for Result. */
function StepCircle({ step, index, bubbleState, interactive, onClick }: StepButtonProps) {
  const className = cn(
    'num grid size-9 shrink-0 place-items-center rounded-full border text-sm font-semibold transition-colors duration-500',
    bubbleState === 'done' && 'border-green/60 bg-green/15 text-green',
    bubbleState === 'current' && 'step-glow border-primary bg-primary/15 text-accent',
    bubbleState === 'upcoming' && 'border-line bg-panel text-muted',
    interactive && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
  )
  const content =
    bubbleState === 'done' ? (
      <motion.span
        initial={{ scale: 0.4, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 420, damping: 20 }}
      >
        <Check className="size-[18px]" strokeWidth={3} aria-label="completed" />
      </motion.span>
    ) : (
      index + 1
    )

  if (!interactive) return <span className={className}>{content}</span>
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${step.label}${bubbleState === 'upcoming' ? ' — not processed yet' : ''}`}
      className={className}
    >
      {content}
    </button>
  )
}

/**
 * Five-step tracker: finished steps are ticked, the current step glows. Detect, Identify, Classify and
 * Predict RI are buttons: click an already-finished one to jump back and see it exactly as it finished, with
 * no replay of its reveal; click one that has not been reached yet and a small "Not processed yet" tooltip
 * appears instead of navigating. Result stays a plain, non-interactive marker, reachable only via Predict
 * RI's Continue button, as before. After Result (viewing Explain) every step still shows ticked.
 */
export function ProgressTracker({ stage }: { stage: StoryStage }) {
  const doneStages = useStory((s) => s.doneStages)
  const resultSeen = useStory((s) => s.resultSeen)
  const view = useStory((s) => s.view)
  const [blocked, setBlocked] = useState<StoryStage | null>(null)

  // The "not processed yet" tooltip clears itself after a moment.
  useEffect(() => {
    if (!blocked) return
    const timer = setTimeout(() => setBlocked(null), 1800)
    return () => clearTimeout(timer)
  }, [blocked])

  return (
    <nav aria-label="Story progress">
      <ol className="flex items-center">
        {STORY_STEPS.map((step, i) => {
          const isResult = step.stage === 'result'
          const isCurrent = step.stage === stage
          // Result has no doneStages entry of its own (it is left exactly as it was, per the brief); reuse
          // resultSeen, which already means precisely "the visitor has moved on from Result at least once".
          const isDone = isResult ? resultSeen : !!doneStages[step.stage]
          const bubbleState: BubbleState = isCurrent ? 'current' : isDone ? 'done' : 'upcoming'
          const isLast = i === STORY_STEPS.length - 1

          const handleClick = () => {
            if (isResult || isCurrent) return
            if (isDone) {
              view(step.stage)
              return
            }
            setBlocked(step.stage)
          }

          return (
            <li key={step.stage} className={cn('flex items-center', !isLast && 'flex-1')} aria-current={isCurrent ? 'step' : undefined}>
              <div className="relative flex items-center gap-2.5">
                <StepCircle step={step} index={i} bubbleState={bubbleState} interactive={!isResult} onClick={handleClick} />
                <span
                  className={cn(
                    'text-sm font-medium whitespace-nowrap transition-colors duration-500',
                    bubbleState === 'current' ? 'text-ink' : bubbleState === 'done' ? 'text-ink/80' : 'text-muted',
                    bubbleState !== 'current' && 'hidden sm:inline',
                  )}
                >
                  {step.label}
                </span>

                <AnimatePresence>
                  {blocked === step.stage && (
                    <motion.span
                      role="status"
                      initial={{ opacity: 0, y: 4, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="absolute top-full left-0 z-20 mt-2 rounded-md border border-line bg-base px-2.5 py-1 text-xs font-medium whitespace-nowrap text-muted shadow-lg"
                    >
                      Not processed yet
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>

              {!isLast && (
                <span className="relative mx-3 h-0.5 flex-1 overflow-hidden rounded-full bg-line sm:mx-4">
                  <motion.span
                    className="absolute inset-0 origin-left bg-green/70"
                    initial={false}
                    animate={{ scaleX: isDone ? 1 : 0 }}
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
