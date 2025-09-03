'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, Activity, Users } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  description: string
  trend?: 'up' | 'down' | 'neutral'
  trendValue?: string
  icon: React.ComponentType<any>
}

const MetricCard = ({ title, value, description, trend, trendValue, icon: Icon }: MetricCardProps) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-600" />
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-600'
      case 'down':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && trendValue && (
          <div className={`flex items-center mt-2 text-xs ${getTrendColor()}`}>
            {getTrendIcon()}
            <span className="ml-1">{trendValue}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

interface DashboardMetricsProps {
  className?: string
}

export function DashboardMetrics({ className }: DashboardMetricsProps) {
  const metrics = [
    {
      title: 'Total Laporan',
      value: '2,345',
      description: 'Laporan bulan ini',
      trend: 'up' as const,
      trendValue: '+20.1% dari bulan lalu',
      icon: Activity,
    },
    {
      title: 'Pengguna Aktif',
      value: '1,234',
      description: 'Pengguna aktif minggu ini',
      trend: 'up' as const,
      trendValue: '+15.3% dari minggu lalu',
      icon: Users,
    },
    {
      title: 'Laporan Pending',
      value: '89',
      description: 'Menunggu review',
      trend: 'down' as const,
      trendValue: '-5.2% dari kemarin',
      icon: TrendingDown,
    },
    {
      title: 'Tingkat Penyelesaian',
      value: '94.5%',
      description: 'Laporan selesai',
      trend: 'up' as const,
      trendValue: '+2.1% dari target',
      icon: TrendingUp,
    },
  ]

  return (
    <div className={`grid gap-4 md:grid-cols-2 lg:grid-cols-4 ${className}`}>
      {metrics.map((metric, index) => (
        <MetricCard key={index} {...metric} />
      ))}
    </div>
  )
}
