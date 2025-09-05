'use client'

import { MaterialFlowTable } from '@/components/materials/material-flow-table'
import { useMaterials } from '@/hooks/useMaterialQueries'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Icons } from '@/components/ui/icons'
import { Button } from '@/components/ui/button'
import { useParams, useRouter } from 'next/navigation'

export default function MaterialFlowPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = params.id as string

  const { data: materials, isLoading } = useMaterials(projectId)

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex items-center space-x-2">
          <Icons.spinner className="h-6 w-6 animate-spin" />
          <span>Loading material flow data...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.back()}
            className="flex items-center space-x-2"
          >
            <Icons.arrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Material Flow</h1>
            <p className="mt-1 text-sm text-gray-600">Monitor daily material progress and status</p>
          </div>
        </div>
      </div>

      {/* Material Flow Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Icons.package className="h-5 w-5" />
            <span>Material Progress Tracking</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <MaterialFlowTable projectId={projectId} />
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {materials && materials.length > 0 && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icons.package className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Materials</p>
                  <p className="text-2xl font-bold text-gray-900">{materials.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icons.checkCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      materials.filter(m => {
                        const latestSchedule = m.schedules?.[m.schedules.length - 1]
                        return latestSchedule && latestSchedule.realisasiKumulatif >= m.volumeTarget
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <Icons.clock className="h-5 w-5 text-yellow-600" />
                <div>
                  <p className="text-sm font-medium text-gray-600">In Progress</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {
                      materials.filter(m => {
                        const latestSchedule = m.schedules?.[m.schedules.length - 1]
                        return latestSchedule && latestSchedule.realisasiKumulatif < m.volumeTarget
                      }).length
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
