'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { usePublicGalleryImages } from '~/hooks/use-public-gallery-images'
import { useGalleryPageCache } from '~/hooks/use-gallery-page-cache'
import React, { useEffect, useMemo, useCallback, useState, useRef } from 'react'
import { VirtualWaterfallGallery } from '~/components/ui/virtual-waterfall-gallery'
import { useGalleryFilters } from '~/hooks/use-gallery-filters'
import { EmptyState, ErrorState } from '~/components/ui/empty-state'
import { ImageIcon } from 'lucide-react'

export default function WaterfallGallery(props: Readonly<ImageHandleProps>) {
  const cameras = useMemo(() => props.filters?.cameras ?? [], [props.filters?.cameras])
  const lenses = useMemo(() => props.filters?.lenses ?? [], [props.filters?.lenses])
  const tags = useMemo(() => props.filters?.tags ?? [], [props.filters?.tags])
  const tagsOperator = props.filters?.tagsOperator || 'and'
  const sortByShootTime = props.sortByShootTime

  const filterKey = useMemo(
    () => [cameras.join(','), lenses.join(','), tags.join(','), tagsOperator, sortByShootTime || ''].join('|'),
    [cameras, lenses, tags, tagsOperator, sortByShootTime],
  )

  const cacheKey = useMemo(() => `waterfall:${props.album}:${filterKey}`, [props.album, filterKey])
  const { cached, save } = useGalleryPageCache<any>(cacheKey)

  const { data, error, isLoading, isValidating, size, setSize, mutate } = usePublicGalleryImages({
    album: props.album,
    cameras: cameras.length > 0 ? cameras : undefined,
    lenses: lenses.length > 0 ? lenses : undefined,
    tags: tags.length > 0 ? tags : undefined,
    tagsOperator: tags.length > 0 ? tagsOperator : undefined,
    sortByShootTime,
  })

  // 恢复已加载页数（返回时不重拉）
  useEffect(() => {
    if (cached?.size && cached.size > size) {
      setSize(cached.size)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  useEffect(() => {
    if (!data) return
    save({ size, setAt: Date.now(), pages: data.map((p: any) => (p?.items ? p.items : p)) as any })
  }, [data, size, save])

  const apiData = useMemo(() => (data ? data.map((p) => p.items) : undefined), [data])

  const { dataList, isFiltering } = useGalleryFilters({
    cameras,
    lenses,
    tags,
    tagsOperator,
    sortByShootTime,
    data: apiData,
    isValidating,
    setSize,
    mutate,
  })

  // hasMore：优先用后端分页信息判断，防止无限滚动死循环
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return false
    const lastPage = data[data.length - 1]
    if (!lastPage) return false
    if (typeof lastPage.pageTotal === 'number' && typeof lastPage.page === 'number') {
      return lastPage.page < lastPage.pageTotal
    }
    // 没有分页元数据时，靠最后一页 items 数量判断
    return Array.isArray(lastPage.items) && lastPage.items.length >= 16
  }, [data])

  // 无限滚动：节流 + 防止在已到最后一页时再触发
  const lastLoadAtRef = useRef(0)
  const THROTTLE_MS = 500

  const handleScroll = useCallback(() => {
    if (isValidating || !hasMore) return
    const now = Date.now()
    if (now - lastLoadAtRef.current < THROTTLE_MS) return

    const scrollTop = window.scrollY
    const windowH = window.innerHeight
    const docH = document.documentElement.scrollHeight
    const threshold = window.innerWidth < 768 ? 400 : 800

    if (scrollTop + windowH >= docH - threshold) {
      lastLoadAtRef.current = now
      setSize((prev) => prev + 1)
    }
  }, [isValidating, hasMore, setSize])

  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  const isInitialLoading = isLoading && dataList.length === 0

  // 分批渲染，防止大量挂载
  const BATCH_SIZE = 20
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE)

  useEffect(() => {
    setRenderedCount(BATCH_SIZE)
  }, [filterKey])

  const renderedImages = useMemo(() => dataList.slice(0, renderedCount), [dataList, renderedCount])

  useEffect(() => {
    if (isFiltering || isInitialLoading) return
    if (renderedCount >= dataList.length) return
    const timer = window.setTimeout(() => {
      setRenderedCount((prev) => Math.min(prev + BATCH_SIZE, dataList.length))
    }, 50)
    return () => window.clearTimeout(timer)
  }, [renderedCount, dataList.length, isFiltering, isInitialLoading])

  return (
    <div className="w-full min-h-screen bg-background text-foreground px-4 pt-5 pb-10">
      {isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">正在加载图片...</span>
          </div>
        </div>
      )}

      {isFiltering && !isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">正在筛选图片...</span>
          </div>
        </div>
      )}

      {!isFiltering && !isInitialLoading && (
        <>
          <VirtualWaterfallGallery images={renderedImages} overscan={5} />

          {error && !isValidating && (
            <ErrorState
              title="加载失败"
              message={error.message || '获取图片列表时遇到错误'}
              onRetry={() => mutate()}
            />
          )}

          {!error && !isValidating && dataList.length === 0 && (
            <EmptyState
              icon={ImageIcon}
              title="暂无匹配的图片"
              description="尝试调整筛选条件或清空所有筛选器"
              actionLabel="清除筛选条件"
              onAction={() => {
                // 由父组件通过 props 控制，此处不再直接调用未定义的 setter
              }}
            />
          )}

          {/* 加载更多 spinner */}
          {isValidating && !isInitialLoading && (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-muted-foreground border-t-primary rounded-full animate-spin" />
            </div>
          )}
        </>
      )}
    </div>
  )
}
