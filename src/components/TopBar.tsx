import { AnimatePresence, motion } from 'framer-motion'
import { RotateCcw } from 'lucide-react'
import { NavLink, useNavigate } from 'react-router-dom'
import { STAGE_MOTION } from '../config/timings'
import { cn } from '../lib/cn'
import { useStory } from '../store/story'
import { CycloneIcon } from './CycloneIcon'

const NAV_LINKS: ReadonlyArray<{ to: string; label: string }> = [
  { to: '/', label: 'Dashboard' },
  { to: '/about', label: 'About' },
]

/**
 * Always-visible top bar: logo + name on the left, the persistent nav (Dashboard, About) in the middle; on
 * the right, a small Replay button (once the story has reached its last stage, "Explain Result" — this
 * stays true on "/results" too, since that page never changes the store's `stage`).
 */
export function TopBar() {
  const stage = useStory((s) => s.stage)
  const reset = useStory((s) => s.reset)
  const navigate = useNavigate()
  const canReplay = stage === 'result'

  const handleReplay = () => {
    reset()
    navigate('/')
  }

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between gap-4 border-b border-line bg-base/85 px-4 backdrop-blur sm:px-6">
      <div className="flex items-center gap-2.5">
        <span className="grid size-8 place-items-center rounded-lg border border-primary/30 bg-primary/10 text-accent">
          <CycloneIcon className="size-5" />
        </span>
        <span className="text-[17px] font-semibold tracking-tight text-ink">
          Cyclo<span className="text-accent">Vision</span>
        </span>
      </div>

      <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
        {NAV_LINKS.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.to === '/'}
            className={({ isActive }) =>
              cn(
                'rounded-full px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
                isActive ? 'bg-primary/10 text-accent' : 'text-muted hover:text-ink',
              )
            }
          >
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="flex items-center gap-3">
        <AnimatePresence>
          {canReplay && (
            <motion.button
              key="replay"
              type="button"
              onClick={handleReplay}
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
      </div>
    </header>
  )
}
