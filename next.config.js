const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  runtimeCaching: [],
  publicExcludes: ['!noprecache/**/*'],
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['mapbox-gl'],
  // Allow external access for mobile development
  experimental: {
    allowedOrigins: ['*'],
  },
  // Allow access from any IP address
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE, OPTIONS' },
          { key: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.mapbox.com',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },
  webpack: (config, { isServer, dev }) => {
    // Handle mapbox-gl
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      }
    }

    // Reduce webpack warnings in development
    if (dev) {
      config.watchOptions = {
        poll: 1000,
        aggregateTimeout: 300,
      }
    }

    return config
  },
  poweredByHeader: false,
  reactStrictMode: true,
  compress: true,
  // Reduce build warnings
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
}

module.exports = withPWA(nextConfig)
