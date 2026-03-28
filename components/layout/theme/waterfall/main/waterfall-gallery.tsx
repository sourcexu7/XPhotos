'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { usePublicGalleryImages } from '~/hooks/use-public-gallery-images'
import { useGalleryPageCache } from '~/hooks/use-gallery-page-cache'
import { useTranslations } from 'next-intl'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React, { useEffect, useRef, useMemo, useCallback, useState } from 'react'
import { VirtualImageGallery } from '~/components/ui/virtual-image-gallery'
import { useGalleryFilters } from '~/hooks/use-gallery-filters'

export default function WaterfallGallery(props: Readonly<ImageHandleProps>) {
  // 避免 `props.filters?.xxx || []` 每次渲染都创建新数组，导致 hook deps 噪声
  const cameras = useMemo(() => props.filters?.cameras ?? [], [props.filters?.cameras])
  const lenses = useMemo(() => props.filters?.lenses ?? [], [props.filters?.lenses])
  const tags = useMemo(() => props.filters?.tags ?? [], [props.filters?.tags])
  const tagsOperator = props.filters?.tagsOperator || 'and'
  const sortByShootTime = props.sortByShootTime
  
  // 优化：使用稳定的筛选键生成函数，避免 JSON.stringify 开销
  const filterKey = useMemo(
    () => [
      cameras.join(','),
      lenses.join(','),
      tags.join(','),
      tagsOperator,
      sortByShootTime || '',
    ].join('|'),
    [cameras, lenses, tags, tagsOperator, sortByShootTime]
  )
  
  const cacheKey = useMemo(
    () => `waterfall:${props.album}:${filterKey}`,
    [props.album, filterKey]
  )

  const { cached, save } = useGalleryPageCache<any>(cacheKey)

  const { data, error, isLoading, isValidating, size, setSize, mutate } = usePublicGalleryImages({
    album: props.album,
    cameras: cameras.length > 0 ? cameras : undefined,
    lenses: lenses.length > 0 ? lenses : undefined,
    tags: tags.length > 0 ? tags : undefined,
    tagsOperator: tags.length > 0 ? tagsOperator : undefined,
    sortByShootTime,
  })

  // 从 sessionStorage 恢复已加载页数（返回不重拉）
  useEffect(() => {
    if (cached?.size && cached.size > size) {
      setSize(cached.size)
    }
    // 只在 key 变化时尝试恢复
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey])

  // 保存已加载页数（减少返回后的重新请求）
  useEffect(() => {
    if (!data) return
    save({
      size,
      setAt: Date.now(),
      pages: data.map((p: any) => (p?.items ? p.items : p)) as any,
    })
  }, [data, size, save])
  
  // 优化：使用公共 Hook 提取筛选逻辑，消除重复代码
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
  
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 是否还有下一页：优先用后端分页信息判断，避免重复/无效请求
  const hasMore = useMemo(() => {
    if (!data || data.length === 0) return true
    const lastPage = data[data.length - 1]
    if (!lastPage) return true
    if (typeof lastPage.pageTotal === 'number' && typeof lastPage.page === 'number') {
      return lastPage.page < lastPage.pageTotal
    }
    return Array.isArray(lastPage.items) ? lastPage.items.length > 0 : true
  }, [data])

  // 滚动加载节流：避免快速滚动触发请求风暴
  const lastLoadAtRef = useRef(0)
  const THROTTLE_MS = 200

  const handleScroll = useCallback(() => {
    if (isValidating || !hasMore) return

    const now = Date.now()
    if (now - lastLoadAtRef.current < THROTTLE_MS) return

    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // 修复：移动端适配触发阈值。当设备为移动端或屏幕较小时，减小阈值，防止在较长屏幕上初次挂载时因为内容未填满而连续触发加载。
    const threshold = window.innerWidth < 768 ? 400 : 800

    if (scrollTop + windowHeight >= documentHeight - threshold) {
      lastLoadAtRef.current = now
      setSize((prev) => prev + 1)
    }
  }, [isValidating, hasMore, setSize])

  // 自动加载更多（当滚动到底部附近时）
  useEffect(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  // 初始加载状态：首次加载且没有数据时显示加载动画
  const isInitialLoading = isLoading && dataList.length === 0

  // 性能优化：瀑布流分批渲染，避免一次性挂大量图片导致卡顿/掉帧
  const BATCH_SIZE = 20
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE)

  // 当筛选条件变化时，重置已渲染数量
  useEffect(() => {
    setRenderedCount(BATCH_SIZE)
  }, [filterKey])

  const renderedImages = useMemo(() => {
    return dataList.slice(0, renderedCount)
  }, [dataList, renderedCount])

  // 逐步增加渲染数量（仅在非筛选加载态时进行）
  useEffect(() => {
    if (isFiltering || isInitialLoading) return
    if (renderedCount >= dataList.length) return

    const timer = window.setTimeout(() => {
      setRenderedCount((prev) => Math.min(prev + BATCH_SIZE, dataList.length))
    }, 50)

    return () => window.clearTimeout(timer)
  }, [renderedCount, dataList.length, BATCH_SIZE, isFiltering, isInitialLoading])

  return (
    <div className="w-full min-h-screen bg-background text-foreground" ref={containerRef}>
      {/* 初始加载态：首次加载时显示 */}
      {isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">正在加载图片...</span>
          </div>
        </div>
      )}

      {/* 筛选加载态：筛选触发时显示 */}
      {isFiltering && !isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-muted-foreground border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">正在筛选图片...</span>
          </div>
        </div>
      )}
      
      {/* 图片列表：仅在非筛选加载态时显示 */}
      {!isFiltering && !isInitialLoading && (
        <>
          <VirtualImageGallery
            images={renderedImages}
            enableVirtualScroll={false}
          />
          
          {/* 错误提示 */}
          {error && !isValidating && (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <p className="text-sm text-red-400">筛选失败，请重试</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => mutate()}
                className="text-xs"
              >
                重试
              </Button>
            </div>
          )}
          
          {/* 无数据提示：仅在非加载态且无错误时显示 */}
          {!error && !isValidating && dataList.length === 0 && (
            <div className="flex items-center justify-center py-12">
              <p className="text-muted-foreground text-sm">暂无匹配的图片</p>
            </div>
          )}
        </>
      )}
    </div>
  )
}
