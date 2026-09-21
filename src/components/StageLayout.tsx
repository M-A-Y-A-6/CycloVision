import type { ReactNode } from 'react'
import { STAGE_COPY, STORY_STEPS, type StoryStage } from '../config/stages'

interface StageLayoutProps {
  stage: StoryStage
  /** Fills the large main visual area. */
  visual: ReactNode
  /** Completion lines (status rows, "Cyclone-like system detected", buttons...) shown under the sentence. */
  children?: ReactNode
  /** Replaces the sentence from config/stages.ts (for a sentence written on the fly). */
  sentence?: ReactNode
  /** Tailwind grid-columns class for wide screens. Defaults to a large visual and a narrower status column. */
  columns?: string
  /** Less space between the sentence and the content, for screens with a lot to show. */
  tight?: boolean
}

/**
 * The layout every stage uses, under the progress tracker: a large main visual on one side and, on the
 * other, the status text: big stage title, one plain-language sentence, and room for completion lines.
 */
export function StageLayout({
  stage,
  visual,
  children,
  sentence,
  columns = 'lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]',
  tight = false,
}: StageLayoutProps) {
  const copy = STAGE_COPY[stage]
  const step = STORY_STEPS.findIndex((s) => s.stage === stage)

  return (
    <div className={`short:gap-3 grid flex-1 gap-5 ${columns}`}>
      <div className="relative flex min-h-[300px] overflow-hidden rounded-xl border border-line bg-panel">{visual}</div>

      <section className="flex flex-col justify-center">
        <p className="num text-xs font-medium tracking-[0.22em] text-accent uppercase">
          {step === -1 ? 'Explanation' : `Stage ${step + 1} of ${STORY_STEPS.length}`}
        </p>
        <h1 className="short:mt-2 short:text-2xl mt-3 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="short:mt-2 short:text-[1rem] mt-4 text-lg leading-relaxed text-muted">{sentence ?? copy.sentence}</p>
        <div className={`short:mt-3 short:space-y-2 space-y-3 ${tight ? 'mt-4' : 'mt-8'}`} aria-live="polite">
          {children}
        </div>
      </section>
    </div>
  )
}
