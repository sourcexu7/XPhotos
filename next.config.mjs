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
    'http://192.168.0.125:3000',
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
    // 设备断点
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    // 扩充以覆盖瀑布流动态列宽（2列~4列场景下常见宽度）
    imageSizes: [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640],
    // Next.js 16 起要求显式声明允许的 quality 值
    //（你的 OptimizedImage 默认是 85）
    qualities: [60, 75, 85, 90, 100],
    minimumCacheTTL: 3600, // 优化 LCP：延长图片缓存 TTL 为 1 小时
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
