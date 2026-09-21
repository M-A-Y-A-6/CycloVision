import type { ComponentProps } from 'react'
import { SPIRAL_PATHS } from '../lib/spiral'

/** Small cyclone spiral used as the CycloVision logo mark. Inherits colour via currentColor. */
export function CycloneIcon(props: ComponentProps<'svg'>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <g stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
        {SPIRAL_PATHS.map((d, i) => (
          <path key={i} d={d} opacity={1 - i * 0.22} />
        ))}
      </g>
      <circle cx="12" cy="12" r="1.7" fill="var(--color-primary)" />
    </svg>
  )
}
