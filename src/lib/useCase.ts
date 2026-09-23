import { generateStormCase, type StormCase } from '../data/cases'
import { useStory } from '../store/story'

/** A fixed fallback seed, purely as a type-safety net for the rare defensive render before a case exists. */
const FALLBACK_SEED = 0

/**
 * The randomly generated storm the story is currently running, resolved from the store. Falls back to a
 * freshly generated storm from a fixed seed if none is set yet, purely as a type-safety net — every real
 * consumer of this hook (StageLayout and everything under it) only ever renders once `Analysis` has already
 * confirmed `currentCase` is set, redirecting to Dashboard otherwise, so the fallback should not be
 * reachable in normal use.
 */
export function useCase(): StormCase {
  const currentCase = useStory((s) => s.currentCase)
  return currentCase ?? generateStormCase(FALLBACK_SEED)
}
