import { AnimatePresence, motion } from 'framer-motion'
import { Check, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Badge } from '../../components/Badge'
import { CycloneIcon } from '../../components/CycloneIcon'
import { Panel } from '../../components/Panel'
import { RISK_TONE } from '../../config/risk'
import type { StormCase } from '../../data/cases'

type SendState = 'idle' | 'sending' | 'sent'
const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

/**
 * Alert tab: the case's alert headline/body with its severity, and a phone-mockup preview of what it would
 * look like as a SACHET-style push notification (SACHET is India's real public alert dissemination system —
 * used here only as a realistic label, exactly like the real model names elsewhere in the app; CycloVision
 * does not connect to it or send anything real). "Send to SACHET" only plays a short local, clearly-labelled
 * simulated confirmation — there is no network call.
 */
export function AlertTab({ caseData }: { caseData: StormCase }) {
  const { headline, body, severity } = caseData.precomputed.alertText
  const [sendState, setSendState] = useState<SendState>('idle')

  useEffect(() => {
    if (sendState !== 'sent') return
    const timer = setTimeout(() => setSendState('idle'), 4000)
    return () => clearTimeout(timer)
  }, [sendState])

  const handleSend = () => {
    if (sendState !== 'idle') return
    setSendState('sending')
    setTimeout(() => setSendState('sent'), 900)
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <Panel title="Alert content">
        <Badge tone={RISK_TONE[severity]} size="lg">
          {severity}
        </Badge>
        <h3 className="mt-3 text-xl leading-tight font-semibold text-ink">{headline}</h3>
        <p className="mt-2.5 text-sm leading-relaxed text-muted">{body}</p>
      </Panel>

      <Panel title="Preview — SACHET-style alert">
        <p className="mb-4 text-xs text-muted">
          A mockup only, styled after India's public alert system. CycloVision does not connect to SACHET and
          nothing here is ever really sent.
        </p>

        <div className="mx-auto w-[220px] rounded-[26px] border-4 border-line bg-base p-2.5 shadow-xl">
          <div className="mx-auto mb-2 h-3.5 w-16 rounded-full bg-line" aria-hidden="true" />
          <div className="rounded-xl border border-line bg-panel p-3">
            <div className="flex items-center gap-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-md border border-primary/30 bg-primary/10 text-accent">
                <CycloneIcon className="size-3.5" />
              </span>
              <span className="text-[11px] font-semibold tracking-[0.06em] text-ink uppercase">SACHET Alert</span>
            </div>
            <p className="mt-2 text-[13px] leading-snug font-semibold text-ink">{headline}</p>
            <p className="mt-1 line-clamp-2 text-[11px] leading-snug text-muted">{body}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSend}
          disabled={sendState !== 'idle'}
          className="btn-glow mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold tracking-wide"
        >
          {sendState === 'sending' ? (
            <>
              <motion.span
                className="size-3.5 rounded-full border-2 border-white/30 border-t-white"
                animate={{ rotate: -360 }}
                transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                aria-hidden="true"
              />
              Sending (simulated)…
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Send to SACHET
            </>
          )}
        </button>

        <AnimatePresence>
          {sendState === 'sent' && (
            <motion.div
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35, ease }}
              role="status"
              className="mt-3 flex items-center gap-2 rounded-lg border border-green/30 bg-green/10 px-3.5 py-2.5 text-sm text-ink"
            >
              <Check className="size-4 shrink-0 text-green" aria-hidden="true" />
              Sent (simulated) — no real alert was dispatched.
            </motion.div>
          )}
        </AnimatePresence>
      </Panel>
    </div>
  )
}
