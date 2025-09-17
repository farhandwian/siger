import styles from './animated-dot-pattern.module.css'

/**
 * Static Dot Pattern Background Component
 * Uses the provided SVG background without animations
 * Simple static background pattern
 */
export function AnimatedDotPattern() {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Static base pattern */}
      <div className={`absolute inset-0 ${styles.staticLayer}`} />
    </div>
  )
}
