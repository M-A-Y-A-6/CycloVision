import type { ComponentProps, ReactNode } from 'react'
import { cn } from '../lib/cn'

type PanelProps = Omit<ComponentProps<'section'>, 'title'> & {
  /** Small uppercase heading shown at the top of the panel. */
  title?: ReactNode
}

/** Dark surface with a thin border: the basic container for every block of the UI. */
export function Panel({ title, className, children, ...rest }: PanelProps) {
  return (
    <section
      className={cn('rounded-xl border border-line bg-panel p-4', className)}
      {...rest}
    >
      {title && (
        <h2 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
