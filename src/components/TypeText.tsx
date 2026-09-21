import { animate, motion, useMotionValue, useMotionValueEvent } from 'framer-motion'
import { useEffect, useState } from 'react'

interface TypeTextProps {
  text: string
  /** Typing starts when this turns true. */
  run: boolean
  /** How long the whole text takes to type. */
  seconds: number
  className?: string
}

/**
 * Text that types itself out, as if the AI were writing it. The not-yet-typed part is kept in the layout
 * (invisible), so the paragraph never changes size or re-wraps while it types.
 */
export function TypeText({ text, run, seconds, className }: TypeTextProps) {
  const count = useMotionValue(0)
  const [typed, setTyped] = useState(0)
  useMotionValueEvent(count, 'change', (v) => setTyped(Math.floor(v)))

  useEffect(() => {
    if (!run) return
    const controls = animate(count, text.length, { duration: seconds, ease: 'linear' })
    return () => controls.stop()
  }, [run, text, seconds, count])

  const typing = run && typed < text.length
  return (
    <span className={className} aria-label={text}>
      <span aria-hidden="true">{text.slice(0, typed)}</span>
      {typing && (
        <motion.span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1em] w-[2px] translate-y-[0.15em] bg-accent"
          animate={{ opacity: [1, 0.2, 1] }}
          transition={{ duration: 0.9, repeat: Infinity }}
        />
      )}
      <span aria-hidden="true" className="invisible">
        {text.slice(typed)}
      </span>
    </span>
  )
}
