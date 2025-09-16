import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { AuthProvider } from '@/components/providers/auth-provider'
import ChunkErrorHandler from '@/components/client/chunk-error-handler'
import { ToastProvider } from '@/components/ui/toast'
import '@/styles/globals.css'
import '@/styles/scrollbar.css'
import '@/styles/sidebar-force-hide.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIGER - Sistem Informasi Geospasial Irigasi',
  description: 'Sistem Informasi Geospasial Irigasi untuk Monitoring dan Evaluasi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          <QueryProvider>
            <ToastProvider>
              <ChunkErrorHandler />
              {children}
            </ToastProvider>
          </QueryProvider>
        </AuthProvider>
      </body>
    </html>
  )
}
