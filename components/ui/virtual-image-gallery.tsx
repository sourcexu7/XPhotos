'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import type { ImageType } from '~/types'
import { useIsMobile } from '~/hooks/use-mobile'
import { useRouter } from 'next-nprogress-bar'
import { MagicImageCard } from '~/components/ui/magic-image-card'

interface VirtualImageGalleryProps {
  images: ImageType[]
  enableVirtualScroll?: boolean
  virtualScrollThreshold?: number
}

/**
 * 图片画廊组件（魔法交互动效版）
 *
 * 功能：
 * - 高性能虚拟滚动
 * - 3D 倾斜交互动效
 * - GPU 加速动画
 * - 60fps+ 流畅体验
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
      if (!entries || entries.length === 0) return
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
      const ratio = (img.width || 0) > 0 && (img.height || 0) > 0 ? (img.width as number) / (img.height as number) : 4 / 3
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
          <MagicImageCard
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
