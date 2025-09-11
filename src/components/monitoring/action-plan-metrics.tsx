'use client'

import { Card, CardContent } from '@/components/ui/card'
import { ProjectWorkMap } from '@/components/monitoring/project-work-map'
import { useRouter } from 'next/navigation'

interface MetricCardProps {
  title: string
  value: string
  hasProgressBar?: boolean
  currentValue?: string
  maxValue?: string
}

const MetricCard: React.FC<MetricCardProps> = ({
  title,
  value,
  hasProgressBar = false,
  currentValue,
  maxValue,
}) => {
  return (
    <Card className="relative h-[90px] rounded-2xl border border-gray-200 bg-white shadow-sm">
      <CardContent className="flex h-full flex-col justify-center gap-1.5 p-4">
        <div className="flex w-full items-center justify-start">
          <p className="text-sm leading-5 text-gray-400">{title}</p>
        </div>
        {hasProgressBar ? (
          <>
            <div className="flex w-full items-end justify-start">
              <p className="flex-1 text-xl font-semibold leading-normal text-gray-700">
                {currentValue}
              </p>
              <p className="whitespace-nowrap text-sm leading-5 text-gray-400">{maxValue}</p>
            </div>
            <div className="relative h-2 w-full rounded bg-blue-200">
              <div className="absolute bottom-0 left-0 right-[40%] top-0 flex items-center justify-center">
                <div className="h-2 w-full rounded bg-blue-500" />
              </div>
            </div>
          </>
        ) : (
          <p className="w-full text-xl font-semibold leading-normal text-gray-700">{value}</p>
        )}
        <div className="absolute left-0 top-1/2 h-full w-1.5 -translate-y-1/2 bg-[#364878]" />
      </CardContent>
    </Card>
  )
}

interface ActionPlanMetricsProps {
  projectId: string
  onNavigateToMap?: () => void
}

export const ActionPlanMetrics: React.FC<ActionPlanMetricsProps> = ({
  projectId,
  onNavigateToMap,
}) => {
  const router = useRouter()

  const handleOpenMap = () => {
    if (onNavigateToMap) {
      // Use callback to switch tabs within the same page
      onNavigateToMap()
    } else {
      // Fallback: Navigate to the project detail page with Peta Pekerjaan tab
      const url = `/monitoring-evaluasi/project/${projectId}?tab=${encodeURIComponent('Peta Pekerjaan')}`
      router.push(url)
    }
  }

  return (
    <div className="space-y-6">
      {/* Responsive Layout for Metrics and Map */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-start lg:gap-4">
        {/* Left Side - Metrics Cards */}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-2">
            {/* Top Row - Two metric cards side by side */}
            <div className="flex h-[90px] gap-2">
              <div className="flex-1">
                <MetricCard title="Deviasi Dengan Target" value="(7%)" />
              </div>
              <div className="flex-1">
                <MetricCard title="Jumlah Adendum" value="1 Kali" />
              </div>
            </div>

            {/* Bottom Row - Progress card spans full width */}
            <div className="w-full">
              <MetricCard
                title="Progress Saat ini"
                value=""
                hasProgressBar={true}
                currentValue="90.000"
                maxValue="100.000"
              />
            </div>
          </div>
        </div>

        {/* Right Side - Map Section with responsive dimensions */}
        <div className="w-full flex-shrink-0 lg:w-[372px] xl:w-[420px] 2xl:w-[480px]">
          <div className="relative h-[188px] w-full overflow-hidden rounded-xl bg-gray-100 lg:h-[188px] xl:h-[220px] 2xl:h-[240px]">
            <ProjectWorkMap projectId={projectId} />
            {/* "Buka Peta" Button */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 transform">
              <button
                onClick={handleOpenMap}
                className="rounded-lg bg-blue-500 px-6 py-1.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Buka Peta
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
