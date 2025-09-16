'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { AlertTriangle, X } from 'lucide-react'
import { toast } from 'sonner'
import { ProgressBar } from '@/components/ui/progress-bar'

interface CopyPlanToActionPlanModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
  onConfirm: () => void
}

export function CopyPlanToActionPlanModal({ 
  isOpen, 
  onClose, 
  projectId,
  onConfirm
}: CopyPlanToActionPlanModalProps) {
  const [isLoading, setIsLoading] = useState(false)

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/projects/${projectId}/schedule/copy-plan-to-action-plan`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      const result = await response.json()

      if (result.success) {
        toast.success('Berhasil menyalin rencana ke rencana aksi')
        onConfirm()
        handleClose()
      } else {
        toast.error(result.error || 'Gagal menyalin rencana ke rencana aksi')
      }
    } catch (error) {
      console.error('Error copying plan to action plan:', error)
      toast.error('Terjadi kesalahan saat menyalin rencana ke rencana aksi')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    if (!isLoading) {
      onClose()
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md rounded-2xl">
        {/* Header */}
        <div className="border-b border-[#eaecf0] px-6 pb-5 pt-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                <span className="text-lg font-medium text-gray-900">Konfirmasi Salin Rencana</span>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleClose} 
                disabled={isLoading}
                className="h-5 w-5 p-0"
              >
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </DialogTitle>
          </DialogHeader>
        </div>

        <div className="px-6 py-4">
          <div className="mb-6">
            <p className="text-gray-700">
              Anda akan menyalin semua data <span className="font-semibold">Rencana</span> ke <span className="font-semibold">Rencana Aksi</span>.
            </p>
            <p className="mt-2 text-gray-700">
              Data <span className="font-semibold">Rencana Aksi</span> yang sudah ada akan ditimpa dan tidak dapat dikembalikan.
            </p>
          </div>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isLoading}
              className="bg-red-500 text-white hover:bg-red-600"
            >
              {isLoading ? 'Memproses...' : 'Salin Rencana'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}