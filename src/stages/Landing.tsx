import { motion, type Variants } from 'framer-motion'
import { useEffect } from 'react'
import { CycloneIcon } from '../components/CycloneIcon'
import { MonitoringMap } from '../components/MonitoringMap'
import { PREWARM } from '../config/imagery'
import { TRANSITION_SECONDS } from '../config/timings'
import { prewarmSatellite } from '../lib/satelliteBitmap'
import { useStory } from '../store/story'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

// The text and button fade up on load and fade out quickly on click...
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 14 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { duration: 0.7, delay: 0.1 + i * 0.12, ease } }),
  exit: { opacity: 0, y: -10, transition: { duration: TRANSITION_SECONDS.landingItemExit, ease } },
}

// ...while the map slowly zooms in and dissolves: the cinematic hand-off into the story.
const mapReveal: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: { duration: 1, delay: 0.3, ease } },
  exit: { opacity: 0, scale: 1.18, transition: { duration: TRANSITION_SECONDS.landingExit, ease } },
}

/** The initial screen (stage: idle): brand, tagline, monitoring-area map and the Simulate Cyclone button. */
export function Landing() {
  const stage = useStory((s) => s.stage)
  const start = useStory((s) => s.start)

  // While the visitor reads this screen, draw the story's satellite images in the background.
  useEffect(() => {
    PREWARM.forEach(({ channel, size }) => prewarmSatellite(channel, size))
  }, [])

  return (
    <motion.main
      className="flex flex-1 flex-col items-center justify-center gap-5 overflow-hidden px-4 py-5 sm:px-6"
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.header variants={fadeUp} custom={0} className="flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-4">
          <span className="grid size-14 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-accent">
            <CycloneIcon className="size-9" />
          </span>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            Cyclo<span className="text-accent">Vision</span>
          </h1>
        </div>
        <p className="text-[1rem] text-muted sm:text-lg">AI-powered tropical cyclone early-warning system</p>
      </motion.header>

      <motion.div variants={mapReveal} className="w-full max-w-[1120px]">
        <MonitoringMap className="h-[clamp(240px,42vh,470px)] w-full rounded-xl border border-line" />
      </motion.div>

      <motion.div variants={fadeUp} custom={3}>
        <button
          type="button"
          onClick={start}
          disabled={stage !== 'idle'}
          className="btn-glow rounded-xl px-10 py-4 text-lg font-semibold tracking-wide"
        >
          Simulate Cyclone
        </button>
      </motion.div>
    </motion.main>
  )
}
