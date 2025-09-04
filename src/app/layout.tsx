import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { QueryProvider } from '@/providers/query-provider'
import { Toaster } from 'sonner'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIGER - Sistem Informasi Geospasial Irigasi',
  description: 'Sistem Informasi Geospasial Irigasi untuk Monitoring dan Evaluasi',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <QueryProvider>
          {children}
          <Toaster position="top-right" />
        </QueryProvider>
      </body>
    </html>
  )
}
