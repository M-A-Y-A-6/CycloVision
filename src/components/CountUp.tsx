import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect, useState } from 'react'

interface CountUpProps {
  /** Number to settle on. */
  to: number
  /** Number to start from. */
  from?: number
  decimals?: number
  /** Counting starts when this turns true. */
  run: boolean
  seconds: number
  className?: string
}

/**
 * A number that counts from `from` to `to`, easing out so it settles gently. If `run` is already true the
 * moment this mounts (the progress tracker jumped straight to an already-finished stage), it shows `to`
 * immediately instead of counting up again.
 */
export function CountUp({ to, from = 0, decimals = 0, run, seconds, className }: CountUpProps) {
  // Captured once, at mount: were we already told to "run" before we even appeared?
  const [ranAtMount] = useState(run)
  const value = useMotionValue(ranAtMount ? to : from)
  const text = useTransform(value, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (!run || ranAtMount) return
    const controls = animate(value, to, { duration: seconds, ease: 'easeOut' })
    return () => controls.stop()
  }, [run, to, seconds, value, ranAtMount])

  return <motion.span className={className}>{text}</motion.span>
}
