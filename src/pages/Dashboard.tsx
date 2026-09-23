import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { CycloneIcon } from '../components/CycloneIcon'
import { MonitoringMap } from '../components/MonitoringMap'
import { STAGE_MOTION } from '../config/timings'
import { useStory } from '../store/story'

/**
 * Dashboard ("/"): brand and tagline, the monitoring-area visual, and a single always-available "Simulate
 * Cyclone" button. There is nothing to pick any more — every click generates a brand new random storm
 * (`beginSimulation`, store/story.ts), which also resets any state left over from a previous run before
 * starting, so a run is always clean no matter how Dashboard was reached (nav link, Replay, New Simulation).
 */
export function Dashboard() {
  const beginSimulation = useStory((s) => s.beginSimulation)
  const navigate = useNavigate()

  const handleSimulate = () => {
    beginSimulation()
    navigate('/analysis')
  }

  return (
    <motion.main
      className="short:gap-4 short:py-5 mx-auto flex w-full max-w-[820px] flex-1 flex-col items-center justify-center gap-7 px-4 py-8 sm:px-6"
      initial={STAGE_MOTION.initial}
      animate={STAGE_MOTION.animate}
      exit={STAGE_MOTION.exit}
      transition={STAGE_MOTION.transition}
    >
      <header className="flex flex-col items-center gap-2.5 text-center">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-accent">
            <CycloneIcon className="size-9" />
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Cyclo<span className="text-accent">Vision</span>
          </h1>
        </div>
        <p className="text-[1rem] text-muted sm:text-lg">AI-powered tropical cyclone early-warning system</p>
      </header>

      <div className="short:h-[280px] relative h-[340px] w-full overflow-hidden rounded-xl border border-line">
        <MonitoringMap className="size-full" />
      </div>

      <button type="button" onClick={handleSimulate} className="btn-glow rounded-xl px-10 py-4 text-lg font-semibold tracking-wide">
        Simulate Cyclone
      </button>
    </motion.main>
  )
}
