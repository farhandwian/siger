'use client'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useCreateMaterial, CreateMaterialData } from '@/hooks/useMaterialQueries'
import { useState } from 'react'

interface AddMaterialModalProps {
  projectId: string
  isOpen: boolean
  onClose: () => void
}

export function AddMaterialModal({ projectId, isOpen, onClose }: AddMaterialModalProps) {
  const [jenisMaterial, setJenisMaterial] = useState('')
  const createMaterial = useCreateMaterial()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!jenisMaterial.trim()) return

    try {
      const materialData: CreateMaterialData = {
        projectId,
        jenisMaterial: jenisMaterial.trim(),
        volumeSatuan: 'm3',
        volumeTarget: 0,
      }

      await createMaterial.mutateAsync(materialData)
      setJenisMaterial('')
      onClose()
    } catch (error) {
      console.error('Failed to create material:', error)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg font-medium text-gray-900">Tambah Material</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jenisMaterial" className="text-sm font-medium text-gray-700">
              Jenis Material
            </Label>
            <Input
              id="jenisMaterial"
              type="text"
              value={jenisMaterial}
              onChange={e => setJenisMaterial(e.target.value)}
              placeholder="Masukkan jenis material"
              className="w-full"
              required
            />
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createMaterial.isPending}
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={createMaterial.isPending || !jenisMaterial.trim()}
              className="bg-[#ffc928] text-[#364878] hover:bg-[#ffc928]/90"
            >
              {createMaterial.isPending ? 'Menyimpan...' : 'Simpan'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
