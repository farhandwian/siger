'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import styles from './animated-map-marker.module.css'

/**
 * Animated Map Marker Component
 * Features multiple markers in random positions with floating animations
 * Pulse animations positioned below each marker
 * Uses the provided marker SVG from public folder
 */
export function AnimatedMapMarker() {
  // Define marker configurations with progress values and appropriate colors
  const markerConfigs = [
    { className: styles.marker1, delay: 0, progress: 85, status: 'excellent' }, // Green - 80%+
    { className: styles.marker2, delay: 0.5, progress: 65, status: 'good' }, // Yellow - 50-79%
    { className: styles.marker3, delay: 1, progress: 35, status: 'poor' }, // Red - below 50%
    { className: styles.marker4, delay: 1.5, progress: 92, status: 'excellent' }, // Green - 80%+
  ]

  const getProgressStyles = (status: string) => {
    switch (status) {
      case 'excellent':
        return {
          bgColor: 'bg-green-500',
          textColor: 'text-white',
          pulseColor: 'border-green-400/40',
        }
      case 'good':
        return {
          bgColor: 'bg-yellow-500',
          textColor: 'text-black',
          pulseColor: 'border-yellow-400/40',
        }
      case 'poor':
        return {
          bgColor: 'bg-red-500',
          textColor: 'text-white',
          pulseColor: 'border-red-400/40',
        }
      default:
        return {
          bgColor: 'bg-gray-500',
          textColor: 'text-white',
          pulseColor: 'border-gray-400/40',
        }
    }
  }

  return (
    <div className="absolute inset-0 h-full w-full">
      {markerConfigs.map((config, index) => {
        const progressStyles = getProgressStyles(config.status)

        return (
          <div key={index} className={`${styles.markerContainer} ${config.className}`}>
            {/* Map Marker with up/down floating animation */}
            <motion.div
              className="relative z-10"
              animate={{
                y: [0, -8, 0],
              }}
              transition={{
                duration: 2.5 + index * 0.3,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: config.delay,
              }}
            >
              <Image
                src="/marker-signin.svg"
                alt={`Location Marker ${index + 1}`}
                width={60}
                height={60}
                className="drop-shadow-lg"
              />
            </motion.div>

            {/* Progress indicator below marker */}
            <motion.div
              className="absolute left-1/2 top-[68px] -translate-x-1/2 transform text-center"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                delay: config.delay + 0.5,
              }}
            >
              <div
                className={`${progressStyles.bgColor} ${progressStyles.textColor} rounded-xl border border-white/30 px-4 py-2 text-sm font-bold shadow-2xl backdrop-blur-sm`}
              >
                {config.progress}%
              </div>
            </motion.div>

            {/* Pulse animations below the progress indicator */}
            <motion.div
              className="absolute left-1/2 top-[105px] -translate-x-1/2 transform"
              animate={{
                scale: [1, 2.8, 1],
                opacity: [0.7, 0, 0.7],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeOut',
                delay: config.delay,
              }}
            >
              <div className={`h-5 w-5 rounded-full border-2 ${progressStyles.pulseColor}`} />
            </motion.div>

            {/* Secondary pulse */}
            <motion.div
              className="absolute left-1/2 top-[105px] -translate-x-1/2 transform"
              animate={{
                scale: [1, 2.2, 1],
                opacity: [0.5, 0, 0.5],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeOut',
                delay: config.delay + 1.2,
              }}
            >
              <div
                className={`h-5 w-5 rounded-full border-2 ${progressStyles.pulseColor} opacity-75`}
              />
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}
