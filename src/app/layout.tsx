import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'SIGER - Smart Integrated Government Electronic Reporting',
  description: 'Sistem pelaporan elektronik pemerintah yang terintegrasi',
  keywords: ['government', 'reporting', 'dashboard', 'analytics'],
  authors: [{ name: 'SIGER Team' }],
  creator: 'SIGER Team',
  publisher: 'SIGER',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://siger.example.com'),
  openGraph: {
    title: 'SIGER - Smart Integrated Government Electronic Reporting',
    description: 'Sistem pelaporan elektronik pemerintah yang terintegrasi',
    url: 'https://siger.example.com',
    siteName: 'SIGER',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
      },
    ],
    locale: 'id_ID',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SIGER - Smart Integrated Government Electronic Reporting',
    description: 'Sistem pelaporan elektronik pemerintah yang terintegrasi',
    images: ['/twitter-image.png'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
      </head>
      <body className={inter.className}>
        <div id="root">
          {children}
        </div>
      </body>
    </html>
  )
}
