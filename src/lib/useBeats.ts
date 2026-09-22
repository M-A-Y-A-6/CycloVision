import { useEffect, useState } from 'react'

/**
 * Flips each named beat to true once its fraction of `seconds` has passed since the component appeared.
 * Lets a stage describe its choreography as a list of moments (see IDENTIFY_BEATS). `beats` must be a
 * stable object, such as a module constant.
 *
 * Pass `instant: true` to skip every timer and start with all beats already true — for a stage the progress
 * tracker jumped straight to because it had already finished, so it should show its result immediately
 * instead of replaying the reveal.
 */
export function useBeats<K extends string>(
  seconds: number,
  beats: Readonly<Record<K, number>>,
  instant = false,
): Record<K, boolean> {
  const [reached, setReached] = useState(
    () => Object.fromEntries((Object.keys(beats) as K[]).map((name) => [name, instant])) as Record<K, boolean>,
  )

  useEffect(() => {
    if (instant) return
    const timers = (Object.keys(beats) as K[]).map((name) =>
      setTimeout(() => setReached((r) => ({ ...r, [name]: true })), beats[name] * seconds * 1000),
    )
    return () => timers.forEach(clearTimeout)
  }, [seconds, beats, instant])

  return reached
}
