import { useEffect, useRef } from 'react'

/** Always-current ref to a value, so timers can call the latest callback without being restarted. */
export function useLatest<T>(value: T) {
  const ref = useRef(value)
  useEffect(() => {
    ref.current = value
  })
  return ref
}
