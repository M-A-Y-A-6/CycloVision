import { motion } from 'framer-motion'
import { Info } from 'lucide-react'
import { Badge } from '../components/Badge'
import { Panel } from '../components/Panel'
import { STAGE_MOTION } from '../config/timings'
import { DocumentHeader } from './DocumentHeader'

/** The architecture pipeline (CLAUDE.md's Architecture pipeline section), each stage in one plain sentence. */
const PIPELINE_STEPS: ReadonlyArray<{ name: string; plain: string }> = [
  {
    name: 'Data Ingestion & Preprocessing',
    plain: 'Raw satellite and environmental readings are cleaned, geocoded, cropped around the storm and normalised.',
  },
  {
    name: 'YOLO-NAS',
    plain: 'Finds the storm in the image and pinpoints its centre.',
  },
  {
    name: 'ConvNeXt',
    plain: 'Reads the shape and texture of the clouds and extracts visual features from them.',
  },
  {
    name: 'Physics-Guided GAT',
    plain:
      'A graph attention network fuses those visual features with the surrounding physical conditions — sea temperature, wind shear, moisture.',
  },
  {
    name: 'Basin-Adaptive Layer',
    plain: 'Routes the case to a Bay of Bengal or Arabian Sea head, since the two basins behave differently.',
  },
  {
    name: 'Multi-Task Heads',
    plain:
      'Three outputs come from one fused representation: a structural classification, a rapid-intensification probability (via a TCN + Attention temporal module, the RI Head), and a forecast track.',
  },
  {
    name: 'Explainability & Uncertainty',
    plain:
      'Grad-CAM, SHAP, attention maps, Monte Carlo Dropout and ensemble inference — combined into one consolidated read of why the model reached its answer and how sure it is.',
  },
]

/**
 * About ("/about"): a Model Card style page — the architecture pipeline in plain language, the team and
 * competition, an explicit intended-use line, and a limitations note explaining every storm is randomly
 * generated and synthetic. A document-style page, not an animated one.
 */
export function AboutPage() {
  return (
    <motion.main
      className="mx-auto w-full max-w-[860px] flex-1 px-4 py-8 sm:px-6"
      initial={STAGE_MOTION.initial}
      animate={STAGE_MOTION.animate}
      exit={STAGE_MOTION.exit}
      transition={STAGE_MOTION.transition}
    >
      <DocumentHeader
        icon={Info}
        title="About CycloVision"
        subtitle="A model card: what CycloVision is, how it works, who built it, and what it is — and is not — for."
      />

      <Panel title="Overview" className="mb-6">
        <p className="text-sm leading-relaxed text-ink">
          CycloVision is an <span className="font-semibold">Explainable AI Early-Warning System</span> for tropical
          cyclones. It fuses four satellite data sources — infrared, water vapour, passive microwave and sea surface
          temperature — to identify a cyclone, classify its structure using IMD's Dvorak vocabulary, and predict
          Rapid Intensification (a wind gain of 30+ knots within 24 hours) 12-24 hours ahead, as a probability with
          an uncertainty band, alongside an explanation of why.
        </p>
      </Panel>

      <Panel title="How it works" className="mb-6">
        <ol className="space-y-4">
          {PIPELINE_STEPS.map((step, i) => (
            <li key={step.name} className="flex gap-3.5">
              <span className="num grid size-7 shrink-0 place-items-center rounded-full border border-line bg-base text-xs font-semibold text-accent">
                {i + 1}
              </span>
              <div>
                <p className="text-sm font-semibold text-ink">{step.name}</p>
                <p className="mt-0.5 text-sm leading-relaxed text-muted">{step.plain}</p>
              </div>
            </li>
          ))}
        </ol>
      </Panel>

      <Panel title="Team & competition" className="mb-6">
        <div className="flex flex-wrap gap-2">
          <Badge tone="blue">Team Formula 1</Badge>
          <Badge tone="cyan">Smart India Hackathon 2026</Badge>
          <Badge tone="neutral">Problem Statement SIH26070</Badge>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-muted">
          Built by Team Formula 1 for Smart India Hackathon 2026, Problem Statement SIH26070: an AI/ML system for
          identification, classification and prediction of tropical cyclone patterns using multi-source satellite
          data.
        </p>
      </Panel>

      <Panel title="Intended use" className="mb-6">
        <p className="text-sm leading-relaxed text-ink">
          <span className="font-semibold">Intended use: decision support for forecasters, not a replacement.</span>{' '}
          CycloVision is designed to sit alongside a forecaster's own judgement and official agency products (see
          the Consensus view in Full Results) — surfacing a fast, explainable second read, never issuing or
          overriding an official warning on its own.
        </p>
      </Panel>

      <Panel title="Limitations & disclaimer">
        <p className="text-sm leading-relaxed text-ink italic">
          Every storm shown is randomly generated for this demo and does not represent any real cyclone, living or
          historical.
        </p>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          This is a front-end demo prototype: every number, image and model output in the app — including this
          page's pipeline — is synthetic and pre-written, not the product of a trained model running on real data.
        </p>
      </Panel>
    </motion.main>
  )
}
