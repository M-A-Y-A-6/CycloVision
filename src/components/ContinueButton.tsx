import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

interface ContinueButtonProps {
  /** Turns true once the stage's own animation has finished. */
  show: boolean
  /** e.g. "Continue to Identification". */
  label: string
  onClick: () => void
}

/**
 * The button that moves the story to the next stage. Detect, Identify, Classify and Predict each play their
 * animation through to the end and then show this instead of advancing on a timer: the story only moves on
 * when the visitor clicks it. It fades in a beat after `show` turns true, so it reads as a pause rather than
 * a jump cut, and matches the look of the Result and Explain screens' own buttons.
 */
export function ContinueButton({ show, label, onClick }: ContinueButtonProps) {
  return (
    <motion.div
      initial={false}
      animate={{ opacity: show ? 1 : 0, y: show ? 0 : 8 }}
      transition={{ duration: 0.5, ease, delay: show ? 0.4 : 0 }}
    >
      <button
        type="button"
        onClick={onClick}
        disabled={!show}
        tabIndex={show ? 0 : -1}
        className="btn-glow short:py-3 flex w-full items-center justify-center gap-3 rounded-xl px-8 py-4 text-lg font-semibold tracking-wide"
      >
        {label}
        <ArrowRight className="size-5" aria-hidden="true" />
      </button>
    </motion.div>
  )
}
