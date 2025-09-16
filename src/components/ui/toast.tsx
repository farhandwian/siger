'use client'

import * as React from 'react'
import { createContext, useContext, useState, useCallback, useRef } from 'react'
import { CheckCircle, XCircle, AlertCircle, Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'

// Toast types and interfaces
export type ToastType = 'success' | 'error' | 'warning' | 'info'

export interface Toast {
  id: string
  type: ToastType
  title: string
  description?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastContextValue {
  toasts: Toast[]
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  success: (title: string, description?: string, duration?: number) => void
  error: (title: string, description?: string, duration?: number) => void
  warning: (title: string, description?: string, duration?: number) => void
  info: (title: string, description?: string, duration?: number) => void
}

// Context
const ToastContext = createContext<ToastContextValue | null>(null)

// Hook to use toast
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

// Toast icons
const toastIcons = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertCircle,
  info: Info,
}

// Toast colors
const toastColors = {
  success: {
    container: 'bg-green-50 border-green-200',
    icon: 'text-green-600',
    title: 'text-green-900',
    description: 'text-green-700',
    progress: 'bg-green-500',
  },
  error: {
    container: 'bg-red-50 border-red-200',
    icon: 'text-red-600',
    title: 'text-red-900',
    description: 'text-red-700',
    progress: 'bg-red-500',
  },
  warning: {
    container: 'bg-yellow-50 border-yellow-200',
    icon: 'text-yellow-600',
    title: 'text-yellow-900',
    description: 'text-yellow-700',
    progress: 'bg-yellow-500',
  },
  info: {
    container: 'bg-blue-50 border-blue-200',
    icon: 'text-blue-600',
    title: 'text-blue-900',
    description: 'text-blue-700',
    progress: 'bg-blue-500',
  },
}

// Individual Toast Component
export function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: (id: string) => void }) {
  const [progress, setProgress] = useState(100)
  const [isVisible, setIsVisible] = useState(false)
  const duration = toast.duration || 5000

  const Icon = toastIcons[toast.type]
  const colors = toastColors[toast.type]

  const handleRemove = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onRemove(toast.id), 300) // Wait for exit animation
  }, [toast.id, onRemove])

  React.useEffect(() => {
    // Trigger entrance animation
    const timer = setTimeout(() => setIsVisible(true), 10)
    return () => clearTimeout(timer)
  }, [])

  React.useEffect(() => {
    if (duration === 0) return // Persist indefinitely

    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev - 100 / (duration / 100)
        if (newProgress <= 0) {
          handleRemove()
          return 0
        }
        return newProgress
      })
    }, 100)

    return () => clearInterval(interval)
  }, [duration, handleRemove])

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border shadow-lg transition-all duration-300 ease-out',
        colors.container,
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      )}
      style={{ maxWidth: '420px', width: '100%' }}
    >
      {/* Progress bar */}
      {duration > 0 && (
        <div className="absolute left-0 top-0 h-1 w-full bg-gray-200">
          <div
            className={cn('h-full transition-all duration-100 ease-linear', colors.progress)}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="flex items-start gap-3 p-4 pt-5">
        {/* Icon */}
        <div className="flex-shrink-0">
          <Icon className={cn('h-5 w-5', colors.icon)} />
        </div>

        {/* Text content */}
        <div className="min-w-0 flex-1">
          <h3 className={cn('text-sm font-semibold', colors.title)}>{toast.title}</h3>
          {toast.description && (
            <p className={cn('mt-1 text-sm', colors.description)}>{toast.description}</p>
          )}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className={cn('mt-2 text-sm font-medium underline hover:no-underline', colors.title)}
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleRemove}
          className={cn(
            'flex-shrink-0 rounded-md p-1 transition-colors hover:bg-gray-100',
            colors.title
          )}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

// Toast Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const toastIdCounter = useRef(0)

  const addToast = useCallback((toast: Omit<Toast, 'id'>) => {
    // Use a counter instead of Math.random to prevent hydration mismatches
    const id = `toast-${++toastIdCounter.current}`
    setToasts(prev => [...prev, { ...toast, id }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const success = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast({ type: 'success', title, description, duration })
    },
    [addToast]
  )

  const error = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast({ type: 'error', title, description, duration })
    },
    [addToast]
  )

  const warning = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast({ type: 'warning', title, description, duration })
    },
    [addToast]
  )

  const info = useCallback(
    (title: string, description?: string, duration?: number) => {
      addToast({ type: 'info', title, description, duration })
    },
    [addToast]
  )

  const value = {
    toasts,
    addToast,
    removeToast,
    success,
    error,
    warning,
    info,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Toast Container */}
      <div className="pointer-events-none fixed right-4 top-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div key={toast.id} className="pointer-events-auto">
            <ToastItem toast={toast} onRemove={removeToast} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
