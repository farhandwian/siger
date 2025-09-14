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
import { useGroupedAnalisaKebutuhan } from '@/hooks/useGroupedAnalisaKebutuhan'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { BuatAnalisaKebutuhanModal } from './BuatAnalisaKebutuhanModal'

// Type definitions for the flexible data structure
interface CategoryItem {
  name: string // Unified naming (can be role, item, etc.)
  jumlah: string
  stokHarian: string
  terpasang: string
  totalStokHariIni: string
}

interface SubActivity {
  name: string
  Target: string
  // Flexible categories - Record<categoryName, items[]>
  categories?: Record<string, CategoryItem[]>
}

interface Activity {
  name: string
  subActivities: SubActivity[]
}

interface TableData {
  Kegiatan: Activity[]
}

// Dummy data following the flexible structure (commented out - now using real API)
/*
const dummyData: TableData = {
  Kegiatan: [
    {
      name: 'I. PEKERJAAN PERSIAPAN',
      subActivities: [
        {
          name: 'Mobilisasi dan demobilisasi',
          Target: '648,77 m³/Minggu',
          categories: {
            'Tenaga Kerja': [
              {
                name: 'Pekerja',
                jumlah: '1 Orang/Hari',
                stokHarian: '100%',
                terpasang: '100%',
                totalStokHariIni: '0%',
              },
              {
                name: 'Tukang',
                jumlah: '1 Orang/Hari',
                stokHarian: '97%',
                terpasang: '95%',
                totalStokHariIni: '-5%',
              },
              {
                name: 'Mandor',
                jumlah: '1 Orang/Hari',
                stokHarian: '103%',
                terpasang: '102%',
                totalStokHariIni: '+3%',
              },
            ],
            'Bahan': [
              {
                name: 'Batu',
                jumlah: '847 m³/Hari',
                stokHarian: '98%',
                terpasang: '99%',
                totalStokHariIni: '-2%',
              },
            ],
            'Alat': [
              {
                name: 'Stamper Smooth Drum 1,5 Ton',
                jumlah: '0.09 Unit/Hari',
                stokHarian: '105%',
                terpasang: '104%',
                totalStokHariIni: '+5%',
              },
            ],
          },
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
          categories: {
            'Tenaga Kerja': [
              {
                name: 'Pekerja',
                jumlah: '6 Orang/Minggu',
                stokHarian: '102%',
                terpasang: '103%',
                totalStokHariIni: '+3%',
              },
              {
                name: 'Tukang',
                jumlah: '3 Orang/Minggu',
                stokHarian: '98%',
                terpasang: '96%',
                totalStokHariIni: '-4%',
              },
            ],
          },
        },
      ],
    },
  ],
}
*/

interface AnalisaKebutuhanTableProps {
  projectId: string
}

export default function AnalisaKebutuhanTable({ projectId }: AnalisaKebutuhanTableProps) {
  // State for date filter
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date())

  // State for modal
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  // Format date for API call
  const formattedDate = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : undefined

  // Fetch grouped data from API
  const { data, isLoading, isError, error, refetch } = useGroupedAnalisaKebutuhan({
    projectId,
    tanggal: formattedDate,
  })

  // Render loading state
  const renderLoadingState = () => (
    <Card className="w-full rounded-2xl">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-6 w-1/3" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </CardContent>
    </Card>
  )

  // Render error state
  const renderErrorState = () => (
    <Card className="w-full rounded-2xl">
      <CardContent className="p-6">
        <Alert variant="destructive">
          <AlertTitle>Error Loading Data</AlertTitle>
          <AlertDescription>
            {(error as Error)?.message ||
              'An unexpected error occurred while loading the analysis data.'}
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )

  // Render empty state
  const renderEmptyState = () => (
    <Card className="w-full rounded-2xl">
      <CardContent className="p-6">
        <Alert>
          <AlertTitle>No Data Available</AlertTitle>
          <AlertDescription>
            No analysis data found for the selected date. Try selecting a different date or create
            new analysis entries.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  )

  return (
    <div className="w-full space-y-4">
      {/* Filter Section */}
      <Card className="rounded-2xl">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            {/* Create Analysis Button */}
            <Button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-[#ffc928] font-medium text-[#364878] shadow-sm hover:bg-[#ffc928]/90"
            >
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
      {isLoading && renderLoadingState()}
      {isError && renderErrorState()}
      {!isLoading && !isError && (!data || data.Kegiatan.length === 0) && renderEmptyState()}

      {!isLoading && !isError && data && data.Kegiatan.length > 0 && (
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
                  {data.Kegiatan.map((activity, activityIndex) => (
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
                              (!subActivity.categories ||
                                Object.keys(subActivity.categories).length === 0)
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

                          {/* Dynamic Categories Section */}
                          {subActivity.categories &&
                            Object.entries(subActivity.categories).map(
                              ([categoryName, categoryItems]) => (
                                <React.Fragment key={categoryName}>
                                  {/* Category Header Row */}
                                  <tr>
                                    <td className="border border-gray-200"></td>
                                    <td className="border border-gray-200 p-2 pl-6 font-medium text-gray-800">
                                      Kebutuhan {categoryName}
                                    </td>
                                    <td className="border border-gray-200"></td>
                                    <td className="border border-gray-200"></td>
                                    <td className="border border-gray-200"></td>
                                    <td className="border border-gray-200"></td>
                                  </tr>

                                  {/* Category Items */}
                                  {categoryItems.map((item, itemIndex) => (
                                    <tr key={`${categoryName}-${itemIndex}`}>
                                      <td className="border border-gray-200"></td>
                                      <td className="border border-gray-200 p-2 pl-6 font-normal text-gray-800">
                                        {itemIndex + 1}. {item.name}
                                      </td>
                                      <td className="border border-gray-200 p-2 font-medium text-gray-800">
                                        {item.jumlah}
                                      </td>
                                      <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                        {item.stokHarian}
                                      </td>
                                      <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                        {item.terpasang}
                                      </td>
                                      <td className="border border-gray-200 p-2 text-center font-medium text-gray-800">
                                        {item.totalStokHariIni}
                                      </td>
                                    </tr>
                                  ))}
                                </React.Fragment>
                              )
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
      )}

      {/* Modal for Creating Analisa Kebutuhan */}
      <BuatAnalisaKebutuhanModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        projectId={projectId}
        onSuccess={() => refetch()}
      />
    </div>
  )
}
