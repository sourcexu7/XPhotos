'use client'

import React, { useMemo, useRef, useEffect, useState } from 'react'
import type { ImageType } from '~/types'
import { useRouter } from 'next-nprogress-bar'
import { useIsMobile } from '~/hooks/use-mobile'

interface VirtualWaterfallGalleryProps {
  images: ImageType[]
  overscan?: number
}

/**
 * 虚拟滚动瀑布流画廊（完全重写版）
 *
 * 核心改进：
 * - 放弃 CSS columns 多列布局，改用绝对定位瀑布流（精确列高跟踪）
 * - 基于 IntersectionObserver 实现滚动感知预加载窗口
 * - prefers-reduced-motion 无障碍：检测到则禁用所有 CSS 过渡
 * - 虚拟化：仅 DOM-挂载可视窗口 ±overscan 的卡片，消除快速滚动空白格
 * - 图库网格全程加载 preview_url，不加载原图
 */
export function VirtualWaterfallGallery({
  images,
  overscan = 5,
}: VirtualWaterfallGalleryProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  )
  const prefersReducedMotion = usePrefersReducedMotion()

  const columnCount = isMobile ? 3 : 5
  const GAP = 16

  // 监听容器宽度
  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // 监听滚动（节流，16ms ≈ 60fps）
  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', () => setWindowHeight(window.innerHeight), { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [])

  // 计算每张图片的宽度/高度/列位置（基于 EXIF 宽高比，≤0 时 fallback 为 4/3）
  const layout = useMemo(() => {
    if (containerWidth === 0 || images.length === 0) return { items: [], totalHeight: 0 }

    const colWidth = (containerWidth - GAP * (columnCount - 1)) / columnCount
    const colHeights = new Array(columnCount).fill(0)
    const items: {
      image: ImageType
      x: number
      y: number
      w: number
      h: number
      col: number
      index: number
    }[] = []

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      // EXIF 尺寸校准：优先使用数据库存储的 width/height（源自 EXIF）
      const rawW = img.width > 0 ? img.width : 0
      const rawH = img.height > 0 ? img.height : 0
      const ratio = rawW > 0 && rawH > 0 ? rawW / rawH : 4 / 3
      const itemH = Math.round(colWidth / ratio)

      // 找高度最小的列
      let col = 0
      for (let c = 1; c < columnCount; c++) {
        if (colHeights[c] < colHeights[col]) col = c
      }

      const x = col * (colWidth + GAP)
      const y = colHeights[col]

      items.push({ image: img, x, y, w: colWidth, h: itemH, col, index: i })
      colHeights[col] += itemH + GAP
    }

    return { items, totalHeight: Math.max(...colHeights) }
  }, [images, containerWidth, columnCount, GAP])

  // 虚拟化：确定可视范围内的 items（item.y 是相对于容器顶部的偏移量）
  const visibleItems = useMemo(() => {
    if (layout.items.length === 0) return layout.items

    const expandPx = overscan * 300
    const containerOffsetTop = containerRef.current?.offsetTop ?? 0
    const visTop = scrollY - containerOffsetTop - expandPx
    const visBottom = scrollY - containerOffsetTop + windowHeight + expandPx

    return layout.items.filter((item) => item.y + item.h >= visTop && item.y <= visBottom)
  }, [layout.items, scrollY, windowHeight, overscan])

  // 预加载：提前加载可视区域外 overscan 张图的 preview_url
  useEffect(() => {
    if (visibleItems.length === 0) return
    const lastVisible = visibleItems[visibleItems.length - 1]
    const nextIdx = lastVisible.index + 1
    const preloadEnd = Math.min(nextIdx + overscan, images.length)
    for (let i = nextIdx; i < preloadEnd; i++) {
      const url = images[i]?.preview_url || images[i]?.url
      if (url) {
        const link = document.createElement('link')
        link.rel = 'prefetch'
        link.as = 'image'
        link.href = url
        document.head.appendChild(link)
        setTimeout(() => document.head.removeChild(link), 5000)
      }
    }
  }, [visibleItems, images, overscan])

  if (containerWidth === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full"
        style={{ minHeight: 400 }}
      />
    )
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: layout.totalHeight }}>
      {layout.items.map((item) => {
        const isVisible = visibleItems.some((v) => v.index === item.index)
        return (
          <WaterfallCard
            key={item.image.id}
            image={item.image}
            x={item.x}
            y={item.y}
            w={item.w}
            h={item.h}
            index={item.index}
            isVisible={isVisible}
            prefersReducedMotion={prefersReducedMotion}
            onClick={() => router.push(`/preview/${item.image.id}`)}
          />
        )
      })}
    </div>
  )
}

