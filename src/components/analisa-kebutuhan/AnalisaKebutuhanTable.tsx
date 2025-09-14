'use client'

import React, { useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { CalendarIcon } from '@/components/ui/icons'
import { Settings2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { format } from 'date-fns'

// Type definitions for the data structure
interface TenagaKerja {
  role: string
  jumlah: string
  stokHarian: string
  terpasang: string
  totalStokHariIni: string
}

interface Bahan {
  item: string
  jumlah: string
  stokHarian: string
  terpasang: string
  totalStokHariIni: string
}

interface Alat {
  item: string
  jumlah: string
  stokHarian: string
  terpasang: string
  totalStokHariIni: string
}

interface SubActivity {
  name: string
  Target: string
  KebutuhanTenagaKerja?: TenagaKerja[]
  KebutuhanBahan?: Bahan[]
  KebutuhanAlat?: Alat[]
}

interface Activity {
  name: string
  subActivities: SubActivity[]
}

interface TableData {
  Kegiatan: Activity[]
}

// Dummy data following the suggested structure
const dummyData: TableData = {
  Kegiatan: [
    {
      name: 'I. PEKERJAAN PERSIAPAN',
      subActivities: [
        {
          name: 'Mobilisasi dan demobilisasi',
          Target: '648,77 m³/Minggu',
          KebutuhanTenagaKerja: [
            {
              role: 'Pekerja',
              jumlah: '1 Orang/Hari',
              stokHarian: '100%',
              terpasang: '100%',
              totalStokHariIni: '0%',
            },
            {
              role: 'Tukang',
              jumlah: '1 Orang/Hari',
              stokHarian: '97%',
              terpasang: '95%',
              totalStokHariIni: '-5%',
            },
            {
              role: 'Mandor',
              jumlah: '1 Orang/Hari',
              stokHarian: '103%',
              terpasang: '102%',
              totalStokHariIni: '+3%',
            },
          ],
          KebutuhanBahan: [
            {
              item: 'Batu',
              jumlah: '847 m³/Hari',
              stokHarian: '98%',
              terpasang: '99%',
              totalStokHariIni: '-2%',
            },
          ],
          KebutuhanAlat: [
            {
              item: 'Stamper Smooth Drum 1,5 Ton',
              jumlah: '0.09 Unit/Hari',
              stokHarian: '105%',
              terpasang: '104%',
              totalStokHariIni: '+5%',
            },
          ],
        },
        {
          name: 'Stake out Trase Saluran',
          Target: '22,77 m³/Minggu',
        },
        {
          name: 'Pasangan Patok',
          Target: '500,77 m³/Minggu',
        },
      ],
    },
    {
      name: 'II. SISTEM MANAJEMEN KESELAMATAN KONSTRUKSI',
      subActivities: [
        {
          name: 'Sistem Manajemen Keselamatan Konstruksi',
          Target: '500,77 m³/Minggu',
          KebutuhanTenagaKerja: [
            {
              role: 'Pekerja',
              jumlah: '6 Orang/Minggu',
              stokHarian: '102%',
              terpasang: '103%',
              totalStokHariIni: '+3%',
            },
            {
              role: 'Tukang',
              jumlah: '3 Orang/Minggu',
              stokHarian: '98%',
              terpasang: '96%',
              totalStokHariIni: '-4%',
            },
          ],
        },
      ],
    },
  ],
}

interface AnalisaKebutuhanTableProps {
  projectId: string
}

export default function AnalisaKebutuhanTable({ projectId }: AnalisaKebutuhanTableProps) {
  // State for date filter
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // Handler for date selection
  const handleDateSelect = (date: Date | { from?: Date; to?: Date } | undefined) => {
    if (date instanceof Date) {
      setSelectedDate(date)
    } else if (date && 'from' in date && date.from) {
      setSelectedDate(date.from)
    } else {
      setSelectedDate(undefined)
    }
  }

  return (
    <div className="w-full space-y-4">
      {/* Filter Section */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Create Analysis Button */}
            <Button className="flex items-center gap-2 bg-[#ffc928] font-medium text-[#364878] shadow-sm hover:bg-[#ffc928]/90">
              <Settings2 className="h-5 w-5" />
              Buat Analisa Kebutuhan
            </Button>

            {/* Date Picker */}
            <div className="w-[447px]">
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      'w-full justify-start border-gray-200 bg-white text-left font-normal shadow-sm',
                      !selectedDate && 'text-gray-500'
                    )}
                  >
                    <CalendarIcon className="mr-2 h-5 w-5 text-gray-400" />
                    {selectedDate ? format(selectedDate, 'dd MMMM yyyy') : 'Select'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar mode="single" selected={selectedDate} onSelect={handleDateSelect} />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table Section */}
      <Card className="w-full rounded-2xl">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] border-collapse text-xs">
              {/* Table Header */}
              <thead>
                <tr>
                  <th className="w-[225px] border border-gray-200 bg-gray-50 p-3 text-center font-bold text-gray-900">
                    Kegiatan
                  </th>
                  <th className="w-[236px] border border-gray-200 bg-gray-50 p-3 text-center font-bold text-gray-900">
                    Kebutuhan Kegiatan
                  </th>
                  <th className="w-[159px] border border-gray-200 bg-[#364878] p-3 text-center font-bold text-white">
                    Analisa Kebutuhan
                  </th>
                  <th className="w-[175px] border border-gray-200 bg-gray-50 p-3 text-center font-bold text-gray-900">
                    Stok Harian
                  </th>
                  <th className="w-[175px] border border-gray-200 bg-gray-50 p-3 text-center font-bold text-gray-900">
                    Stok Terpasang
                  </th>
                  <th className="w-[175px] border border-gray-200 bg-gray-50 p-3 text-center font-bold text-gray-900">
                    Total Stok Hari ini
                  </th>
                </tr>
                <tr>
                  <th className="border border-gray-200 bg-white"></th>
                  <th className="border border-gray-200 bg-white"></th>
                  <th className="border border-gray-200 bg-white p-2 text-center font-medium text-gray-800">
                    1
                  </th>
                  <th className="border border-gray-200 bg-white p-2 text-center font-medium text-gray-800">
                    1
                  </th>
                  <th className="border border-gray-200 bg-white p-2 text-center font-medium text-gray-800">
                    2
                  </th>
                  <th className="border border-gray-200 bg-white p-2 text-center font-medium text-gray-800">
                    3
                  </th>
                </tr>
              </thead>

              {/* Table Body - Dynamic Rendering */}
              <tbody>
                {dummyData.Kegiatan.map((activity, activityIndex) => (
                  <React.Fragment key={activityIndex}>
                    {/* Activity Category Header */}
                    <tr>
                      <td className="border border-gray-200 p-2 text-xs font-semibold text-gray-900 underline">
                        {activity.name}
                      </td>
                      <td className="border border-gray-200"></td>
                      <td className="border border-gray-200"></td>
                      <td className="border border-gray-200"></td>
                      <td className="border border-gray-200"></td>
                      <td className="border border-gray-200"></td>
                    </tr>

                    {/* Sub Activities */}
                    {activity.subActivities.map((subActivity, subIndex) => (
                      <React.Fragment key={`${activityIndex}-${subIndex}`}>
                        {/* Sub Activity Target Row */}
                        <tr
                          className={
                            subIndex > 0 &&
                            !subActivity.KebutuhanTenagaKerja &&
                            !subActivity.KebutuhanBahan &&
                            !subActivity.KebutuhanAlat
                              ? 'bg-gray-50'
                              : ''
                          }
                        >
                          <td className="border border-gray-200 p-6 font-semibold text-gray-900">
                            {subActivity.name}
                          </td>
                          <td className="border border-gray-200 p-2 pl-6 font-normal text-gray-800">
                            Target
                          </td>
                          <td className="border border-gray-200 p-2 font-medium text-gray-800">
                            {subActivity.Target}
                          </td>
                          <td className="border border-gray-200"></td>
                          <td className="border border-gray-200"></td>
                          <td className="border border-gray-200"></td>
                        </tr>

                        {/* Kebutuhan Tenaga Kerja Section */}
                        {subActivity.KebutuhanTenagaKerja &&
                          subActivity.KebutuhanTenagaKerja.length > 0 && (
                            <>
                              <tr>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200 p-2 pl-6 font-medium text-gray-800">
                                  Kebutuhan Tenaga Kerja
                                </td>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200"></td>
                              </tr>

                              {subActivity.KebutuhanTenagaKerja.map((tenaga, tenagaIndex) => (
                                <tr key={`tenaga-${tenagaIndex}`}>
                                  <td className="border border-gray-200"></td>
                                  <td className="border border-gray-200 p-2 pl-6 font-normal text-gray-800">
                                    {tenagaIndex + 1}. {tenaga.role}
                                  </td>
                                  <td className="border border-gray-200 p-2 font-medium text-gray-800">
                                    {tenaga.jumlah}
                                  </td>
                                  <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                    {tenaga.stokHarian}
                                  </td>
                                  <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                    {tenaga.terpasang}
                                  </td>
                                  <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                    {tenaga.totalStokHariIni}
                                  </td>
                                </tr>
                              ))}
                            </>
                          )}

                        {/* Kebutuhan Bahan Section */}
                        {subActivity.KebutuhanBahan && subActivity.KebutuhanBahan.length > 0 && (
                          <>
                            <tr>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200 p-2 pl-6 font-medium text-gray-800">
                                Kebutuhan Bahan
                              </td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                            </tr>

                            {subActivity.KebutuhanBahan.map((bahan, bahanIndex) => (
                              <tr key={`bahan-${bahanIndex}`}>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200 p-2 pl-6 font-normal text-gray-800">
                                  {bahanIndex + 1}. {bahan.item}
                                </td>
                                <td className="border border-gray-200 p-2 font-medium text-gray-800">
                                  {bahan.jumlah}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {bahan.stokHarian}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {bahan.terpasang}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {bahan.totalStokHariIni}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}

                        {/* Kebutuhan Alat Section */}
                        {subActivity.KebutuhanAlat && subActivity.KebutuhanAlat.length > 0 && (
                          <>
                            <tr>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200 p-2 pl-6 font-medium text-gray-800">
                                Kebutuhan Alat
                              </td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                              <td className="border border-gray-200"></td>
                            </tr>

                            {subActivity.KebutuhanAlat.map((alat, alatIndex) => (
                              <tr key={`alat-${alatIndex}`}>
                                <td className="border border-gray-200"></td>
                                <td className="border border-gray-200 p-2 pl-6 font-normal text-gray-800">
                                  {alatIndex + 1}. {alat.item}
                                </td>
                                <td className="border border-gray-200 p-2 font-medium text-gray-800">
                                  {alat.jumlah}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {alat.stokHarian}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {alat.terpasang}
                                </td>
                                <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                  {alat.totalStokHariIni}
                                </td>
                              </tr>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
