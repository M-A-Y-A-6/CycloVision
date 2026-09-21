import { animate, motion, useMotionValue, useTransform } from 'framer-motion'
import { useEffect } from 'react'

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

/** A number that counts from `from` to `to`, easing out so it settles gently. */
export function CountUp({ to, from = 0, decimals = 0, run, seconds, className }: CountUpProps) {
  const value = useMotionValue(from)
  const text = useTransform(value, (v) => v.toFixed(decimals))

  useEffect(() => {
    if (!run) return
    const controls = animate(value, to, { duration: seconds, ease: 'easeOut' })
    return () => controls.stop()
  }, [run, to, seconds, value])

  return <motion.span className={className}>{text}</motion.span>
}
