'use client'

import React, { useEffect, useRef, useMemo } from 'react'
import type { ImageHandleProps } from '~/types/props.ts'
import { VirtualWaterfallGallery } from '~/components/ui/virtual-waterfall-gallery'
import { EmptyState, ErrorState } from '~/components/ui/empty-state'
import { ImageIcon } from 'lucide-react'
import { useIsMobile } from '~/hooks/use-mobile'
import { useGalleryPages } from '~/hooks/use-gallery-pages'
import { useFilterStore } from '~/lib/store/filter-store'

export default function WaterfallGallery(props: Readonly<ImageHandleProps>) {
  const isMobile = useIsMobile()
  const { cameraFilter, lensFilter, tagsFilter, tagsOperator, sortByShootTime } = useFilterStore()
  const isHome = (props.album ?? '/') === '/'

  const params = useMemo(() => ({
    album: props.album ?? '/',
    cameras: cameraFilter.length > 0 ? cameraFilter : undefined,
    lenses: lensFilter.length > 0 ? lensFilter : undefined,
    tags: tagsFilter.length > 0 ? tagsFilter : undefined,
    tagsOperator: tagsFilter.length > 0 ? tagsOperator : undefined,
    sortByShootTime: isHome ? sortByShootTime : undefined,
  }), [props.album, cameraFilter, lensFilter, tagsFilter, tagsOperator, sortByShootTime, isHome])

  const filterKey = useMemo(
    () => [
      params.album,
      params.cameras?.join(',') ?? '',
      params.lenses?.join(',') ?? '',
      params.tags?.join(',') ?? '',
      params.tagsOperator ?? '',
      params.sortByShootTime ?? '',
    ].join('|'),
    [params],
  )

  // 移动端软上限低一些，避免 Safari 内存积压
  const softLimit = isMobile ? 160 : 480
  const {
    allImages, isLoading, error, hasMore, shouldLoadNext, atSoftLimit,
    loadNext, reset, setLayoutParams, allLayoutSlots, lastLayout,
  } = useGalleryPages(params, softLimit)

  const hasMoreRef = useRef(hasMore)
  const shouldLoadNextRef = useRef(shouldLoadNext)
  const isLoadingRef = useRef(isLoading)
  hasMoreRef.current = hasMore
  shouldLoadNextRef.current = shouldLoadNext
  isLoadingRef.current = isLoading

  // 筛选条件变化时 reset + 加载第一页
  const prevFilterKeyRef = useRef<string | null>(null)
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    reset()
    loadNext()
  }, [filterKey, reset, loadNext])

  // sentinel 哨兵（始终在 DOM）
  const sentinelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasMoreRef.current && shouldLoadNextRef.current && !isLoadingRef.current) {
          loadNext()
        }
      },
      { rootMargin: isMobile ? '300px' : '600px' },
    )
    io.observe(el)
    return () => io.disconnect()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMobile])

  // 加载完成后检查 sentinel 是否还在视口内（连续填充）
  const prevIsLoadingRef = useRef(false)
  useEffect(() => {
    const wasLoading = prevIsLoadingRef.current
    prevIsLoadingRef.current = isLoading
    if (wasLoading && !isLoading && shouldLoadNext && hasMore) {
      const el = sentinelRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      if (rect.top < window.innerHeight + (isMobile ? 300 : 600)) {
        loadNext()
      }
    }
  }, [isLoading, shouldLoadNext, hasMore, isMobile, loadNext])

  const isInitialLoading = isLoading && allImages.length === 0

  // 桌面端 overscan 更大，减少来回滚动时的卡片闪烁
  const overscanPx = isMobile ? 600 : 1200

  return (
    <div className="w-full min-h-screen bg-background px-3 pt-2 pb-16">
      {isInitialLoading && (
        <div className="flex justify-center items-center min-h-[60vh]">
          <div className="h-8 w-8 rounded-full border-2 border-muted border-t-foreground/50 animate-spin" />
        </div>
      )}

      <div style={{ display: isInitialLoading ? 'none' : 'block' }}>
        <VirtualWaterfallGallery
          images={allImages}
          overscanPx={overscanPx}
          layoutSlots={allLayoutSlots}
          totalHeight={lastLayout ? Math.max(0, ...lastLayout.nextColHeights) : undefined}
          onLayoutParamsReady={setLayoutParams}
        />

        {error && !isLoading && (
          <ErrorState title="加载失败" message={error.message} onRetry={loadNext} />
        )}

        {!error && !isLoading && allImages.length === 0 && (
          <EmptyState
            icon={ImageIcon}
            title="暂无匹配的图片"
            description="尝试调整筛选条件"
          />
        )}

        {/* 达到软上限，改为手动触发 */}
        {atSoftLimit && hasMore && (
          <div className="flex justify-center py-6">
            <button
              type="button"
              onClick={loadNext}
              disabled={isLoading}
              className="rounded-full border border-border bg-card px-5 py-2 text-sm text-foreground hover:bg-muted disabled:opacity-50"
            >
              {isLoading ? '加载中…' : '加载更多'}
            </button>
          </div>
        )}

        {isLoading && allImages.length > 0 && !atSoftLimit && (
          <div className="flex justify-center py-6">
            <div className="h-5 w-5 rounded-full border-2 border-muted border-t-foreground/50 animate-spin" />
          </div>
        )}
      </div>

      {/* sentinel 始终挂载，observer 不会因条件渲染失效 */}
      <div ref={sentinelRef} style={{ height: 1 }} />
    </div>
  )
}
