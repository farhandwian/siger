import { DashboardMetrics } from '@/components/dashboard/metrics'
import { ReportsChart, DepartmentChart, PerformanceChart } from '@/components/dashboard/charts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Download, Filter, RefreshCw } from 'lucide-react'

export default function DashboardPage() {
  return (
    <div className="flex-1 space-y-4 p-4 md:p-8 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
          <p className="text-muted-foreground">
            Ringkasan dan analisis data pelaporan pemerintah
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button size="sm">
            <Plus className="mr-2 h-4 w-4" />
            Buat Laporan
          </Button>
        </div>
      </div>

      {/* Metrics Cards */}
      <DashboardMetrics />

      {/* Charts Grid */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
        <ReportsChart className="xl:col-span-2" />
        <DepartmentChart />
      </div>

      {/* Bottom Row */}
      <div className="grid gap-4 md:gap-8 lg:grid-cols-7">
        <PerformanceChart className="lg:col-span-4" />
        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>
              Update terbaru dari sistem pelaporan
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                {
                  title: 'Laporan Kesehatan Q3 diselesaikan',
                  time: '2 menit yang lalu',
                  user: 'Dr. Andi Wijaya',
                },
                {
                  title: 'Data Pendidikan diperbarui',
                  time: '1 jam yang lalu',
                  user: 'Prof. Sari Dewi',
                },
                {
                  title: 'Review Infrastruktur selesai',
                  time: '3 jam yang lalu',
                  user: 'Ir. Budi Santoso',
                },
                {
                  title: 'Laporan Ekonomi Q3 dikirim',
                  time: '1 hari yang lalu',
                  user: 'Eko Prasetyo, SE',
                },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4">
                  <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      oleh {activity.user}
                    </p>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {activity.time}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
