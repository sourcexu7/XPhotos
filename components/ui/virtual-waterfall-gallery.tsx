'use client'

import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react'
import type { ImageType } from '~/types'
import { useRouter } from 'next-nprogress-bar'
import { useIsMobile } from '~/hooks/use-mobile'
import type { LayoutSlot, LayoutParams } from '~/hooks/use-gallery-pages'

// ─── 类型定义 ─────────────────────────────────────────────────────────────────

interface LayoutItem extends LayoutSlot {
  image: ImageType
  index: number
}

interface VirtualWaterfallGalleryProps {
  images: ImageType[]
  overscanPx?: number
  // 后端预算的 layout slots（有则直接用，无则前端自己算）
  layoutSlots?: LayoutSlot[]
  // 后端计算出的容器总高度（可选，有则直接用）
  totalHeight?: number
  // 回调：前端测量完容器宽度后通知父组件，用于首次布局参数上报
  onLayoutParamsReady?: (params: LayoutParams) => void
}

// ─── 主组件 ──────────────────────────────────────────────────────────────────

export function VirtualWaterfallGallery({
  images,
  overscanPx = 800,
  layoutSlots,
  totalHeight: totalHeightProp,
  onLayoutParamsReady,
}: VirtualWaterfallGalleryProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerWidth, setContainerWidth] = useState(0)

  // 滚动位置用 ref，不触发重渲染；forceUpdate 由 rAF 节流触发
  const scrollYRef = useRef(0)
  const winHRef = useRef(typeof window !== 'undefined' ? window.innerHeight : 800)
  const [tick, setTick] = useState(0)
  const rafRef = useRef(0)

  const cols = isMobile ? 2 : 4
  const gap = isMobile ? 6 : 10

  // ── 容器宽度测量 ──────────────────────────────────────────────────────────
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      if (!entries || entries.length === 0) return
      const w = Math.floor(entries[0].contentRect.width)
      if (w <= 0) return
      setContainerWidth(w)
      // 通知父组件布局参数，父组件传给 useGalleryPages，后续请求带上这些参数
      onLayoutParamsReady?.({ containerWidth: w, cols, gap })
    })
    ro.observe(el)
    return () => ro.disconnect()
  // cols/gap 变化时重新上报
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cols, gap])

  // ── 滚动监听：rAF 节流，ref 存值 ──────────────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = requestAnimationFrame(() => {
        scrollYRef.current = window.scrollY
        winHRef.current = window.innerHeight
        setTick((n) => n + 1)
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  // ── 布局：优先用后端预算结果，否则前端自己算 ─────────────────────────────
  const layoutCacheRef = useRef<{
    items: LayoutItem[]
    colHeights: number[]
    colWidth: number
    cols: number
    gap: number
  }>({ items: [], colHeights: [], colWidth: 0, cols: 0, gap: 0 })

  const layout = useMemo(() => {
    if (images.length === 0) return { items: [] as LayoutItem[], totalHeight: 0 }

    // 后端已预算：直接把 slots 和 images 合并（按 id 匹配）
    if (layoutSlots && layoutSlots.length === images.length) {
      const idToSlot = new Map(layoutSlots.map((s) => [s.id, s]))
      const items: LayoutItem[] = images.map((image, index) => {
        const slot = idToSlot.get(image.id)
        if (slot) return { ...slot, image, index }
        // 极少情况：slot 里没有这张图（id 对不上），fallback 到原地
        return { id: image.id, x: 0, y: 0, w: 0, h: 0, image, index }
      })
      const th = totalHeightProp ?? Math.max(0, ...items.map((it) => it.y + it.h))
      return { items, totalHeight: th }
    }

    // 前端自己算（后端没返回布局数据，或参数未就绪时）
    if (containerWidth === 0) return { items: [] as LayoutItem[], totalHeight: 0 }

    const colWidth = Math.floor((containerWidth - gap * (cols - 1)) / cols)
    const prev = layoutCacheRef.current

    const needFullRecalc =
      prev.colWidth !== colWidth || prev.cols !== cols || prev.gap !== gap || images.length < prev.items.length

    if (needFullRecalc) {
      const colHeights = new Array<number>(cols).fill(0)
      const items = images.map((image, i) => clientPlaceItem(image, i, colWidth, colHeights, cols, gap))
      layoutCacheRef.current = { items, colHeights: [...colHeights], colWidth, cols, gap }
      return { items, totalHeight: Math.max(0, ...colHeights) }
    }

    if (images.length > prev.items.length) {
      const colHeights = [...prev.colHeights]
      const items = [...prev.items]
      for (let i = prev.items.length; i < images.length; i++) {
        items.push(clientPlaceItem(images[i], i, colWidth, colHeights, cols, gap))
      }
      layoutCacheRef.current = { items, colHeights, colWidth, cols, gap }
      return { items, totalHeight: Math.max(0, ...colHeights) }
    }

    return {
      items: prev.items,
      totalHeight: Math.max(0, ...prev.colHeights),
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, layoutSlots, totalHeightProp, containerWidth, cols, gap])

  // ── 窗口裁剪：只渲染可见区 ±overscanPx ───────────────────────────────────
  // tick 作为依赖触发重新裁剪，但 scrollY/winH 通过 ref 读取避免闭包问题
  const visibleItems = useMemo(() => {
    if (layout.items.length === 0) return layout.items
    const containerTop = containerRef.current
      ? containerRef.current.getBoundingClientRect().top + window.scrollY
      : 0
    const relY = scrollYRef.current - containerTop
    const top = relY - overscanPx
    const bottom = relY + winHRef.current + overscanPx
    return layout.items.filter((it) => it.y + it.h > top && it.y < bottom)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout.items, overscanPx, tick])

  const handleClick = useCallback(
    (id: string) => router.push(`/preview/${id}`),
    [router],
  )

  if (containerWidth === 0 && !layoutSlots) {
    return <div ref={containerRef} className="w-full" style={{ minHeight: 200 }} />
  }

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      style={{ height: layout.totalHeight || 200 }}
    >
      {visibleItems.map((item) => (
        <Card key={item.image.id} item={item} onClick={handleClick} />
      ))}
    </div>
  )
}

