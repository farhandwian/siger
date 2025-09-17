'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWeeklyReportDetails } from '@/hooks/useReports'
import type { WeeklyReportActivity } from '@/lib/schemas/reports'

interface ReportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  reportId: string | null
}

/**
 * Modal component for previewing weekly reports with detailed activity tracking
 * Based on Figma design with comprehensive table structure similar to UnifiedScheduleTable
 */
export function ReportPreviewModal({ isOpen, onClose, reportId }: ReportPreviewModalProps) {
  // Get report details using React Query
  const { data: reportData, isLoading, error } = useWeeklyReportDetails(reportId || null)
  
  // Extract activities directly from API response (no grouping needed as API handles this)
  const activities = reportData?.data?.activities || []

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="flex h-full max-h-[95vh] w-full max-w-[95vw] flex-col overflow-hidden bg-white p-0">
        {/* Modal Header */}
        <div className="flex flex-shrink-0 flex-row items-center justify-between border-b border-gray-200 px-6 py-5">
          <DialogHeader>
            <h2 className="text-lg font-semibold text-gray-900">Pratinjau Laporan Mingguan</h2>
          </DialogHeader>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0 hover:bg-gray-100"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Modal Content */}
        <div className="flex min-h-0 flex-1 flex-col">
          {/* Loading State */}
          {isLoading && (
            <div className="flex-1 p-6">
              <div className="space-y-4">
                <Skeleton className="h-4 w-64" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-64 w-full" />
              </div>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="flex-1 p-6">
              <Alert>
                <AlertDescription>Gagal memuat detail laporan. Silakan coba lagi.</AlertDescription>
              </Alert>
            </div>
          )}

          {/* Content State */}
          {reportData?.data && !isLoading && !error && (
            <>
              {/* Report Information Section */}
              <div className="flex-shrink-0 p-6 pb-4">
                <div className="grid grid-cols-1 gap-6 rounded-lg border border-gray-200 bg-gray-50 p-6 lg:grid-cols-2">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <span className="min-w-[120px] text-sm font-medium text-gray-700">
                        SATKER
                      </span>
                      <span className="text-sm text-gray-600">:</span>
                      <span className="text-sm text-gray-900">
                        {reportData.data.satker || 'Dinas PU Kabupaten Lampung Tengah'}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="min-w-[120px] text-sm font-medium text-gray-700">
                        KEGIATAN
                      </span>
                      <span className="text-sm text-gray-600">:</span>
                      <span className="text-sm text-gray-900">
                        {reportData.data.kegiatan || 'Irigasi dan Rawa II'}
                      </span>
                    </div>
                    <div className="flex items-start gap-4">
                      <span className="min-w-[120px] text-sm font-medium text-gray-700">
                        PROYEK PEKERJAAN
                      </span>
                      <span className="text-sm text-gray-600">:</span>
                      <span className="text-sm text-gray-900">
                        {reportData.data.proyekPekerjaan ||
                          'Rehabilitasi/Peningkatan Jaringan Irigasi DIDIRI di Kabupaten Lampung Tengah dan Kabupaten Lampung Timur'}
                      </span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3 lg:text-right">
                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                      <span className="text-sm font-medium text-gray-700">MINGGU KE :</span>
                      <span className="rounded border bg-white px-3 py-1 text-sm font-medium text-gray-900">
                        {reportData.data.weekNumber || '2'} (Dua)
                      </span>
                    </div>
                    <div className="flex items-center justify-between gap-4 lg:justify-end">
                      <span className="text-sm font-medium text-gray-700">PERIODE :</span>
                      <span className="rounded border bg-white px-3 py-1 text-sm font-medium text-gray-900">
                        {reportData.data.reportPeriod || '14 Agustus - 20 Agustus 2025'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

          {/* Table Section - Scrollable */}
          <div className="min-h-0 flex-1 px-6 pb-6">
            <div className="flex h-full max-h-full flex-col overflow-hidden rounded-lg border border-gray-200 bg-white">
              {/* Table Header - Fixed */}
              <div className="flex-shrink-0 bg-gray-600 text-white">
                <div className="px-4 py-3 text-center">
                  <h3 className="text-sm font-bold">Laporan Mingguan</h3>
                </div>
              </div>

              {/* Main Table Container with Scroll */}
              <div className="max-h-[60vh] min-h-0 flex-1 overflow-auto overscroll-contain">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1400px] border-collapse text-xs">
                    {/* Table Headers */}
                    <thead>
                      <tr className="border-b border-gray-300 bg-gray-100">
                        <th
                          rowSpan={2}
                          className="w-12 border-r border-gray-300 bg-gray-100 px-2 py-3 text-center font-bold"
                        >
                          NO
                        </th>
                        <th
                          rowSpan={2}
                          className="w-48 border-r border-gray-300 bg-gray-100 px-3 py-3 text-center font-bold"
                        >
                          URAIAN
                        </th>
                        <th
                          rowSpan={2}
                          className="w-16 border-r border-gray-300 bg-gray-100 px-2 py-3 text-center font-bold"
                        >
                          SAT
                        </th>
                        <th
                          rowSpan={2}
                          className="w-20 border-r border-gray-300 bg-gray-100 px-2 py-3 text-center font-bold"
                        >
                          VOLUME
                        </th>
                        <th
                          rowSpan={2}
                          className="w-20 border-r border-gray-300 bg-gray-100 px-2 py-3 text-center font-bold"
                        >
                          BOBOT (%)
                        </th>
                        <th
                          colSpan={5}
                          className="border-r border-gray-300 bg-gray-100 px-2 py-2 text-center font-bold"
                        >
                          KEMAJUAN PEKERJAAN
                        </th>
                        <th
                          colSpan={6}
                          className="w-20 border-r border-gray-300 bg-gray-100 px-2 py-3 text-center font-bold"
                        >
                          % TERHADAP
                        </th>
                      </tr>
                      <tr className="border-b border-gray-300 bg-gray-100">
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          REALISASI s/d MINGGU LALU
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          TARGET MINGGU INI
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          REALISASI MINGGU INI
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          STATUS
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          KUMULATIF s/d MINGGU INI
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          REALISASI s/d MINGGU LALU
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          ITEM PEKERJAAN
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          GRAFIK PEMENUHAN PROGRESS (%)
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          RENCANA KOMULATIF PEKERJAAN
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          STATUS KOMULATIF
                        </th>
                        <th className="border-r border-gray-300 bg-gray-200 px-2 py-2 text-center text-xs font-medium">
                          SELURUH PEKERJAAN
                        </th>
                      </tr>
                    </thead>

                    {/* Table Body */}
                    <tbody>
                      {activities.map((activity: WeeklyReportActivity, index: number) => (
                        <React.Fragment key={activity.id}>
                          {/* Single Row per Activity */}
                          <tr className="border-b border-gray-200">
                            <td className="border-r border-gray-200 px-2 py-3 text-center font-medium">
                              {activity.activityType === 'MAIN_ACTIVITY' 
                                ? activity.romanNumber || (index + 1).toString()
                                : activity.subNumber || (index + 1)
                              }
                            </td>
                            <td className={cn(
                              "border-r border-gray-200 px-3 py-3 text-left text-sm",
                              activity.activityType === 'MAIN_ACTIVITY' 
                                ? "font-semibold" 
                                : "font-normal pl-8"
                            )}>
                              {activity.name}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.sat || '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.volume != null && activity.volume > 0
                                ? activity.volume.toLocaleString()
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.bobot != null && activity.bobot > 0 ? activity.bobot.toFixed(3) : '-'}
                            </td>

                            {/* KEMAJUAN PEKERJAAN - Volume Columns */}
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.realisasiMinggulalu_volume != null && activity.realisasiMinggulalu_volume > 0
                                ? activity.realisasiMinggulalu_volume.toFixed(2)
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.targetMingguIni != null && activity.targetMingguIni > 0
                                ? activity.targetMingguIni.toFixed(2)
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.realisasiMingguIni != null && activity.realisasiMingguIni > 0
                                ? activity.realisasiMingguIni.toFixed(2)
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.status ? (
                                <span
                                  className={cn(
                                    'rounded px-2 py-1 text-xs font-medium',
                                    activity.status === 'TERCAPAI'
                                      ? 'bg-green-100 text-green-800'
                                      : activity.status === 'TIDAK_TERCAPAI'
                                        ? 'bg-red-100 text-red-800'
                                        : 'bg-yellow-100 text-yellow-800'
                                  )}
                                >
                                  {activity.status === 'TERCAPAI' ? 'Tercapai' :
                                   activity.status === 'TIDAK_TERCAPAI' ? 'Tidak Tercapai' :
                                   'Dalam Progress'}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.kumulatifMingguIni_volume != null && activity.kumulatifMingguIni_volume > 0
                                ? activity.kumulatifMingguIni_volume.toFixed(2)
                                : '-'}
                            </td>

                            {/* % TERHADAP - Percentage Columns */}
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.realisasiMinggulalu_bobot != null && activity.realisasiMinggulalu_bobot > 0
                                ? activity.realisasiMinggulalu_bobot.toFixed(2) + '%'
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.persentaseItemPekerjaan != null && activity.persentaseItemPekerjaan > 0
                                ? activity.persentaseItemPekerjaan.toFixed(1) + '%'
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.persentaseGrafikProgress != null && activity.persentaseGrafikProgress > 0
                                ? activity.persentaseGrafikProgress.toFixed(1) + '%'
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.persentaseRencanaKumulatif != null && activity.persentaseRencanaKumulatif > 0
                                ? activity.persentaseRencanaKumulatif.toFixed(1) + '%'
                                : '-'}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center">
                              {activity.statusKumulatif ? (
                                <span
                                  className={cn(
                                    'rounded px-2 py-1 text-xs font-medium',
                                    activity.statusKumulatif === 'Tercapai'
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-red-100 text-red-800'
                                  )}
                                >
                                  {activity.statusKumulatif}
                                </span>
                              ) : (
                                '-'
                              )}
                            </td>
                            <td className="px-2 py-3 text-center">
                              {activity.persentaseSeluruhPekerjaan != null && activity.persentaseSeluruhPekerjaan > 0
                                ? activity.persentaseSeluruhPekerjaan.toFixed(1) + '%'
                                : '-'}
                            </td>
                          </tr>
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
