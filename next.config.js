/** @type {import('next').NextConfig} */
const nextConfig = {
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
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
  },
  
  // Disable ESLint during build
  eslint: {
    ignoreDuringBuilds: true,
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
  },
  
  // Specify the output directory
  distDir: '.next',
  
  // Configure trailing slash behavior
  trailingSlash: false,
  
  // Configure asset prefix
  assetPrefix: '',
  
  // Configure compression
  compress: true,
  
  // Configure powered by header
  poweredByHeader: false,
  
  // Configure react strict mode
  reactStrictMode: true,
  
  // Configure cross origin resource policy
  crossOrigin: 'anonymous',
  
  // Configure generate builds
  generateBuildId: async () => {
    return 'hoyn-build-' + Date.now();
  },
  
  // Configure output file tracing
  output: 'standalone',
  
  // Configure webpack optimization
  webpack: (config, { isServer }) => {
    // Fixes npm packages that depend on `fs` module
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  }
}

module.exports = nextConfig