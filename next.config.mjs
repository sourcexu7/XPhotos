import createNextIntlPlugin from 'next-intl/plugin'
import bundleAnalyzer from '@next/bundle-analyzer'
import withPWA from 'next-pwa'

const withNextIntl = createNextIntlPlugin('./i18n.ts')

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
})

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  poweredByHeader: false,
  // 解决跨域请求警告
  allowedDevOrigins: [
    'http://192.168.0.125',
    'http://localhost:3000',
    'http://198.18.0.1:3000'
  ],
  // 增加请求体大小限制，支持大文件上传
  experimental: {
    middlewareClientMaxBodySize: '100mb'
  },
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' 
      ? { exclude: ['error', 'warn'] }
      : false,
  },
  serverExternalPackages: ['pg'],
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'xphotos.s3.ap-northeast-1.amazonaws.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'xphotos7-1306526302.cos.ap-nanjing.myqcloud.com',
        pathname: '/**',
      },
    ],
    // 性能优化：优先使用 WebP/AVIF 格式，图片体积减少 50-70%
    formats: ['image/avif', 'image/webp'],
    // 性能优化：设备尺寸配置，根据设备加载对应尺寸的图片
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 性能优化：图片尺寸配置，减少带宽使用 50%+
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Next.js 16 起要求显式声明允许的 quality 值
    //（你的 OptimizedImage 默认是 85）
    qualities: [60, 75, 85, 90, 100],
    minimumCacheTTL: 60, // 缓存时间 60 秒
  },
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT,OPTIONS' },
          { 
            key: 'Access-Control-Allow-Headers', 
            value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' 
          },
        ],
      },
    ]
  },
}

const pwaConfig = withPWA({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
})(nextConfig)

export default withNextIntl(withBundleAnalyzer(pwaConfig))