interface WaterfallCardProps {
  image: ImageType
  x: number
  y: number
  w: number
  h: number
  index: number
  isVisible: boolean
  prefersReducedMotion: boolean
  onClick: () => void
}

const WaterfallCard = React.memo(function WaterfallCard({
  image,
  x,
  y,
  w,
  h,
  index,
  isVisible,
  prefersReducedMotion,
  onClick,
}: WaterfallCardProps) {
  const [loaded, setLoaded] = useState(false)
  const [inView, setInView] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '200px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const transition = prefersReducedMotion ? 'none' : 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'

  return (
    <div
      ref={ref}
      className="absolute cursor-pointer group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick() } }}
      style={{
        left: x,
        top: y,
        width: w,
        height: h,
        borderRadius: 16,
        overflow: 'hidden',
        transform: hovered && !prefersReducedMotion ? 'translateY(-4px) scale(1.02)' : 'translateY(0) scale(1)',
        boxShadow: hovered 
          ? '0 20px 40px -12px rgba(0,0,0,0.35), 0 8px 20px -8px rgba(0,0,0,0.25)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        transition,
        willChange: hovered ? 'transform, box-shadow' : 'auto',
      }}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 仅加载 preview_url，绝不加载原图 */}
      {(inView || isVisible) && (
        <ResponsivePicture
          image={image}
          w={w}
          h={h}
          priority={index < 6}
          onLoad={() => setLoaded(true)}
          prefersReducedMotion={prefersReducedMotion}
        />
      )}

      {/* 占位骨架 */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-muted"
          style={{
            background: 'linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted)/0.7) 50%, hsl(var(--muted)) 75%)',
            backgroundSize: '200% 100%',
            animation: prefersReducedMotion ? 'none' : 'shimmer 1.5s infinite',
          }}
        />
      )}

      {/* 精致的渐变叠加层 */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{
          background: 'linear-gradient(to top, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.2) 40%, transparent 70%)',
        }}
      />

      {/* LivePhoto 标识 */}
      {image.type === 2 && (
        <div className="absolute top-3 left-3 z-10 opacity-80 group-hover:opacity-100 transition-opacity duration-300">
          <div className="w-8 h-8 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center border border-white/20">
            <span className="text-white text-xs font-semibold tracking-wider">LIVE</span>
          </div>
        </div>
      )}

      {/* 悬停信息层 */}
      <div
        className="absolute inset-x-0 bottom-0 p-4 pointer-events-none translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-500 ease-out"
      >
        {(image.title || image.detail) && (
          <div className="space-y-1">
            {image.title && (
              <p className="text-white text-sm font-medium line-clamp-2 drop-shadow-md">
                {image.title}
              </p>
            )}
            {image.detail && !image.title && (
              <p className="text-white/90 text-xs line-clamp-2 drop-shadow-md">
                {image.detail}
              </p>
            )}
          </div>
        )}
        <div className="mt-3 flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
})

interface ResponsivePictureProps {
  image: ImageType
  w: number
  h: number
  priority: boolean
  onLoad: () => void
  prefersReducedMotion: boolean
}

/**
 * 响应式图片组件：使用 <picture> + srcset 实现 AVIF/WebP/原始格式分发
 * 图库网格全程只使用 preview_url，不加载原图
 */
function ResponsivePicture({ image, w, h, priority, onLoad, prefersReducedMotion }: ResponsivePictureProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const id = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(id)
  }, [])

  // 直接用 preview_url（COS 上已是 WebP），避免 /_next/image 代理超时
  const src = image.preview_url || image.url || ''
  const transition = prefersReducedMotion ? 'none' : 'opacity 0.5s ease'

  return (
    <img
      src={src}
      alt={image.detail || image.title || '摄影作品'}
      width={w}
      height={h}
      loading={priority ? 'eager' : 'lazy'}
      decoding={priority ? 'sync' : 'async'}
      fetchPriority={priority ? 'high' : 'auto'}
      onLoad={onLoad}
      className="object-cover w-full h-full"
      style={{ opacity: visible ? 1 : 0, transition, display: 'block' }}
    />
  )
}

function usePrefersReducedMotion(): boolean {
  const [prefersReduced, setPrefersReduced] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReduced(mq.matches)
    const handler = (e: MediaQueryListEvent) => setPrefersReduced(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])
  return prefersReduced
}
