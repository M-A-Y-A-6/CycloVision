import { useEffect, useState } from 'react'

/**
 * Flips each named beat to true once its fraction of `seconds` has passed since the component appeared.
 * Lets a stage describe its choreography as a list of moments (see IDENTIFY_BEATS). `beats` must be a
 * stable object, such as a module constant.
 */
export function useBeats<K extends string>(seconds: number, beats: Readonly<Record<K, number>>): Record<K, boolean> {
  const [reached, setReached] = useState(
    () => Object.fromEntries((Object.keys(beats) as K[]).map((name) => [name, false])) as Record<K, boolean>,
  )

  useEffect(() => {
    const timers = (Object.keys(beats) as K[]).map((name) =>
      setTimeout(() => setReached((r) => ({ ...r, [name]: true })), beats[name] * seconds * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [seconds, beats])

  return reached
}