// ─── 前端自算布局的辅助函数（后端没返回数据时的 fallback） ───────────────────

function clientPlaceItem(
  image: ImageType,
  index: number,
  colWidth: number,
  colHeights: number[],
  cols: number,
  gap: number,
): LayoutItem {
  const rw = (image.width || 0) > 0 ? image.width : 0
  const rh = (image.height || 0) > 0 ? image.height : 0
  const ratio = (rw || 0) > 0 && (rh || 0) > 0 ? (rw as number) / (rh as number) : 3 / 4
  const h = Math.min(Math.round(colWidth / ratio), Math.round(colWidth * 2.5))
  let col = 0
  for (let c = 1; c < cols; c++) {
    if (colHeights[c] < colHeights[col]) col = c
  }
  const x = col * (colWidth + gap)
  const y = colHeights[col]
  colHeights[col] += h + gap
  return { id: image.id, image, x, y, w: colWidth, h, index }
}

// ─── 卡片组件 ────────────────────────────────────────────────────────────────

const Card = React.memo(function Card({
  item,
  onClick,
}: {
  item: LayoutItem
  onClick: (id: string) => void
}) {
  const [loaded, setLoaded] = useState(false)
  const src = item.image.preview_url || item.image.url || ''

  return (
    <div
      className="absolute overflow-hidden rounded-lg cursor-pointer"
      style={{ left: item.x, top: item.y, width: item.w, height: item.h }}
      onClick={() => onClick(item.image.id)}
    >
      {!loaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
      {src && (
        <img
          src={src}
          alt={item.image.title || item.image.detail || ''}
          width={item.w}
          height={item.h}
          loading={item.index < 8 ? 'eager' : 'lazy'}
          decoding="async"
          onLoad={() => setLoaded(true)}
          className="w-full h-full object-cover"
          style={{ display: 'block', opacity: loaded ? 1 : 0, transition: 'opacity 0.2s' }}
        />
      )}
      {item.image.type === 2 && (
        <span className="absolute top-1.5 left-1.5 rounded bg-black/50 px-1.5 py-0.5 text-[9px] font-medium text-white tracking-wider">
          LIVE
        </span>
      )}
    </div>
  )
})
