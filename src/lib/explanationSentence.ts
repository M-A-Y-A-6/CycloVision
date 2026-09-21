import type { RiDriver } from '../data/storm'

/** "a", "a and b", "a, b and c". */
function joinList(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`
}

/**
 * Writes the one-sentence plain-language summary from the strongest drivers that push the risk UP.
 * Each driver contributes a phrase (data/storm.ts): what the AI "sees", what it sits "over", what it comes
 * "with". With the demo data the top three give:
 * "The AI sees a ring forming in the microwave image that is not yet visible in infrared, over very warm
 * water with low wind shear."
 */
export function explanationSentence(drivers: readonly RiDriver[], count = 3): string {
  const top = drivers
    .filter((d) => d.contributionPp > 0)
    .sort((a, b) => b.contributionPp - a.contributionPp)
    .slice(0, count)
  const of = (kind: RiDriver['phrase']['kind']) => top.filter((d) => d.phrase.kind === kind).map((d) => d.phrase.text)

  const sees = of('sees')
  const over = of('over')
  const withs = of('with')

  let sentence = `The AI sees ${sees.length ? joinList(sees) : 'clear signs of strengthening'}`
  if (over.length) sentence += `, over ${joinList(over)}`
  if (withs.length) sentence += ` with ${joinList(withs)}`
  return `${sentence}.`
}
