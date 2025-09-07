'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { useProposals } from '@/hooks/useProposalQueries'
import { Plus, Search, Eye, Edit, Trash2 } from 'lucide-react'

export default function DaftarUsulan() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: proposalsData,
    isLoading,
    error,
  } = useProposals({
    page: currentPage,
    limit: 10,
    search: search || undefined,
    status: selectedStatus || undefined,
  })

  const proposals = proposalsData?.data || []
  const pagination = proposalsData?.pagination

  const handleAddProposal = () => {
    router.push('/tambah-usulan')
  }

  const handleViewProposal = (id: string) => {
    router.push(`/usulan/${id}`)
  }

  const handleEditProposal = (id: string) => {
    router.push(`/usulan/${id}/edit`)
  }

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      Draft: 'bg-gray-100 text-gray-800',
      Submitted: 'bg-blue-100 text-blue-800',
      Approved: 'bg-green-100 text-green-800',
      Rejected: 'bg-red-100 text-red-800',
    }
    return statusConfig[status as keyof typeof statusConfig] || 'bg-gray-100 text-gray-800'
  }

  const getPriorityBadge = (prioritas: string) => {
    const colors = {
      '1': 'bg-red-100 text-red-800',
      '2': 'bg-orange-100 text-orange-800',
      '3': 'bg-yellow-100 text-yellow-800',
      '4': 'bg-blue-100 text-blue-800',
      '5': 'bg-gray-100 text-gray-800',
    }
    return colors[prioritas as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="p-6">
          <p className="text-red-500">Error loading proposals: {error.message}</p>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div>
              <h1 className="text-lg font-medium text-gray-900">
                Sistem Informasi Geospasial Irigasi
              </h1>
              <div className="mt-1 flex items-center text-sm text-gray-500">
                <span className="text-blue-600">Daftar Usulan</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <Card className="rounded-2xl">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Daftar Usulan Kegiatan</CardTitle>
              <Button
                onClick={handleAddProposal}
                className="rounded-lg bg-yellow-400 text-blue-900 hover:bg-yellow-500"
              >
                <Plus className="mr-2 h-4 w-4" />
                Tambah Usulan
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Filters */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Cari daerah irigasi atau kategori..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="rounded-lg pl-10"
                />
              </div>

              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Semua Status</option>
                <option value="Draft">Draft</option>
                <option value="Submitted">Submitted</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>

              <select className="flex h-10 w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Semua Tahun</option>
                <option value="2025">2025</option>
                <option value="2024">2024</option>
              </select>
            </div>

            {/* Table */}
            {isLoading ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : proposals.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-gray-500">Tidak ada usulan ditemukan</p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border bg-white">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Tahun
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Prioritas
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Daerah Irigasi
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Outcome (Ha)
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Anggaran
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Readiness
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {proposals.map(proposal => (
                        <tr key={proposal.id} className="hover:bg-gray-50">
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.tahun}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getPriorityBadge(proposal.prioritas)}`}
                            >
                              P{proposal.prioritas}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.kategoriKegiatan}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.daerahIrigasi || '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.outcome?.toLocaleString() || '0'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.kebutuhanAnggaran
                              ? formatCurrency(proposal.kebutuhanAnggaran)
                              : '-'}
                          </td>
                          <td className="whitespace-nowrap px-6 py-4">
                            <span
                              className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${getStatusBadge(proposal.status)}`}
                            >
                              {proposal.status}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-900">
                            {proposal.readinessLevel}
                          </td>
                          <td className="space-x-2 whitespace-nowrap px-6 py-4 text-sm font-medium">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleViewProposal(proposal.id)}
                              className="rounded-lg"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditProposal(proposal.id)}
                              className="rounded-lg"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="rounded-lg text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {pagination && pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
                    <div className="flex flex-1 justify-between sm:hidden">
                      <Button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                        variant="outline"
                        className="rounded-lg"
                      >
                        Previous
                      </Button>
                      <Button
                        disabled={currentPage === pagination.totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                        variant="outline"
                        className="rounded-lg"
                      >
                        Next
                      </Button>
                    </div>
                    <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                      <div>
                        <p className="text-sm text-gray-700">
                          Showing{' '}
                          <span className="font-medium">
                            {(currentPage - 1) * pagination.limit + 1}
                          </span>{' '}
                          to{' '}
                          <span className="font-medium">
                            {Math.min(currentPage * pagination.limit, pagination.total)}
                          </span>{' '}
                          of <span className="font-medium">{pagination.total}</span> results
                        </p>
                      </div>
                      <div>
                        <nav className="relative z-0 inline-flex -space-x-px rounded-md shadow-sm">
                          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
                            page => (
                              <Button
                                key={page}
                                onClick={() => setCurrentPage(page)}
                                variant={currentPage === page ? 'default' : 'outline'}
                                className={`rounded-none first:rounded-l-lg last:rounded-r-lg ${
                                  currentPage === page ? 'bg-blue-500 text-white' : ''
                                }`}
                              >
                                {page}
                              </Button>
                            )
                          )}
                        </nav>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
