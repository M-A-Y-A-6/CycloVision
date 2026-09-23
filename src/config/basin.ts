import type { BadgeTone } from '../components/Badge'
import type { Basin } from '../data/cases'

/** Bay of Bengal and Arabian Sea get their own badge colour wherever a case's basin is shown — a quick visual
 *  grouping, not a risk cue (see config/risk.ts for the actual RI risk-level colours). */
export const BASIN_TONE: Record<Basin, BadgeTone> = { 'Bay of Bengal': 'blue', 'Arabian Sea': 'cyan' }
