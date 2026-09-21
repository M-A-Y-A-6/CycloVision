import { AnimatePresence, motion } from 'framer-motion'
import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'

export type StatusRowState = 'idle' | 'active' | 'done'

type StatusRowProps = Omit<ComponentProps<'div'>, 'children'> & {
  label: string
  /** idle = waiting, active = spinner, done = green tick. */
  status: StatusRowState
}

/** A label with a status marker: dim ring while waiting, spinner while working, tick when done. */
export function StatusRow({ label, status, className, ...rest }: StatusRowProps) {
  return (
    <div
      className={cn('flex items-center gap-3 text-[1rem]', className)}
      role="status"
      aria-label={`${label}: ${status === 'done' ? 'complete' : status === 'active' ? 'in progress' : 'waiting'}`}
      {...rest}
    >
      <span className="relative grid size-5 shrink-0 place-items-center">
        <AnimatePresence mode="wait" initial={false}>
          {status === 'idle' && (
            <motion.span
              key="idle"
              className="size-3.5 rounded-full border border-muted/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
          )}
          {status === 'active' && (
            <motion.span
              key="active"
              className="size-4 animate-spin-ccw rounded-full border-2 border-accent/25 border-t-accent"
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.6 }}
              transition={{ duration: 0.15 }}
            />
          )}
          {status === 'done' && (
            <motion.svg
              key="done"
              viewBox="0 0 20 20"
              className="size-5"
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22 }}
            >
              <circle cx="10" cy="10" r="9" fill="var(--color-green)" fillOpacity="0.15" stroke="var(--color-green)" strokeWidth="1.4" />
              <motion.path
                d="M6 10.4 8.9 13.2 14 7.4"
                fill="none"
                stroke="var(--color-green)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.3, delay: 0.08, ease: 'easeOut' }}
              />
            </motion.svg>
          )}
        </AnimatePresence>
      </span>
      <span className={cn('transition-colors duration-300', status === 'idle' ? 'text-muted' : 'text-ink')}>
        {label}
      </span>
    </div>
  )
}
