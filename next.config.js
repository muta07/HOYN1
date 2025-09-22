/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // Uyarı: Bu ayar, projenizde ESLint hataları olsa bile
    // production build'lerinin başarılı olmasına izin verir.
    ignoreDuringBuilds: true,
  },

  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@yudiel/react-qr-scanner', 'qrcode.react']
  },
  
  // Image optimization for better performance
  images: {
    domains: ['firebasestorage.googleapis.com'],
    formats: ['image/webp', 'image/avif']
  },
  
  // Environment variables validation
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  
  // Production URL configuration
  async redirects() {
    return [
      // Add any redirects here if needed
    ]
  },
  
  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          }
        ]
      }
    ]
  }
}

module.exports = nextConfig