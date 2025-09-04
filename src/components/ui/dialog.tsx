'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={() => onOpenChange?.(false)} />
      <div className="relative z-50">{children}</div>
    </div>
  )
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

export function DialogContent({ className, children }: DialogContentProps) {
  return (
    <div className={cn('mx-4 w-full max-w-lg rounded-lg bg-white p-6 shadow-lg', className)}>
      {children}
    </div>
  )
}

interface DialogHeaderProps {
  children: React.ReactNode
}

export function DialogHeader({ children }: DialogHeaderProps) {
  return <div className="mb-4">{children}</div>
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

export function DialogTitle({ className, children }: DialogTitleProps) {
  return <h2 className={cn('text-lg font-semibold text-gray-900', className)}>{children}</h2>
}
