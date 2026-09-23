import type { BadgeTone } from '../components/Badge'
import type { RiRiskLevel } from '../data/cases'

/** The badge colour for each RI risk level, used everywhere the level is shown (Predict, Result). */
export const RISK_TONE: Record<RiRiskLevel, BadgeTone> = { Low: 'green', Moderate: 'cyan', Elevated: 'amber', High: 'red' }
