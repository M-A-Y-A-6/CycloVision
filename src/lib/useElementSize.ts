import { useEffect, useState, type RefObject } from 'react'

/** The element's current width and height in pixels (null until it has been measured); updates on resize. */
export function useElementSize(ref: RefObject<HTMLElement | null>): { w: number; h: number } | null {
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [ref])

  return size
}
