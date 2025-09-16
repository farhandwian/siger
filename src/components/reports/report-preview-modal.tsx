'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ReportPreviewModalProps {
  isOpen: boolean
  onClose: () => void
  report?: {
    id: string
    projectName: string
    satker: string
    kegiatan: string
    proyekPekerjaan: string
    weekNumber: number
    reportPeriod: string
    activities?: ActivityData[]
  }
}

interface ActivityData {
  id: string
  no: number
  uraian: string
  sat: string
  volume: number
  bobot: number
  realisasiMinggulalu: {
    volume: number
    bobot: number
  }
  targetMingguIni: number
  realisasiMingguIni: number
  status: 'Tidak Tercapai' | 'Tercapai' | 'Dalam Progress'
  kumulatifMingguIni: {
    volume: number
    bobot: number
  }
  persentaseItemPekerjaan: number
  persentaseGrafikProgress: number
  persentaseRencanaKumulatif: number
  statusKumulatif: string
  persentaseSeluruhPekerjaan: number
}

/**
 * Modal component for previewing weekly reports with detailed activity tracking
 * Based on Figma design with comprehensive table structure similar to UnifiedScheduleTable
 */
export function ReportPreviewModal({ isOpen, onClose, report }: ReportPreviewModalProps) {
  // Sample data for demonstration - replace with actual data
  const sampleActivities: ActivityData[] = [
    {
      id: '1',
      no: 1,
      uraian: 'PEKERJAAN PERSIAPAN',
      sat: '',
      volume: 0,
      bobot: 0,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0,
      realisasiMingguIni: 0,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 0, bobot: 0 },
      persentaseItemPekerjaan: 0,
      persentaseGrafikProgress: 0,
      persentaseRencanaKumulatif: 0,
      statusKumulatif: '',
      persentaseSeluruhPekerjaan: 0,
    },
    {
      id: '1-1',
      no: 0,
      uraian: 'Mobilisasi dan demobilisasi',
      sat: 'Ls',
      volume: 1.0,
      bobot: 1.174,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0.59,
      realisasiMingguIni: 0.5,
      status: 'Tidak Tercapai',
      kumulatifMingguIni: { volume: 0.5, bobot: 0.59 },
      persentaseItemPekerjaan: 50.0,
      persentaseGrafikProgress: 84.7,
      persentaseRencanaKumulatif: 50.0,
      statusKumulatif: 'Tercapai',
      persentaseSeluruhPekerjaan: 0.3,
    },
    {
      id: '1-2',
      no: 0,
      uraian: 'Stake out Trasa Saluran',
      sat: "m'",
      volume: 84797,
      bobot: 1.55,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0,
      realisasiMingguIni: 84587.58,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 84587.58, bobot: 1.55 },
      persentaseItemPekerjaan: 99.8,
      persentaseGrafikProgress: 100.0,
      persentaseRencanaKumulatif: 99.8,
      statusKumulatif: 'Tercapai',
      persentaseSeluruhPekerjaan: 0.8,
    },
    {
      id: '1-3',
      no: 0,
      uraian: 'Pasangan Patok',
      sat: 'Bh',
      volume: 3.07,
      bobot: 0.068,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0,
      realisasiMingguIni: 1.455,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 1.455, bobot: 0.07 },
      persentaseItemPekerjaan: 47.4,
      persentaseGrafikProgress: 100.0,
      persentaseRencanaKumulatif: 100.0,
      statusKumulatif: 'Tercapai',
      persentaseSeluruhPekerjaan: 0.03,
    },
    {
      id: '2',
      no: 2,
      uraian: 'SISTEM MANAJEMEN KESELAMATAN KERJA',
      sat: '',
      volume: 0,
      bobot: 0,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0,
      realisasiMingguIni: 0,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 0, bobot: 0 },
      persentaseItemPekerjaan: 0,
      persentaseGrafikProgress: 0,
      persentaseRencanaKumulatif: 0,
      statusKumulatif: '',
      persentaseSeluruhPekerjaan: 0,
    },
    {
      id: '2-1',
      no: 0,
      uraian: 'Sistem Manajemen Keselamatan Kerja',
      sat: 'Ls',
      volume: 1.0,
      bobot: 1.174,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0.01,
      realisasiMingguIni: 1.01,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 1.01, bobot: 1.174 },
      persentaseItemPekerjaan: 100.0,
      persentaseGrafikProgress: 100.0,
      persentaseRencanaKumulatif: 100.0,
      statusKumulatif: 'Tercapai',
      persentaseSeluruhPekerjaan: 0.6,
    },
    {
      id: '3',
      no: 3,
      uraian: 'PEKERJAAN NORMALISASI SALURAN',
      sat: '',
      volume: 0,
      bobot: 0,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 0,
      realisasiMingguIni: 0,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 0, bobot: 0 },
      persentaseItemPekerjaan: 0,
      persentaseGrafikProgress: 0,
      persentaseRencanaKumulatif: 0,
      statusKumulatif: '',
      persentaseSeluruhPekerjaan: 0,
    },
    {
      id: '3-1',
      no: 0,
      uraian: 'Galian Tanah Manual',
      sat: 'm³',
      volume: 125436.5,
      bobot: 22.876,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 12543.65,
      realisasiMingguIni: 8562.4,
      status: 'Tidak Tercapai',
      kumulatifMingguIni: { volume: 8562.4, bobot: 1.56 },
      persentaseItemPekerjaan: 6.8,
      persentaseGrafikProgress: 68.3,
      persentaseRencanaKumulatif: 10.0,
      statusKumulatif: 'Tidak Tercapai',
      persentaseSeluruhPekerjaan: 0.8,
    },
    {
      id: '3-2',
      no: 0,
      uraian: 'Galian Tanah Mekanis',
      sat: 'm³',
      volume: 89765.2,
      bobot: 16.432,
      realisasiMinggulalu: { volume: 0, bobot: 0 },
      targetMingguIni: 8976.52,
      realisasiMingguIni: 12543.8,
      status: 'Tercapai',
      kumulatifMingguIni: { volume: 12543.8, bobot: 2.29 },
      persentaseItemPekerjaan: 14.0,
      persentaseGrafikProgress: 139.7,
      persentaseRencanaKumulatif: 10.0,
      statusKumulatif: 'Tercapai',
      persentaseSeluruhPekerjaan: 1.2,
    },
  ]

  const activities = sampleActivities

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
          {/* Report Information Section */}
          <div className="flex-shrink-0 p-6 pb-4">
            <div className="grid grid-cols-1 gap-6 rounded-lg border border-gray-200 bg-gray-50 p-6 lg:grid-cols-2">
              {/* Left Column */}
              <div className="space-y-3">
                <div className="flex items-start gap-4">
                  <span className="min-w-[120px] text-sm font-medium text-gray-700">SATKER</span>
                  <span className="text-sm text-gray-600">:</span>
                  <span className="text-sm text-gray-900">
                    {report?.satker || 'Dinas PU Kabupaten Lampung Tengah'}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="min-w-[120px] text-sm font-medium text-gray-700">KEGIATAN</span>
                  <span className="text-sm text-gray-600">:</span>
                  <span className="text-sm text-gray-900">
                    {report?.kegiatan || 'Irigasi dan Rawa II'}
                  </span>
                </div>
                <div className="flex items-start gap-4">
                  <span className="min-w-[120px] text-sm font-medium text-gray-700">
                    PROYEK PEKERJAAN
                  </span>
                  <span className="text-sm text-gray-600">:</span>
                  <span className="text-sm text-gray-900">
                    {report?.proyekPekerjaan ||
                      'Rehabilitasi/Peningkatan Jaringan Irigasi DIDIRI di Kabupaten Lampung Tengah dan Kabupaten Lampung Timur'}
                  </span>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-3 lg:text-right">
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <span className="text-sm font-medium text-gray-700">MINGGU KE :</span>
                  <span className="rounded border bg-white px-3 py-1 text-sm font-medium text-gray-900">
                    {report?.weekNumber || '2'} (Dua)
                  </span>
                </div>
                <div className="flex items-center justify-between gap-4 lg:justify-end">
                  <span className="text-sm font-medium text-gray-700">PERIODE :</span>
                  <span className="rounded border bg-white px-3 py-1 text-sm font-medium text-gray-900">
                    {report?.reportPeriod || '14 Agustus - 20 Agustus 2025'}
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
                          colSpan={6}
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
                      {activities.map(activity => (
                        <tr
                          key={activity.id}
                          className={cn(
                            'border-b border-gray-200 hover:bg-gray-50',
                            activity.no === 0 ? 'bg-gray-25' : 'bg-white'
                          )}
                        >
                          {/* NO */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.no > 0 ? activity.no : 'SUB'}
                          </td>

                          {/* URAIAN */}
                          <td
                            className={cn(
                              'border-r border-gray-200 px-3 py-3 text-left',
                              activity.no === 0
                                ? 'pl-8 text-sm font-normal'
                                : 'text-sm font-semibold'
                            )}
                          >
                            {activity.uraian || 'TEST URAIAN'}
                          </td>

                          {/* SAT */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.sat}
                          </td>

                          {/* VOLUME */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.volume > 0 ? activity.volume.toLocaleString() : ''}
                          </td>

                          {/* BOBOT */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.bobot > 0 ? activity.bobot.toFixed(3) : ''}
                          </td>

                          {/* REALISASI s/d MINGGU LALU */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.realisasiMinggulalu.volume > 0
                              ? activity.realisasiMinggulalu.volume.toFixed(2)
                              : '-'}
                          </td>

                          {/* TARGET MINGGU INI */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.targetMingguIni > 0
                              ? activity.targetMingguIni.toFixed(2)
                              : '-'}
                          </td>

                          {/* REALISASI MINGGU INI */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.realisasiMingguIni > 0
                              ? activity.realisasiMingguIni.toFixed(2)
                              : '-'}
                          </td>

                          {/* STATUS */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.no > 0 ? (
                              ''
                            ) : (
                              <span
                                className={cn(
                                  'rounded px-2 py-1 text-xs font-medium',
                                  activity.status === 'Tercapai'
                                    ? 'bg-green-100 text-green-800'
                                    : activity.status === 'Tidak Tercapai'
                                      ? 'bg-red-100 text-red-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                )}
                              >
                                {activity.status}
                              </span>
                            )}
                          </td>

                          {/* KUMULATIF s/d MINGGU INI */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.kumulatifMingguIni.volume > 0
                              ? activity.kumulatifMingguIni.volume.toFixed(2)
                              : '-'}
                          </td>

                          {/* REALISASI s/d MINGGU LALU */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.realisasiMinggulalu.bobot > 0
                              ? activity.realisasiMinggulalu.bobot.toFixed(2)
                              : '-'}
                          </td>

                          {/* ITEM PEKERJAAN */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.persentaseItemPekerjaan > 0
                              ? activity.persentaseItemPekerjaan.toFixed(1) + '%'
                              : '-'}
                          </td>

                          {/* GRAFIK PEMENUHAN PROGRESS */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.persentaseGrafikProgress > 0
                              ? activity.persentaseGrafikProgress.toFixed(1) + '%'
                              : '-'}
                          </td>

                          {/* RENCANA KOMULATIF PEKERJAAN */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.persentaseRencanaKumulatif > 0
                              ? activity.persentaseRencanaKumulatif.toFixed(1) + '%'
                              : '-'}
                          </td>

                          {/* STATUS KOMULATIF */}
                          <td className="border-r border-gray-200 px-2 py-3 text-center">
                            {activity.statusKumulatif && activity.no === 0 ? (
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

                          {/* SELURUH PEKERJAAN */}
                          <td className="px-2 py-3 text-center">
                            {activity.persentaseSeluruhPekerjaan > 0
                              ? activity.persentaseSeluruhPekerjaan.toFixed(1) + '%'
                              : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Progress Bar at Bottom */}
              <div className="flex-shrink-0 border-t border-gray-200 p-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">Progress Keseluruhan:</span>
                  <div className="h-2 flex-1 rounded-full bg-gray-200">
                    <div className="h-2 w-[3%] rounded-full bg-[#ffc928] transition-all duration-300" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">3.0%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
