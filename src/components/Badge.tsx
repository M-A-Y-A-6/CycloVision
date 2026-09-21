import type { ComponentProps } from 'react'
import { cn } from '../lib/cn'

export type BadgeTone = 'neutral' | 'blue' | 'cyan' | 'amber' | 'red' | 'green'
export type BadgeSize = 'sm' | 'lg'

// Full class strings so Tailwind can detect them.
const TONES: Record<BadgeTone, string> = {
  neutral: 'border-line bg-white/5 text-muted',
  blue: 'border-primary/40 bg-primary/10 text-primary',
  cyan: 'border-accent/40 bg-accent/10 text-accent',
  amber: 'border-amber/40 bg-amber/10 text-amber',
  red: 'border-red/40 bg-red/10 text-red',
  green: 'border-green/40 bg-green/10 text-green',
}

const SIZES: Record<BadgeSize, string> = {
  sm: 'px-2.5 py-1 text-xs font-medium',
  lg: 'px-4 py-2 text-sm font-semibold tracking-[0.16em] uppercase',
}

type BadgeProps = ComponentProps<'span'> & { tone?: BadgeTone; size?: BadgeSize }

/** Compact pill for labels, statuses and chips. */
export function Badge({ tone = 'neutral', size = 'sm', className, children, ...rest }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full border leading-none whitespace-nowrap',
        SIZES[size],
        TONES[tone],
        className,
      )}
      {...rest}
    >
      {children}
    </span>
  )
}
