'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Edit3, Trash2 } from 'lucide-react'

interface LingkupUsulanSectionProps {
  proposalId: string
}

export function LingkupUsulanSection({ proposalId }: LingkupUsulanSectionProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [lingkupData, setLingkupData] = useState([
    {
      id: '1',
      namaLingkupUsulan: 'Saluran Sekunder - 1 KM',
      nomenkaltur: 'Saluran Sekunder 1',
      perimeter: 0,
      area: 0,
    },
  ])

  const handleAdd = () => {
    setShowAddForm(true)
  }

  const handleSaveNew = (data: any) => {
    // This would normally call the API
    setLingkupData([...lingkupData, { ...data, id: Date.now().toString() }])
    setShowAddForm(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-base font-medium text-gray-900">Lingkup Usulan</h3>
        <Button
          onClick={handleAdd}
          className="rounded-lg bg-yellow-400 text-blue-900 hover:bg-yellow-500"
        >
          <Plus className="mr-2 h-4 w-4" />
          Tambah Lingkup Usulan
        </Button>
      </div>

      {/* Table Header */}
      <div className="overflow-hidden rounded-xl border bg-white">
        <div className="bg-blue-600 text-white">
          <div className="grid grid-cols-4 gap-4 p-4">
            <div className="text-sm font-bold">Nama Lingkup Usulan</div>
            <div className="text-sm font-bold">Nomenkaltur</div>
            <div className="text-sm font-bold">Koordinat Lingkup Usulan</div>
            <div className="text-sm font-bold">Actions</div>
          </div>
        </div>

        {/* Table Content */}
        <div className="divide-y divide-gray-200">
          {lingkupData.map(item => (
            <div key={item.id} className="grid grid-cols-4 gap-4 p-4">
              <div className="space-y-1">
                <div className="rounded bg-gray-100 p-2 text-sm font-semibold">
                  {item.namaLingkupUsulan}
                </div>
                <div className="text-sm text-gray-700">Saluran Sekunder 1</div>
              </div>

              <div className="flex items-center">
                <Input
                  placeholder="Enter nomenkaltur"
                  className="rounded-lg text-sm"
                  defaultValue={item.nomenkaltur}
                />
              </div>

              <div className="space-y-2">
                <div className="mb-2 text-center text-sm font-semibold text-gray-700">
                  Koordinat Lingkup Usulan
                </div>
                <div className="flex h-32 items-center justify-center rounded-lg bg-gray-100 text-sm text-gray-500">
                  Map placeholder
                </div>
                <div className="space-y-2">
                  <div>
                    <Label htmlFor={`perimeter-${item.id}`} className="text-sm">
                      Perimeter
                    </Label>
                    <Input
                      id={`perimeter-${item.id}`}
                      type="number"
                      className="rounded-lg text-sm"
                      defaultValue={item.perimeter}
                    />
                  </div>
                  <div>
                    <Label htmlFor={`area-${item.id}`} className="text-sm">
                      Area
                    </Label>
                    <Input
                      id={`area-${item.id}`}
                      type="number"
                      className="rounded-lg text-sm"
                      defaultValue={item.area}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-start justify-center space-x-2 pt-8">
                <Button
                  size="sm"
                  className="rounded-lg bg-blue-500 p-2 text-white hover:bg-blue-600"
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  size="sm"
                  className="rounded-lg bg-gray-500 p-2 text-white hover:bg-gray-600"
                >
                  <Edit3 className="h-4 w-4" />
                </Button>
                <Button size="sm" className="rounded-lg bg-red-500 p-2 text-white hover:bg-red-600">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add Form Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Tambah Lingkup Usulan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="namaLingkup">Nama Lingkup Usulan</Label>
                <Input
                  id="namaLingkup"
                  placeholder="Masukkan nama lingkup usulan"
                  className="rounded-lg"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  onClick={() => setShowAddForm(false)}
                  variant="outline"
                  className="rounded-lg"
                >
                  Batal
                </Button>
                <Button
                  onClick={() =>
                    handleSaveNew({
                      namaLingkupUsulan: 'New Item',
                      nomenkaltur: '',
                      perimeter: 0,
                      area: 0,
                    })
                  }
                  className="rounded-lg bg-yellow-400 text-blue-900 hover:bg-yellow-500"
                >
                  Simpan
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
