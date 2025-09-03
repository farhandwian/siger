import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart3, Map, FileText, Users, TrendingUp, Shield } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            SIGER
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Smart Integrated Government Electronic Reporting
          </p>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto">
            Sistem pelaporan elektronik pemerintah yang terintegrasi dengan teknologi modern
            untuk analisis data yang lebih efektif dan pengambilan keputusan yang lebih baik.
          </p>
        </header>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-600" />
                <CardTitle>Analytics Dashboard</CardTitle>
              </div>
              <CardDescription>
                Visualisasi data interaktif dengan Chart.js dan D3.js
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Dashboard komprehensif untuk monitoring dan analisis data pemerintahan
                dengan grafik yang mudah dipahami.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Map className="h-6 w-6 text-green-600" />
                <CardTitle>Mapping & GIS</CardTitle>
              </div>
              <CardDescription>
                Integrasi Mapbox untuk visualisasi geografis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Peta interaktif untuk analisis spasial dan visualisasi data geografis
                dengan teknologi Mapbox GL JS.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <FileText className="h-6 w-6 text-purple-600" />
                <CardTitle>Report Generation</CardTitle>
              </div>
              <CardDescription>
                Sistem pelaporan otomatis dan real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Generate laporan otomatis dengan format yang dapat disesuaikan
                dan ekspor ke berbagai format.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Users className="h-6 w-6 text-orange-600" />
                <CardTitle>User Management</CardTitle>
              </div>
              <CardDescription>
                Manajemen pengguna dengan role-based access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistem manajemen pengguna dengan kontrol akses berbasis peran
                dan keamanan tingkat enterprise.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-6 w-6 text-red-600" />
                <CardTitle>Performance Metrics</CardTitle>
              </div>
              <CardDescription>
                Monitoring performa sistem real-time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Pantau performa sistem dan KPI dengan metrik real-time
                dan alert otomatis.
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Shield className="h-6 w-6 text-indigo-600" />
                <CardTitle>Security & Compliance</CardTitle>
              </div>
              <CardDescription>
                Keamanan enterprise dengan validasi Zod
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600">
                Sistem keamanan berlapis dengan validasi data menggunakan Zod
                dan compliance standar pemerintahan.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Siap untuk Memulai?
            </h2>
            <p className="text-gray-600 mb-6">
              Bergabunglah dengan sistem pelaporan elektronik yang akan mengubah
              cara kerja pemerintahan menjadi lebih efisien dan transparan.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
                Mulai Sekarang
              </Button>
              <Button variant="outline" size="lg">
                Pelajari Lebih Lanjut
              </Button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
