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
    activities?: ReportActivity[]
  }
}

interface ReportActivity {
  id: string
  name: string
  subActivities?: ReportSubActivity[]
}

interface ReportSubActivity {
  id: string
  name: string
  sat: string
  volume: number
  weight: number
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
  const sampleActivities: ReportActivity[] = [
    {
      id: '1',
      name: 'PEKERJAAN PERSIAPAN',
      subActivities: [
        {
          id: '1-1',
          name: 'Mobilisasi dan demobilisasi',
          sat: 'Ls',
          volume: 1.0,
          weight: 1.174,
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
          name: 'Stake out Trasa Saluran',
          sat: "m'",
          volume: 84797,
          weight: 1.55,
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
          name: 'Pasangan Patok',
          sat: 'Bh',
          volume: 3.07,
          weight: 0.068,
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
      ],
    },
    {
      id: '2',
      name: 'SISTEM MANAJEMEN KESELAMATAN KERJA',
      subActivities: [
        {
          id: '2-1',
          name: 'Sistem Manajemen Keselamatan Kerja',
          sat: 'Ls',
          volume: 1.0,
          weight: 1.174,
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
      ],
    },
    {
      id: '3',
      name: 'PEKERJAAN NORMALISASI SALURAN',
      subActivities: [
        {
          id: '3-1',
          name: 'Galian Tanah Manual',
          sat: 'm³',
          volume: 125436.5,
          weight: 22.876,
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
          name: 'Galian Tanah Mekanis',
          sat: 'm³',
          volume: 89765.2,
          weight: 16.432,
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
      ],
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
                      {activities?.map(activity => (
                        <React.Fragment key={activity.id}>
                          {/* Main Activity Row */}
                          <tr className="border-b border-gray-200 bg-gray-50">
                            <td className="border-r border-gray-200 px-2 py-3 text-center font-semibold">
                              {(() => {
                                // convert 1..n to Roman numerals (supports up to 3999)
                                const toRoman = (num: number) => {
                                  if (num <= 0) return ''
                                  const map: [string, number][] = [
                                    ['M', 1000],
                                    ['CM', 900],
                                    ['D', 500],
                                    ['CD', 400],
                                    ['C', 100],
                                    ['XC', 90],
                                    ['L', 50],
                                    ['XL', 40],
                                    ['X', 10],
                                    ['IX', 9],
                                    ['V', 5],
                                    ['IV', 4],
                                    ['I', 1],
                                  ]
                                  let n = Math.floor(num)
                                  let res = ''
                                  for (const [roman, val] of map) {
                                    while (n >= val) {
                                      res += roman
                                      n -= val
                                    }
                                  }
                                  return res
                                }

                                return toRoman(activities.indexOf(activity) + 1)
                              })()}
                            </td>
                            <td className="border-r border-gray-200 px-3 py-3 text-left text-sm font-semibold">
                              {activity.name}
                            </td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center"></td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center"></td>
                            <td className="border-r border-gray-200 px-2 py-3 text-center"></td>
                            {/* Fill remaining 11 columns with empty cells to keep grid aligned */}
                            {Array.from({ length: 11 }).map((_, idx) => (
                              <td
                                key={`empty-${activity.id}-${idx}`}
                                className="border-r border-gray-200 px-2 py-3 text-center"
                              ></td>
                            ))}
                          </tr>

                          {/* Sub Activities - Dynamic rows */}
                          {activity.subActivities?.map(subActivity => (
                            <React.Fragment key={subActivity.id}>
                              {/* First Row - KEMAJUAN PEKERJAAN */}
                              <tr className="border-b border-gray-200">
                                <td
                                  rowSpan={2}
                                  className="border-r border-gray-200 px-2 py-3 text-center"
                                >
                                  {activity.subActivities.indexOf(subActivity) + 1}
                                </td>
                                <td
                                  rowSpan={2}
                                  className="border-r border-gray-200 px-3 py-3 pl-8 text-left text-sm font-normal"
                                >
                                  {subActivity.name}
                                </td>
                                <td
                                  rowSpan={2}
                                  className="border-r border-gray-200 px-2 py-3 text-center"
                                >
                                  {subActivity.sat}
                                </td>
                                <td
                                  rowSpan={2}
                                  className="border-r border-gray-200 px-2 py-3 text-center"
                                >
                                  {subActivity.volume > 0
                                    ? subActivity.volume.toLocaleString()
                                    : ''}
                                </td>
                                <td
                                  rowSpan={2}
                                  className="border-r border-gray-200 px-2 py-3 text-center"
                                >
                                  {subActivity.weight > 0 ? subActivity.weight.toFixed(3) : ''}
                                </td>

                                {/* REALISASI s/d MINGGU LALU (volume) */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.realisasiMinggulalu.volume > 0
                                    ? subActivity.realisasiMinggulalu.volume.toFixed(2)
                                    : '-'}
                                </td>
                                {/* TARGET MINGGU INI */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.targetMingguIni > 0
                                    ? subActivity.targetMingguIni.toFixed(2)
                                    : '-'}
                                </td>
                                {/* REALISASI MINGGU INI */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.realisasiMingguIni > 0
                                    ? subActivity.realisasiMingguIni.toFixed(2)
                                    : '-'}
                                </td>
                                {/* STATUS */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  <span
                                    className={cn(
                                      'rounded px-2 py-1 text-xs font-medium',
                                      subActivity.status === 'Tercapai'
                                        ? 'bg-green-100 text-green-800'
                                        : subActivity.status === 'Tidak Tercapai'
                                          ? 'bg-red-100 text-red-800'
                                          : 'bg-yellow-100 text-yellow-800'
                                    )}
                                  >
                                    {subActivity.status}
                                  </span>
                                </td>
                                {/* KUMULATIF s/d MINGGU INI (volume) */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.kumulatifMingguIni.volume > 0
                                    ? subActivity.kumulatifMingguIni.volume.toFixed(2)
                                    : '-'}
                                </td>
                                {/* REALISASI s/d MINGGU LALU (bobot) - First column under % TERHADAP */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.kumulatifMingguIni.bobot > 0
                                    ? subActivity.kumulatifMingguIni.bobot.toFixed(2)
                                    : '-'}
                                </td>
                                {/* ITEM PEKERJAAN % */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.persentaseItemPekerjaan > 0
                                    ? subActivity.persentaseItemPekerjaan.toFixed(1) + '%'
                                    : '-'}
                                </td>
                                {/* GRAFIK PEMENUHAN PROGRESS % */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.persentaseGrafikProgress > 0
                                    ? subActivity.persentaseGrafikProgress.toFixed(1) + '%'
                                    : '-'}
                                </td>
                                {/* RENCANA KOMULATIF PEKERJAAN % */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.persentaseRencanaKumulatif > 0
                                    ? subActivity.persentaseRencanaKumulatif.toFixed(1) + '%'
                                    : '-'}
                                </td>
                                {/* STATUS KOMULATIF */}
                                <td className="border-r border-gray-200 px-2 py-3 text-center">
                                  {subActivity.statusKumulatif ? (
                                    <span
                                      className={cn(
                                        'rounded px-2 py-1 text-xs font-medium',
                                        subActivity.statusKumulatif === 'Tercapai'
                                          ? 'bg-green-100 text-green-800'
                                          : 'bg-red-100 text-red-800'
                                      )}
                                    >
                                      {subActivity.statusKumulatif}
                                    </span>
                                  ) : (
                                    '-'
                                  )}
                                </td>
                                {/* SELURUH PEKERJAAN % */}
                                <td className="px-2 py-3 text-center">
                                  {subActivity.persentaseSeluruhPekerjaan > 0
                                    ? subActivity.persentaseSeluruhPekerjaan.toFixed(1) + '%'
                                    : '-'}
                                </td>
                              </tr>
                              {/* Second Row - % TERHADAP */}
                              <tr className="border-b border-gray-200"></tr>
                            </React.Fragment>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
