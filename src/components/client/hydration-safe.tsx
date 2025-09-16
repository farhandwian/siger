'use client'

import { useEffect, useState } from 'react'

interface HydrationSafeProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * HydrationSafe Component
 * 
 * This component prevents hydration mismatches by only rendering children 
 * after the component has mounted on the client side.
 * 
 * Use this wrapper for components that might have different values
 * between server and client rendering (e.g., components using Date.now(),
 * Math.random(), localStorage, or other browser-specific APIs).
 */
export function HydrationSafe({ children, fallback = null }: HydrationSafeProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
