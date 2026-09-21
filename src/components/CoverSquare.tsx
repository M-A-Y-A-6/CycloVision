import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Fills its parent with a centred square, like CSS "object-fit: cover": the square's side is the parent's
 * longer side, so it always covers the parent completely and the extra is cropped. Children are positioned
 * inside the square, so anything using the storm's 0-1 coordinates lines up with the image exactly.
 */
export function CoverSquare({ children, className }: { children: ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState<{ w: number; h: number } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }))
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const side = box ? Math.max(box.w, box.h) : 0

  return (
    <div ref={ref} className="absolute inset-0 overflow-hidden">
      {box && (
        <div
          className={className}
          style={{ position: 'absolute', width: side, height: side, left: (box.w - side) / 2, top: (box.h - side) / 2 }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
