'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Plus, Trash2 } from 'lucide-react'
import { useCreateActivity } from '@/hooks/useActivityQueries'
import { toast } from 'sonner'

interface SubActivityForm {
  id: string
  name: string
  weight: number
}

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export function AddActivityModal({ isOpen, onClose, projectId }: AddActivityModalProps) {
  const [activityName, setActivityName] = useState('')
  const [activityWeight, setActivityWeight] = useState<number>(0)
  const [subActivities, setSubActivities] = useState<SubActivityForm[]>([
    { id: '1', name: '', weight: 0 },
  ])

  const createActivityMutation = useCreateActivity(projectId)

  const addSubActivity = () => {
    const newId = (Math.max(...subActivities.map(sa => parseInt(sa.id))) + 1).toString()
    setSubActivities([...subActivities, { id: newId, name: '', weight: 0 }])
  }

  const removeSubActivity = (id: string) => {
    if (subActivities.length > 1) {
      setSubActivities(subActivities.filter(sa => sa.id !== id))
    }
  }

  const updateSubActivity = (id: string, field: keyof SubActivityForm, value: string | number) => {
    setSubActivities(subActivities.map(sa => (sa.id === id ? { ...sa, [field]: value } : sa)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    if (!activityName.trim()) {
      toast.error('Nama kegiatan wajib diisi')
      return
    }

    if (activityWeight <= 0 || activityWeight > 100) {
      toast.error('Bobot kegiatan harus antara 1-100%')
      return
    }

    const totalSubWeight = subActivities.reduce((sum, sa) => sum + sa.weight, 0)
    if (totalSubWeight > 100) {
      toast.error('Total bobot sub kegiatan tidak boleh melebihi 100%')
      return
    }

    // Check if any sub-activity has empty name
    const hasEmptySubActivity = subActivities.some(sa => !sa.name.trim())
    if (hasEmptySubActivity) {
      toast.error('Semua sub kegiatan harus memiliki nama')
      return
    }

    try {
      await createActivityMutation.mutateAsync({
        name: activityName,
        weight: activityWeight,
      })

      toast.success('Kegiatan berhasil ditambahkan')
      handleClose()
    } catch (error) {
      toast.error('Gagal menambahkan kegiatan')
      console.error('Error creating activity:', error)
    }
  }

  const handleClose = () => {
    setActivityName('')
    setActivityWeight(0)
    setSubActivities([{ id: '1', name: '', weight: 0 }])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Tambah Kegiatan
            <Button variant="ghost" size="sm" onClick={handleClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Activity Details */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-900">Informasi Kegiatan</h3>

            <div className="space-y-2">
              <Label htmlFor="activity-name">Nama Kegiatan *</Label>
              <Input
                id="activity-name"
                value={activityName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setActivityName(e.target.value)
                }
                placeholder="Masukkan nama kegiatan"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="activity-weight">Bobot Kegiatan (%) *</Label>
              <Input
                id="activity-weight"
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={activityWeight}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setActivityWeight(parseFloat(e.target.value) || 0)
                }
                placeholder="0"
                required
              />
            </div>
          </div>

          {/* Sub Activities */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium text-gray-900">Sub Kegiatan</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSubActivity}
                className="flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Tambah Sub Kegiatan
              </Button>
            </div>

            <div className="space-y-3">
              {subActivities.map((subActivity, index) => (
                <div key={subActivity.id} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Nama sub kegiatan ${index + 1}`}
                      value={subActivity.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateSubActivity(subActivity.id, 'name', e.target.value)
                      }
                    />
                  </div>
                  <div className="w-24">
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.1"
                      placeholder="Bobot %"
                      value={subActivity.weight}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        updateSubActivity(subActivity.id, 'weight', parseFloat(e.target.value) || 0)
                      }
                    />
                  </div>
                  {subActivities.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSubActivity(subActivity.id)}
                      className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <div className="text-sm text-gray-600">
              Total bobot sub kegiatan:{' '}
              {subActivities.reduce((sum, sa) => sum + sa.weight, 0).toFixed(1)}%
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createActivityMutation.isPending}
              className="bg-[#ffc928] text-[#364878] hover:bg-[#e6b323]"
            >
              {createActivityMutation.isPending ? 'Menyimpan...' : 'Simpan Kegiatan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
