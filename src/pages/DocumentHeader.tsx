import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

interface DocumentHeaderProps {
  icon: LucideIcon
  title: string
  subtitle: ReactNode
}

/**
 * Header for a document-style page (currently just About): an icon tile, a big title and a one or two
 * sentence subtitle. Deliberately plainer than StageLayout's — these pages read like a document, not an
 * animated story stage.
 */
export function DocumentHeader({ icon: Icon, title, subtitle }: DocumentHeaderProps) {
  return (
    <header className="mb-8 flex items-start gap-4 border-b border-line pb-6">
      <span className="grid size-12 shrink-0 place-items-center rounded-xl border border-primary/30 bg-primary/10 text-accent">
        <Icon className="size-6" aria-hidden="true" />
      </span>
      <div>
        <h1 className="text-3xl font-semibold tracking-tight text-ink">{title}</h1>
        <p className="mt-1.5 max-w-[640px] text-[1rem] leading-relaxed text-muted">{subtitle}</p>
      </div>
    </header>
  )
}
