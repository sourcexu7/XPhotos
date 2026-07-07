'use client'

import { useRouter } from 'next-nprogress-bar'
import { useState, useEffect, useRef } from 'react'
import type { ImageType } from '~/types'

/**
 * 单张瀑布流卡片（简化版）
 * 实际渲染已由 VirtualWaterfallGallery 绝对定位布局接管，
 * 此组件保留供其他主题/直接引用场景使用
 */
export default function WaterfallImage({ photo, index }: { photo: ImageType; index?: number }) {
  const router = useRouter()
  const [loaded, setLoaded] = useState(false)
  const [hovered, setHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setInView(true); io.disconnect() }
      },
      { rootMargin: '200px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const src = photo.preview_url || photo.url || ''
  const priority = index !== undefined && index < 6

  return (
    <div
      ref={ref}
      className="relative cursor-pointer overflow-hidden rounded-xl"
      style={{
        marginBottom: 16,
        breakInside: 'avoid',
        transform: hovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.25)' : '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => router.push(`/preview/${photo.id}`)}
    >
      {/* 骨架 */}
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}

      {/* 只加载 preview_url，图库全程不触碰原图 */}
      {inView && src && (
        <img
          src={src}
          alt={photo.detail || photo.title || '摄影作品'}
          width={photo.width || 800}
          height={photo.height || 600}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className="w-full h-auto block"
          onLoad={() => setLoaded(true)}
        />
      )}

      {/* LivePhoto 标识 */}
      {photo.type === 2 && (
        <div className="absolute top-2 left-2 z-10 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
          <span className="text-white text-[10px] font-bold">L</span>
        </div>
      )}

      {/* 悬停遮罩 */}
      {photo.detail && (
        <div
          className="absolute inset-x-0 bottom-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, transparent 60%)',
            opacity: hovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            padding: '16px 12px 10px',
          }}
        >
          <p className="text-white text-sm font-medium line-clamp-2">{photo.detail}</p>
        </div>
      )}
    </div>
  )
}
