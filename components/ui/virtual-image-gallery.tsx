'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '~/lib/utils'
import type { ImageType } from '~/types'
import { useIsMobile } from '~/hooks/use-mobile'
import { useRouter } from 'next-nprogress-bar'

const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
function snapWidth(w: number): number {
  for (const allowed of ALLOWED_WIDTHS) {
    if (allowed >= Math.ceil(w)) return allowed
  }
  return ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]
}

interface VirtualImageGalleryProps {
  images: ImageType[]
  enableVirtualScroll?: boolean
  virtualScrollThreshold?: number
}

/**
 * 图片画廊组件（重写版）
 *
 * 改动：
 * - 移除 react-window FixedSizeGrid（固定行高与瀑布流不兼容，导致崩溃死循环）
 * - 改为与 VirtualWaterfallGallery 一致的绝对定位布局
 * - 图库全程只渲染 preview_url，不加载原图
 * - 修复 Modal 内存泄漏：改用 router.push 导航，不在 gallery 内嵌 lightbox
 */
export function VirtualImageGallery({
  images,
  enableVirtualScroll = true,
  virtualScrollThreshold = 50,
}: VirtualImageGalleryProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)
  const [scrollY, setScrollY] = useState(0)
  const [windowHeight, setWindowHeight] = useState(
    typeof window !== 'undefined' ? window.innerHeight : 800,
  )

  const columnCount = isMobile ? 2 : 3
  const GAP = 16
  const overscan = 5

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width)
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(() => setScrollY(window.scrollY))
    }
    const onResize = () => setWindowHeight(window.innerHeight)
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      cancelAnimationFrame(rafId)
    }
  }, [])

  const layout = useMemo(() => {
    if (containerWidth === 0 || images.length === 0) return { items: [], totalHeight: 0 }

    const colWidth = (containerWidth - GAP * (columnCount - 1)) / columnCount
    const colHeights = new Array(columnCount).fill(0)
    const items: { image: ImageType; x: number; y: number; w: number; h: number; index: number }[] = []

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      // EXIF 尺寸校准
      const ratio = img.width > 0 && img.height > 0 ? img.width / img.height : 4 / 3
      const itemH = Math.round(colWidth / ratio)

      let col = 0
      for (let c = 1; c < columnCount; c++) {
        if (colHeights[c] < colHeights[col]) col = c
      }

      items.push({
        image: img,
        x: col * (colWidth + GAP),
        y: colHeights[col],
        w: colWidth,
        h: itemH,
        index: i,
      })
      colHeights[col] += itemH + GAP
    }

    return { items, totalHeight: Math.max(...colHeights) }
  }, [images, containerWidth, columnCount])

  const visibleItems = useMemo(() => {
    if (!enableVirtualScroll || images.length <= virtualScrollThreshold) return layout.items
    if (layout.items.length === 0) return []

    const containerOffsetTop = containerRef.current?.offsetTop ?? 0
    const expandPx = overscan * 280
    const visTop = scrollY - expandPx - containerOffsetTop
    const visBottom = scrollY + windowHeight + expandPx

    return layout.items.filter((item) => item.y + item.h >= visTop && item.y <= visBottom)
  }, [layout.items, scrollY, windowHeight, enableVirtualScroll, virtualScrollThreshold, images.length, overscan])

  const handleCardClick = useCallback(
    (id: string) => {
      router.push(`/preview/${id}`)
    },
    [router],
  )

  if (containerWidth === 0) {
    return <div ref={containerRef} className="w-full" style={{ minHeight: 400 }} />
  }

  return (
    <div ref={containerRef} className="relative w-full" style={{ height: layout.totalHeight }}>
      {layout.items.map((item) => {
        const show = visibleItems.some((v) => v.index === item.index)
        return (
          <GalleryCard
            key={item.image.id}
            image={item.image}
            x={item.x}
            y={item.y}
            w={item.w}
            h={item.h}
            index={item.index}
            isVisible={show}
            onClick={handleCardClick}
          />
        )
      })}
    </div>
  )
}

interface GalleryCardProps {
  image: ImageType
  x: number
  y: number
  w: number
  h: number
  index: number
  isVisible: boolean
  onClick: (id: string) => void
}

const GalleryCard = React.memo(function GalleryCard({
  image,
  x,
  y,
  w,
  h,
  index,
  isVisible,
  onClick,
}: GalleryCardProps) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const src = image.preview_url || image.url || ''
  const priority = index < 6

  return (
    <div
      ref={ref}
      className="absolute group cursor-pointer rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      tabIndex={0}
      role="button"
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(image.id) } }}
      style={{ left: x, top: y, width: w, height: h }}
      onClick={() => onClick(image.id)}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      {(inView || isVisible) && src && (
        <img
          src={src}
          alt={image.detail || image.title || '摄影作品'}
          width={w}
          height={h}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className={cn(
            'w-full h-full object-cover transition-opacity duration-500',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
          onLoad={() => setLoaded(true)}
        />
      )}
      {image.title && (
        <div className="absolute inset-x-0 bottom-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/60 to-transparent p-3">
          <p className="text-white text-sm font-medium line-clamp-2">{image.title}</p>
        </div>
      )}
    </div>
  )
})
