'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Cloud, CheckCircle, Info, AlertTriangle, Radio, Timer } from 'lucide-react'

interface LiveUpdate {
  id: string
  type: 'weather' | 'report' | 'action_plan' | 'delay' | 'system'
  title: string
  description: string
  time: string
  isNew?: boolean
}

/**
 * Live Updates Component
 * Displays real-time updates including:
 * - Weather reports
 * - Daily progress reports
 * - Action plan changes
 * - System notifications
 */
export function LiveUpdates({ className }: { className?: string }) {
  // Demo updates data - in real app this would come from real-time API/WebSocket
  const updates: LiveUpdate[] = [
    {
      id: '1',
      type: 'weather',
      title: 'Laporan Cuaca',
      description: 'Terjadi hujan lebat di Kabupaten Mesuji',
      time: 'Baru Saja',
      isNew: true,
    },
    {
      id: '2',
      type: 'report',
      title: 'Laporan Harian',
      description: 'PPK IRA 1 melaporkan progress harian',
      time: 'Baru Saja',
      isNew: true,
    },
    {
      id: '3',
      type: 'weather',
      title: 'Laporan Cuaca',
      description: 'Terjadi hujan lebat di Kabupaten Lampung Timur',
      time: 'Baru Saja',
    },
    {
      id: '4',
      type: 'action_plan',
      title: 'Action Plan',
      description: 'PPK IRA 3 mengubah action plan',
      time: '3 Menit Lalu',
    },
    {
      id: '5',
      type: 'action_plan',
      title: 'Action Plan',
      description: 'PPK IRA 2 mengubah action plan',
      time: '3 Menit Lalu',
    },
    {
      id: '6',
      type: 'report',
      title: 'Laporan Harian',
      description: 'PPK IRA 1 melaporkan progress harian',
      time: '4 Menit lalu',
    },
    {
      id: '7',
      type: 'delay',
      title: 'Keterlambatan - DI Kewenangan Pusat',
      description: 'Peringatan Hujan Lebat',
      time: 'Baru Saja',
    },
  ]

  const getUpdateIcon = (type: string) => {
    switch (type) {
      case 'weather':
        return <Cloud className="h-4 w-4" />
      case 'report':
        return <CheckCircle className="h-4 w-4" />
      case 'action_plan':
        return <Info className="h-4 w-4" />
      case 'delay':
        return <AlertTriangle className="h-4 w-4" />
      default:
        return <Info className="h-4 w-4" />
    }
  }

  const getIconColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'text-blue-500'
      case 'report':
        return 'text-green-500'
      case 'action_plan':
        return 'text-orange-500'
      case 'delay':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const getBorderColor = (type: string) => {
    switch (type) {
      case 'weather':
        return 'border-l-blue-500'
      case 'report':
        return 'border-l-green-500'
      case 'action_plan':
        return 'border-l-orange-500'
      case 'delay':
        return 'border-l-red-500'
      default:
        return 'border-l-gray-500'
    }
  }

  return (
    <Card className={`rounded-2xl ${className}`}>
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="h-5 w-5" />
            <span className="text-base sm:text-lg">Live Update</span>
          </div>
          <Badge
            variant="secondary"
            className="flex h-5 w-5 items-center justify-center rounded-full p-0"
          >
            <span className="text-xs font-medium">3</span>
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-2">
          {updates.map(update => (
            <div
              key={update.id}
              className={`relative rounded-lg border border-l-4 bg-white p-3 transition-colors hover:bg-gray-50 ${getBorderColor(update.type)}`}
            >
              {/* New indicator */}
              {update.isNew && (
                <div className="absolute -right-1 -top-1">
                  <div className="h-2 w-2 rounded-full bg-red-500"></div>
                </div>
              )}

              <div className="flex items-start gap-3">
                {/* Icon */}
                <div className={`mt-0.5 ${getIconColor(update.type)}`}>
                  {getUpdateIcon(update.type)}
                </div>

                {/* Content */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h4 className="truncate text-sm font-medium text-gray-900">{update.title}</h4>
                    <span className="ml-2 whitespace-nowrap text-xs text-gray-500">
                      {update.time}
                    </span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">{update.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
