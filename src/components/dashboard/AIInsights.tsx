'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Wand2, ChevronRight } from 'lucide-react'

interface InsightCard {
  id: string
  title: string
  project: string
  time: string
  description: string
  type: 'milestone' | 'acceleration' | 'delay' | 'prediction'
}

/**
 * AI Insights Component
 * Displays AI-generated insights for project monitoring including:
 * - Milestone achievements
 * - Progress acceleration detection
 * - Delay predictions
 * - Risk assessments
 */
export function AIInsights({ className }: { className?: string }) {
  // Demo insights data - in real app this would come from AI analysis API
  const insights: InsightCard[] = [
    {
      id: '1',
      title: 'Milestone Achievement',
      project: 'D.I Rawa Mesuji - Rehabilitasi',
      time: '7 Menit Lalu',
      description:
        'Proyek Peningkatan jaringan Tersier Kab P berhasil menyelesaikan kegiatan penggalian tanah 2 minggu lebih cepat dari jadwal.',
      type: 'milestone',
    },
    {
      id: '2',
      title: 'Akselerasi Progress Terdeteksi',
      project: 'DIR Rawa Jitu - Rehabilitasi',
      time: '7 Menit Lalu',
      description:
        'Rata-rata progress proyek meningkat 15% dalam 2 minggu terakhir. Tren positif ini kemungkinan karena cuaca yang mendukung.',
      type: 'acceleration',
    },
    {
      id: '3',
      title: 'Prediksi keterlambatan',
      project: 'DIR Rawa Jitu - Pembangunan',
      time: '7 Menit Lalu',
      description:
        'Belum ada mobilisasi alat berat. Potensi keterlambatan pada kegiatan galian tanah.',
      type: 'delay',
    },
    {
      id: '4',
      title: 'Prediksi keterlambatan',
      project: 'D.I Gilingeng - Pembangunan',
      time: '7 Menit Lalu',
      description:
        'Rata-rata progress proyek meningkat 15% dalam 2 minggu terakhir. Tren positif ini kemungkinan karena cuaca yang mendukung dan peningkatan alokasi SDM di wilayah Jawa Barat dan Jawa Tengah.',
      type: 'prediction',
    },
  ]

  const getCardBorderColor = (type: string) => {
    switch (type) {
      case 'milestone':
        return 'border-l-4 border-l-green-500'
      case 'acceleration':
        return 'border-l-4 border-l-blue-500'
      case 'delay':
        return 'border-l-4 border-l-orange-500'
      case 'prediction':
        return 'border-l-4 border-l-purple-500'
      default:
        return 'border-l-4 border-l-gray-500'
    }
  }

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wand2 className="h-5 w-5" />
            <span className="text-base sm:text-lg">AI Insights</span>
          </div>
          <Button variant="outline" size="sm" className="h-7 w-7 p-0">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-4">
          {insights.map(insight => (
            <div
              key={insight.id}
              className={`rounded-lg border bg-white p-4 ${getCardBorderColor(insight.type)}`}
            >
              {/* Header */}
              <div className="space-y-1">
                <h4 className="text-sm font-medium text-gray-900">{insight.title}</h4>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{insight.project}</span>
                  <span>{insight.time}</span>
                </div>
              </div>

              {/* Description */}
              <p className="mt-3 text-xs leading-relaxed text-gray-600">{insight.description}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
