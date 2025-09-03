'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useMemo } from 'react'

// Placeholder untuk chart components - akan digantikan dengan Chart.js implementation
const PlaceholderChart = ({ 
  type, 
  height = 300 
}: { 
  type: 'bar' | 'line' | 'pie' | 'doughnut'
  height?: number 
}) => {
  return (
    <div 
      className="flex items-center justify-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"
      style={{ height }}
    >
      <div className="text-center">
        <div className="text-gray-400 text-lg font-medium">
          {type.charAt(0).toUpperCase() + type.slice(1)} Chart
        </div>
        <div className="text-gray-500 text-sm mt-1">
          Chart.js integration akan ditambahkan
        </div>
      </div>
    </div>
  )
}

interface ChartData {
  labels: string[]
  datasets: Array<{
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
  }>
}

interface ReportsChartProps {
  className?: string
}

export function ReportsChart({ className }: ReportsChartProps) {
  const data: ChartData = useMemo(() => ({
    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [
      {
        label: 'Laporan Masuk',
        data: [65, 59, 80, 81, 56, 89],
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgba(59, 130, 246, 1)',
      },
      {
        label: 'Laporan Selesai',
        data: [28, 48, 40, 79, 96, 85],
        backgroundColor: 'rgba(34, 197, 94, 0.5)',
        borderColor: 'rgba(34, 197, 94, 1)',
      },
    ],
  }), [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Tren Pelaporan</CardTitle>
        <CardDescription>
          Perbandingan laporan masuk vs selesai dalam 6 bulan terakhir
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlaceholderChart type="bar" height={300} />
      </CardContent>
    </Card>
  )
}

interface DepartmentChartProps {
  className?: string
}

export function DepartmentChart({ className }: DepartmentChartProps) {
  const data: ChartData = useMemo(() => ({
    labels: ['Kesehatan', 'Pendidikan', 'Infrastruktur', 'Sosial', 'Ekonomi'],
    datasets: [
      {
        label: 'Jumlah Laporan',
        data: [120, 89, 76, 45, 67],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
        ],
      },
    ],
  }), [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Laporan per Departemen</CardTitle>
        <CardDescription>
          Distribusi laporan berdasarkan departemen
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlaceholderChart type="doughnut" height={300} />
      </CardContent>
    </Card>
  )
}

interface PerformanceChartProps {
  className?: string
}

export function PerformanceChart({ className }: PerformanceChartProps) {
  const data: ChartData = useMemo(() => ({
    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
    datasets: [
      {
        label: 'Tingkat Penyelesaian (%)',
        data: [88, 92, 85, 94],
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        borderColor: 'rgba(16, 185, 129, 1)',
      },
    ],
  }), [])

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Performa Penyelesaian</CardTitle>
        <CardDescription>
          Tingkat penyelesaian laporan per minggu
        </CardDescription>
      </CardHeader>
      <CardContent>
        <PlaceholderChart type="line" height={200} />
      </CardContent>
    </Card>
  )
}
