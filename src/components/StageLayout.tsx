import type { ReactNode } from 'react'
import { BASIN_TONE } from '../config/basin'
import { STAGE_COPY, STORY_STEPS, type StoryStage } from '../config/stages'
import { useCase } from '../lib/useCase'
import { Badge } from './Badge'

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
  /**
   * Which model-pipeline component(s) this screen represents (e.g. "YOLO-NAS — cyclone detection & center
   * localization"), each shown as its own small chip — Classify shows two. See the Architecture section of
   * CLAUDE.md.
   */
  pipelineLabels?: string[]
  /** A short line of model-context under the pipeline chips (Predict RI's RI Head description). */
  pipelineHint?: string
}

/**
 * The layout every stage uses, under the progress tracker: a large main visual on one side and, on the
 * other, the status text: big stage title, one plain-language sentence, and room for completion lines. Every
 * stage shows which basin this randomly generated storm was placed in, here, once.
 */
export function StageLayout({
  stage,
  visual,
  children,
  sentence,
  columns = 'lg:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]',
  tight = false,
  pipelineLabels,
  pipelineHint,
}: StageLayoutProps) {
  const copy = STAGE_COPY[stage]
  const step = STORY_STEPS.findIndex((s) => s.stage === stage)
  const currentCase = useCase()

  return (
    <div className={`short:gap-3 grid flex-1 gap-5 ${columns}`}>
      <div className="relative flex min-h-[300px] overflow-hidden rounded-xl border border-line bg-panel">{visual}</div>

      <section className="flex flex-col justify-center">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
          <p className="num text-xs font-medium tracking-[0.22em] text-accent uppercase">
            {step === -1 ? 'Explanation' : `Stage ${step + 1} of ${STORY_STEPS.length}`}
          </p>
          {pipelineLabels?.map((label) => (
            <Badge
              key={label}
              tone="blue"
              className="min-w-0 max-w-full !whitespace-normal break-words px-2 py-0.5 text-[10px] leading-tight text-left normal-case"
            >
              {label}
            </Badge>
          ))}
        </div>
        {pipelineHint && <p className="mt-1 text-xs text-muted/80">{pipelineHint}</p>}
        <h1 className="short:mt-1.5 short:text-2xl mt-2 text-3xl leading-tight font-semibold tracking-tight sm:text-4xl">{copy.title}</h1>
        <p className="short:mt-1.5 short:text-[1rem] mt-3 text-lg leading-relaxed text-muted">{sentence ?? copy.sentence}</p>
        <div className="short:mt-1.5 mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1">
          <Badge tone={BASIN_TONE[currentCase.basin]}>{currentCase.basin}</Badge>
        </div>
        <div className={`short:mt-2.5 short:space-y-2 space-y-3 ${tight ? 'mt-3' : 'mt-6'}`} aria-live="polite">
          {children}
        </div>
      </section>
    </div>
  )
}
