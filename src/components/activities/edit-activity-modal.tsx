'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { X, Save, Trash2, Plus } from 'lucide-react'
import { useUpdateActivity, useDeleteActivity } from '@/hooks/useActivityQueries'
import { toast } from 'sonner'
import type { Activity } from '@/lib/schemas'

interface SubActivityForm {
  id: string
  name: string
  satuan: string
  volumeKontrak: number
  weight: number
  volumeMC0: number
  bobotMC0: number
}

interface EditActivityModalProps {
  isOpen: boolean
  onClose: () => void
  activity: Activity | null
  projectId: string
}

export function EditActivityModal({
  isOpen,
  onClose,
  activity,
  projectId,
}: EditActivityModalProps) {
  const [activityName, setActivityName] = useState('')
  const [subActivities, setSubActivities] = useState<SubActivityForm[]>([])

  const updateActivityMutation = useUpdateActivity(projectId)
  const deleteActivityMutation = useDeleteActivity(projectId)

  useEffect(() => {
    if (activity) {
      setActivityName(activity.name)
      if (activity.subActivities) {
        setSubActivities(
          activity.subActivities.map((sub, index) => ({
            id: sub.id || index.toString(),
            name: sub.name,
            satuan: sub.satuan || '',
            volumeKontrak: sub.volumeKontrak || 0,
            volumeMC0: sub.volumeMC0 || 0,
            bobotMC0: sub.bobotMC0 || 0,
            weight: sub.weight,
          }))
        )
      }
    }
  }, [activity])

  const addSubActivity = () => {
    const newId = (Math.max(...subActivities.map(sa => parseInt(sa.id))) + 1).toString()
    setSubActivities([
      ...subActivities,
      { id: newId, name: '', satuan: '', volumeKontrak: 0, volumeMC0: 0, bobotMC0: 0, weight: 0 },
    ])
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

    if (!activity) return

    // Validation
    if (!activityName.trim()) {
      toast.error('Nama kegiatan wajib diisi')
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
      await updateActivityMutation.mutateAsync({
        activityId: activity.id,
        data: {
          name: activityName,
        },
      })

      toast.success('Kegiatan berhasil diperbarui')
      handleClose()
    } catch (error) {
      toast.error('Gagal memperbarui kegiatan')
      console.error('Error updating activity:', error)
    }
  }

  const handleDelete = async () => {
    if (!activity) return

    if (!confirm('Apakah Anda yakin ingin menghapus kegiatan ini?')) return

    try {
      await deleteActivityMutation.mutateAsync(activity.id)
      toast.success('Kegiatan berhasil dihapus')
      handleClose()
    } catch (error) {
      toast.error('Gagal menghapus kegiatan')
      console.error('Error deleting activity:', error)
    }
  }

  const handleClose = () => {
    setActivityName('')
    setSubActivities([])
    onClose()
  }

  if (!activity) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Ubah Pekerjaan</span>
            <Button variant="ghost" size="sm" onClick={handleClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Main Activity Section */}
          <div className="rounded-2xl border border-gray-200 p-4">
            <div className="mb-3 rounded-2xl bg-gray-100 p-3">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 rounded border-b border-gray-200 bg-white px-3 py-2">
                    <span className="text-base font-medium text-gray-700">I.</span>
                    <Input
                      value={activityName}
                      onChange={e => setActivityName(e.target.value)}
                      placeholder="Isi Pekerjaan"
                      className="border-0 bg-transparent text-base text-gray-900 focus:ring-0"
                    />
                  </div>
                </div>
              </div>

              {/* Sub Activities */}
              <div className="space-y-2">
                {subActivities.map((subActivity, index) => (
                  <div key={subActivity.id} className="flex items-end gap-2">
                    <div className="w-[300px]">
                      {index === 0 && (
                        <Label className="text-sm font-medium text-gray-700">Kegiatan</Label>
                      )}
                      <Input
                        value={subActivity.name}
                        onChange={e => updateSubActivity(subActivity.id, 'name', e.target.value)}
                        placeholder="Isi Kegiatan"
                        className="rounded-lg border-gray-200 text-sm"
                      />
                    </div>

                    <div className="flex flex-1 gap-1.5">
                      <div className="w-[120px]">
                        {index === 0 && (
                          <Label className="text-sm font-medium text-gray-700">Satuan</Label>
                        )}
                        <Input
                          value={subActivity.satuan}
                          onChange={e =>
                            updateSubActivity(subActivity.id, 'satuan', e.target.value)
                          }
                          placeholder="Satuan"
                          className="rounded-lg border-gray-200 text-sm"
                        />
                      </div>

                      <div className="w-[130px]">
                        {index === 0 && (
                          <Label className="text-sm font-medium text-gray-700">
                            Volume Kontrak
                          </Label>
                        )}
                        <Input
                          type="number"
                          value={subActivity.volumeKontrak}
                          onChange={e =>
                            updateSubActivity(
                              subActivity.id,
                              'volumeKontrak',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Volume Kontrak"
                          className="rounded-lg border-gray-200 text-sm"
                        />
                      </div>

                      <div className="w-[110px]">
                        {index === 0 && (
                          <Label className="text-sm font-medium text-gray-700">Bobot (%)</Label>
                        )}
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={subActivity.weight}
                          onChange={e =>
                            updateSubActivity(
                              subActivity.id,
                              'weight',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Bobot (%)"
                          className="rounded-lg border-gray-200 text-sm"
                        />
                      </div>

                      <div className="w-[130px]">
                        {index === 0 && (
                          <Label className="text-sm font-medium text-gray-700">Volume MC 0</Label>
                        )}
                        <Input
                          type="number"
                          value={subActivity.volumeMC0}
                          onChange={e =>
                            updateSubActivity(
                              subActivity.id,
                              'volumeMC0',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Volume MC 0"
                          className="rounded-lg border-gray-200 text-sm"
                        />
                      </div>

                      <div className="w-[130px]">
                        {index === 0 && (
                          <Label className="text-sm font-medium text-gray-700">
                            Bobot MC 0 (%)
                          </Label>
                        )}
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={subActivity.bobotMC0}
                          onChange={e =>
                            updateSubActivity(
                              subActivity.id,
                              'bobotMC0',
                              parseFloat(e.target.value) || 0
                            )
                          }
                          placeholder="Bobot MC 0 (%)"
                          className="rounded-lg border-gray-200 text-sm"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addSubActivity}
                        className="h-8 w-8 border-blue-500 p-0 text-blue-500 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                      {subActivities.length > 1 && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSubActivity(subActivity.id)}
                          className="h-8 w-8 bg-red-500 p-0 text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-sm text-gray-600">
                Total bobot sub kegiatan:{' '}
                {subActivities.reduce((sum, sa) => sum + sa.weight, 0).toFixed(1)}%
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 border-t pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Hapus Pekerjaan
            </Button>
            <Button
              type="submit"
              className="bg-[#ffc928] text-[#364878] hover:bg-[#e6b526]"
              disabled={updateActivityMutation.isPending}
            >
              <Save className="mr-2 h-4 w-4" />
              {updateActivityMutation.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
