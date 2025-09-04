'use client'

import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X, Save, Trash2, Plus } from 'lucide-react'
import { apiClient } from '@/lib/api-client'
import { toast } from 'sonner'

interface SubActivityForm {
  id: string
  name: string
  satuan: string
  volumeKontrak: number
  weight: number
  volumeMC0: number
  bobotMC0: number
}

interface ActivityForm {
  id: string
  name: string
  subActivities: SubActivityForm[]
}

interface AddActivityModalProps {
  isOpen: boolean
  onClose: () => void
  projectId: string
}

export function AddActivityModal({ isOpen, onClose, projectId }: AddActivityModalProps) {
  const [activities, setActivities] = useState<ActivityForm[]>([
    {
      id: '1',
      name: '',
      subActivities: [
        { id: '1', name: '', satuan: '', volumeKontrak: 0, volumeMC0: 0, bobotMC0: 0, weight: 0 },
      ],
    },
  ])
  const [isLoading, setIsLoading] = useState(false)

  const addActivity = () => {
    const newId = (Math.max(...activities.map(a => parseInt(a.id))) + 1).toString()
    setActivities([
      ...activities,
      {
        id: newId,
        name: '',
        subActivities: [
          { id: '1', name: '', satuan: '', volumeKontrak: 0, volumeMC0: 0, bobotMC0: 0, weight: 0 },
        ],
      },
    ])
  }

  const removeActivity = (activityId: string) => {
    if (activities.length > 1) {
      setActivities(activities.filter(a => a.id !== activityId))
    }
  }

  const updateActivity = (activityId: string, field: keyof ActivityForm, value: any) => {
    setActivities(activities.map(a => (a.id === activityId ? { ...a, [field]: value } : a)))
  }

  const addSubActivity = (activityId: string) => {
    setActivities(
      activities.map(a => {
        if (a.id === activityId) {
          const newSubId = (Math.max(...a.subActivities.map(sa => parseInt(sa.id))) + 1).toString()
          return {
            ...a,
            subActivities: [
              ...a.subActivities,
              {
                id: newSubId,
                name: '',
                satuan: '',
                volumeKontrak: 0,
                volumeMC0: 0,
                bobotMC0: 0,
                weight: 0,
              },
            ],
          }
        }
        return a
      })
    )
  }

  const removeSubActivity = (activityId: string, subActivityId: string) => {
    setActivities(
      activities.map(a => {
        if (a.id === activityId && a.subActivities.length > 1) {
          return {
            ...a,
            subActivities: a.subActivities.filter(sa => sa.id !== subActivityId),
          }
        }
        return a
      })
    )
  }

  const updateSubActivity = (
    activityId: string,
    subActivityId: string,
    field: keyof SubActivityForm,
    value: string | number
  ) => {
    setActivities(
      activities.map(a => {
        if (a.id === activityId) {
          return {
            ...a,
            subActivities: a.subActivities.map(sa =>
              sa.id === subActivityId ? { ...sa, [field]: value } : sa
            ),
          }
        }
        return a
      })
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validation
    const hasEmptyActivity = activities.some(a => !a.name.trim())
    if (hasEmptyActivity) {
      toast.error('Semua nama kegiatan harus diisi')
      return
    }

    const hasEmptySubActivity = activities.some(a => a.subActivities.some(sa => !sa.name.trim()))
    if (hasEmptySubActivity) {
      toast.error('Semua sub kegiatan harus memiliki nama')
      return
    }

    // Check total weight per activity
    for (const activity of activities) {
      const totalSubWeight = activity.subActivities.reduce((sum, sa) => sum + sa.weight, 0)
      if (totalSubWeight > 100) {
        toast.error(`Total bobot sub kegiatan untuk "${activity.name}" tidak boleh melebihi 100%`)
        return
      }
    }

    try {
      setIsLoading(true)
      // Create activities and their sub-activities sequentially
      for (const activity of activities) {
        console.log('Creating activity with data:', { name: activity.name })

        // Create the main activity using direct API call (since mutation is not working)
        try {
          const createdActivity = await apiClient.post(`/projects/${projectId}/activities`, {
            name: activity.name,
          })

          console.log('Created activity response:', createdActivity)

          // Extract activity ID from the response
          const activityId = (createdActivity as any).id

          if (!activityId) {
            throw new Error('Could not extract activity ID from response')
          }

          console.log('Extracted activity ID:', activityId)

          // Then create all sub-activities for this activity
          for (const subActivity of activity.subActivities) {
            console.log('Creating sub-activity:', subActivity.name)
            await apiClient.post(`/projects/${projectId}/activities/${activityId}/sub-activities`, {
              name: subActivity.name,
              satuan: subActivity.satuan || undefined,
              volumeKontrak: subActivity.volumeKontrak || undefined,
              volumeMC0: subActivity.volumeMC0 || undefined,
              bobotMC0: subActivity.bobotMC0 || undefined,
              weight: subActivity.weight,
            })
          }
        } catch (activityError) {
          console.error('Error creating activity:', activityError)
          throw activityError
        }
      }

      toast.success('Kegiatan berhasil ditambahkan')
      handleClose()
    } catch (error) {
      toast.error('Gagal menambahkan kegiatan')
      console.error('Error creating activity:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setActivities([
      {
        id: '1',
        name: '',
        subActivities: [
          { id: '1', name: '', satuan: '', volumeKontrak: 0, volumeMC0: 0, bobotMC0: 0, weight: 0 },
        ],
      },
    ])
    onClose()
  }

  const getRomanNumeral = (index: number) => {
    const numerals = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X']
    return numerals[index] || `${index + 1}`
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-h-[90vh] max-w-6xl overflow-y-auto rounded-2xl">
        {/* Header */}
        <div className="border-b border-[#eaecf0] px-6 pb-5 pt-5">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="h-5 w-5 text-gray-900" />
                <span className="text-lg font-medium text-gray-900">Tambah Pekerjaan</span>
              </div>
              <Button variant="ghost" size="sm" onClick={handleClose} className="h-5 w-5 p-0">
                <X className="h-5 w-5 text-gray-500" />
              </Button>
            </DialogTitle>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-4">
          <div className="space-y-4">
            {/* Activity Sections */}
            <div className="rounded-2xl border border-gray-200 p-4">
              {activities.map((activity, activityIndex) => (
                <div key={activity.id} className="mb-3 last:mb-0">
                  <div className="rounded-2xl bg-gray-100 p-3">
                    {/* Activity Header */}
                    <div className="mb-3 flex items-end justify-between gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 rounded border-b border-gray-200 bg-white px-3 py-2">
                          <span className="text-base font-medium text-gray-700">
                            {getRomanNumeral(activityIndex)}.
                          </span>
                          <Input
                            value={activity.name}
                            onChange={e => updateActivity(activity.id, 'name', e.target.value)}
                            placeholder="Isi Pekerjaan"
                            className="border-0 bg-transparent text-base text-gray-500 focus:ring-0"
                          />
                        </div>
                      </div>
                      {activities.length > 1 && (
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => removeActivity(activity.id)}
                          className="h-8 bg-red-500 px-4 py-2 text-white hover:bg-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>

                    {/* Sub Activities */}
                    <div className="space-y-2">
                      {activity.subActivities.map((subActivity, subIndex) => (
                        <div key={subActivity.id} className="flex items-end gap-2">
                          {/* Kegiatan */}
                          <div className="w-[300px]">
                            {subIndex === 0 && (
                              <label className="mb-1 block text-sm font-medium text-gray-700">
                                Kegiatan
                              </label>
                            )}
                            <Input
                              value={subActivity.name}
                              onChange={e =>
                                updateSubActivity(
                                  activity.id,
                                  subActivity.id,
                                  'name',
                                  e.target.value
                                )
                              }
                              placeholder="Isi Kegiatan"
                              className="rounded-lg border-gray-200 text-sm shadow-sm"
                            />
                          </div>

                          {/* Fields Row */}
                          <div className="flex flex-1 gap-1.5">
                            {/* Satuan */}
                            <div className="w-[120px]">
                              {subIndex === 0 && (
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Satuan
                                </label>
                              )}
                              <Input
                                value={subActivity.satuan}
                                onChange={e =>
                                  updateSubActivity(
                                    activity.id,
                                    subActivity.id,
                                    'satuan',
                                    e.target.value
                                  )
                                }
                                placeholder="Satuan"
                                className="rounded-lg border-gray-200 text-sm shadow-sm"
                              />
                            </div>

                            {/* Volume Kontrak */}
                            <div className="w-[130px]">
                              {subIndex === 0 && (
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Volume Kontrak
                                </label>
                              )}
                              <Input
                                type="number"
                                value={subActivity.volumeKontrak}
                                onChange={e =>
                                  updateSubActivity(
                                    activity.id,
                                    subActivity.id,
                                    'volumeKontrak',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Volume Kontrak"
                                className="rounded-lg border-gray-200 text-sm shadow-sm"
                              />
                            </div>

                            {/* Bobot (%) */}
                            <div className="w-[110px]">
                              {subIndex === 0 && (
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Bobot (%)
                                </label>
                              )}
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subActivity.weight}
                                onChange={e =>
                                  updateSubActivity(
                                    activity.id,
                                    subActivity.id,
                                    'weight',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Bobot (%)"
                                className="rounded-lg border-gray-200 text-sm shadow-sm"
                              />
                            </div>

                            {/* Volume MC 0 */}
                            <div className="w-[130px]">
                              {subIndex === 0 && (
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Volume MC 0
                                </label>
                              )}
                              <Input
                                type="number"
                                value={subActivity.volumeMC0}
                                onChange={e =>
                                  updateSubActivity(
                                    activity.id,
                                    subActivity.id,
                                    'volumeMC0',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Volume MC 0"
                                className="rounded-lg border-gray-200 text-sm shadow-sm"
                              />
                            </div>

                            {/* Bobot MC 0 (%) */}
                            <div className="w-[130px]">
                              {subIndex === 0 && (
                                <label className="mb-1 block text-sm font-medium text-gray-700">
                                  Bobot MC 0 (%)
                                </label>
                              )}
                              <Input
                                type="number"
                                min="0"
                                max="100"
                                step="0.1"
                                value={subActivity.bobotMC0}
                                onChange={e =>
                                  updateSubActivity(
                                    activity.id,
                                    subActivity.id,
                                    'bobotMC0',
                                    parseFloat(e.target.value) || 0
                                  )
                                }
                                placeholder="Bobot MC 0 (%)"
                                className="rounded-lg border-gray-200 text-sm shadow-sm"
                              />
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => addSubActivity(activity.id)}
                              className="h-8 w-8 border-blue-500 p-0 text-blue-500 hover:bg-blue-50"
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                            {activity.subActivities.length > 1 && (
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => removeSubActivity(activity.id, subActivity.id)}
                                className="h-8 w-8 bg-red-500 p-0 text-white hover:bg-red-600"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Weight Summary */}
                    <div className="mt-2 text-sm text-gray-600">
                      Total bobot sub kegiatan:{' '}
                      {activity.subActivities.reduce((sum, sa) => sum + sa.weight, 0).toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}

              {/* Add New Activity Button */}
              <Button
                type="button"
                onClick={addActivity}
                className="w-[300px] bg-blue-500 text-white hover:bg-blue-600"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Kebutuhan
              </Button>
            </div>

            {/* Actions */}
            <div className="flex justify-end border-t border-gray-200 pt-4">
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-[#ffc928] px-4 py-2.5 text-[#364878] hover:bg-[#e6b526]"
              >
                <Save className="mr-2 h-4 w-4" />
                {isLoading ? 'Menyimpan...' : 'Simpan'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
