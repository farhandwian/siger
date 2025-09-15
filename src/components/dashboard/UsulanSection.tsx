'use client'

import { Card, CardContent } from '@/components/ui/card'
import { useProposals } from '@/hooks/useProposalQueries'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { AlertTriangle } from 'lucide-react'

// Demo data matching Figma design
const USULAN_STATUS_DATA = {
  totalUsulan: { count: 22, label: 'Total Usulan' },
  menungguVerifikasi: { count: 5, label: 'Menunggu Verifikasi' },
  diterima: { count: 11, label: 'Diterima' },
  ditolak: { count: 6, label: 'Ditolak' },
}

const USULAN_DITERIMA_DATA = {
  totalAnggaran: { value: 'Rp. 145.987.140.000', label: 'Total Anggaran' },
  pembangunan: {
    totalUsulan: 4,
    totalOutcome: '150 Ha',
    label: 'Pembangunan',
  },
  rehabilitasi: {
    totalUsulan: 4,
    totalOutcome: '250 Ha',
    label: 'Rehabilitasi',
  },
  peningkatan: {
    totalUsulan: 3,
    totalOutcome: '200 Ha',
    label: 'Peningkatan',
  },
}

export function UsulanSection() {
  // Fetch all proposals to calculate statistics
  const { data, isLoading, isError, error } = useProposals({ limit: 1000 })

  if (isError) {
    return (
      <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-700">Usulan</h2>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error loading usulan data</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message || 'Failed to fetch proposal data'}
          </AlertDescription>
        </Alert>
      </div>
    )
  }

  // Calculate statistics from real data
  const proposals = data?.data || []

  const statusStats = {
    total: proposals.length,
    menungguVerifikasi: proposals.filter(p => p.status === 'Draft' || p.status === 'Submitted')
      .length,
    diterima: proposals.filter(p => p.status === 'Approved').length,
    ditolak: proposals.filter(p => p.status === 'Rejected').length,
  }

  return (
    <div className="space-y-6 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-gray-700">Usulan</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="relative rounded-2xl border border-gray-200 bg-blue-50 shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-2">
              <p className="text-sm leading-5 text-gray-500">Total Usulan</p>
              <p className="text-xl font-semibold text-gray-700">{statusStats.total} Usulan</p>
            </div>
            <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r-sm bg-blue-500" />
          </CardContent>
        </Card>
        <Card className="relative rounded-2xl border border-gray-200 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-2">
              <p className="text-sm leading-5 text-gray-500">Menunggu Verifikasi</p>
              <p className="text-xl font-semibold text-gray-700">
                {statusStats.menungguVerifikasi} Usulan
              </p>
            </div>
            <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r-sm bg-yellow-500" />
          </CardContent>
        </Card>
        <Card className="relative rounded-2xl border border-gray-200 bg-emerald-50 shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-2">
              <p className="text-sm leading-5 text-gray-500">Diterima</p>
              <p className="text-xl font-semibold text-gray-700">{statusStats.diterima} Usulan</p>
            </div>
            <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r-sm bg-emerald-500" />
          </CardContent>
        </Card>
        <Card className="relative rounded-2xl border border-gray-200 bg-red-50 shadow-sm">
          <CardContent className="p-5">
            <div className="space-y-2">
              <p className="text-sm leading-5 text-gray-500">Ditolak</p>
              <p className="text-xl font-semibold text-gray-700">{statusStats.ditolak} Usulan</p>
            </div>
            <div className="absolute left-0 top-1/2 h-[90px] w-1.5 -translate-y-1/2 rounded-r-sm bg-red-500" />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
