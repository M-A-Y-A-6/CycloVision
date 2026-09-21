import { motion } from 'framer-motion'
import { SWIRL_IMAGE_PX } from '../config/imagery'
import { storm } from '../data/storm'
import { SWIRL_CSS_SIZE } from '../lib/swirlSize'
import { MapAnchor } from './MapAnchor'
import { SatelliteCanvas } from './SatelliteCanvas'

const ease: [number, number, number, number] = [0.4, 0, 0.2, 1]

/**
 * A soft swirl of the storm's own cloud (the water-vapour image) sitting on the map at the storm's position.
 * progress 0 = invisible, 1 = fully built. Must be used inside <MonitoringMap>.
 */
export function StormSwirl({ progress }: { progress: number }) {
  const fade = 'radial-gradient(circle closest-side, #000 35%, transparent 100%)'
  return (
    <MapAnchor lat={storm.center.latN} lon={storm.center.lonE} className="mix-blend-screen" zIndex={455}>
      <motion.div
        initial={false}
        animate={{
          opacity: progress * 0.56,
          scale: 0.8 + progress * 0.2,
          filter: `blur(${(1 - progress) * 6}px)`,
        }}
        transition={{ duration: 1.4, ease: 'easeOut' }}
        style={{ width: SWIRL_CSS_SIZE, height: SWIRL_CSS_SIZE, maskImage: fade, WebkitMaskImage: fade }}
      >
        <SatelliteCanvas channel="wv" size={SWIRL_IMAGE_PX} className="size-full" />
      </motion.div>
    </MapAnchor>
  )
}

/** Calm pulsing marker on the detected system: two slow rings that expand and fade, no flashing. */
export function DetectionMarker({ show }: { show: boolean }) {
  return (
    <MapAnchor lat={storm.center.latN} lon={storm.center.lonE} zIndex={470}>
      <motion.div
        initial={false}
        animate={{ opacity: show ? 1 : 0, scale: show ? 1 : 0.5 }}
        transition={{ duration: 0.8, ease }}
        className="relative grid size-14 place-items-center"
      >
        {show && (
          <>
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-amber/70 motion-reduce:animate-none" />
            <span className="absolute inset-0 animate-pulse-ring rounded-full border border-amber/50 [animation-delay:1.4s] motion-reduce:animate-none" />
          </>
        )}
        <span className="size-3 rounded-full bg-amber shadow-[0_0_14px_3px_rgb(245_158_11/0.55)]" />
      </motion.div>
    </MapAnchor>
  )
}
