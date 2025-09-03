const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development'
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    appDir: true,
    serverComponentsExternalPackages: ['mapbox-gl']
  },
  images: {
    domains: ['api.mapbox.com'],
    formats: ['image/avif', 'image/webp']
  },
  webpack: (config, { isServer }) => {
    // Handle mapbox-gl
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false
      };
    }
    
    return config;
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  compress: true
};

module.exports = withPWA(nextConfig);
