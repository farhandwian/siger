import React from 'react'
import styles from './ProgressBar.module.css'

/**
 * Progress bar component without inline styles
 * Uses predefined CSS classes for common percentages
 */
interface ProgressBarProps {
  planned: number
  actual: number
}

function getWidthClass(percentage: number): string {
  const rounded = Math.round(Math.min(percentage, 100) / 5) * 5 // Round to nearest 5%
  if (rounded <= 5) return styles.w5
  if (rounded <= 10) return styles.w10
  if (rounded <= 15) return styles.w15
  if (rounded <= 20) return styles.w20
  if (rounded <= 25) return styles.w25
  if (rounded <= 30) return styles.w30
  if (rounded <= 35) return styles.w35
  if (rounded <= 40) return styles.w40
  if (rounded <= 45) return styles.w45
  if (rounded <= 50) return styles.w50
  if (rounded <= 55) return styles.w55
  if (rounded <= 60) return styles.w60
  if (rounded <= 65) return styles.w65
  if (rounded <= 70) return styles.w70
  if (rounded <= 75) return styles.w75
  if (rounded <= 80) return styles.w80
  if (rounded <= 85) return styles.w85
  if (rounded <= 90) return styles.w90
  if (rounded <= 95) return styles.w95
  return styles.w100
}

export function ProgressBar({ planned, actual }: ProgressBarProps) {
  return (
    <div className={styles.container}>
      {/* Planned progress (lighter) */}
      <div className={`${styles.progressBarPlanned} ${getWidthClass(planned)}`} />
      {/* Actual progress (darker) */}
      <div className={`${styles.progressBarActual} ${getWidthClass(actual)}`} />
    </div>
  )
}
