'use client'

import { useEffect } from 'react'

export default function ChunkErrorHandler() {
  useEffect(() => {
    const handle = (e: any) => {
      // normalize message for both error and unhandledrejection events
      const msg = e?.message || (e?.reason && e.reason.message) || ''
      const name = e?.name || (e?.reason && e.reason.name) || ''

      if (
        msg.includes('Loading chunk') ||
        msg.includes('ChunkLoadError') ||
        name === 'ChunkLoadError'
      ) {
        // schedule a short delay to allow any logging to complete
        setTimeout(async () => {
          try {
            // unregister all service workers (helps when SW serves stale assets)
            if ('serviceWorker' in navigator) {
              const regs = await navigator.serviceWorker.getRegistrations()
              for (const r of regs) {
                try {
                  await r.unregister()
                } catch (err) {
                  // ignore
                }
              }
            }

            // clear caches
            if ('caches' in window) {
              const keys = await caches.keys()
              await Promise.all(keys.map(k => caches.delete(k)))
            }
          } catch (err) {
            // ignore errors during cleanup
          }

          // reload page to fetch fresh assets
          window.location.reload()
        }, 300)
      }
    }

    window.addEventListener('error', handle)
    window.addEventListener('unhandledrejection', handle)

    return () => {
      window.removeEventListener('error', handle)
      window.removeEventListener('unhandledrejection', handle)
    }
  }, [])

  return null
}
