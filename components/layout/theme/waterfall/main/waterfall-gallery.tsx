'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React, { useEffect, useRef, useState, useMemo, useCallback } from 'react'
import { ImageGallery } from '~/components/ui/image-gallery'
import { useGalleryFilters } from '~/hooks/use-gallery-filters'

export default function WaterfallGallery(props: Readonly<ImageHandleProps>) {
  const cameras = props.filters?.cameras || []
  const lenses = props.filters?.lenses || []
  const tags = props.filters?.tags || []
  const tagsOperator = props.filters?.tagsOperator || 'and'
  const sortByShootTime = props.sortByShootTime
  
  const { data: pageTotal } = useSwrPageTotalHook(props)
  
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
  
  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    (index) => {
      return [`client-${props.args}-${index}-${props.album}-${filterKey}`, index]
    },
    ([_, index]) => {
      return props.handle(
        index + 1,
        props.album,
        cameras.length > 0 ? cameras : undefined,
        lenses.length > 0 ? lenses : undefined,
        tags.length > 0 ? tags : undefined,
        tagsOperator,
        sortByShootTime
      )
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )
  
  // 优化：使用公共 Hook 提取筛选逻辑，消除重复代码
  const { dataList, isFiltering } = useGalleryFilters({
    cameras,
    lenses,
    tags,
    tagsOperator,
    sortByShootTime,
    data,
    isValidating,
    setSize,
    mutate,
  })
  
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 分批渲染：每次渲染 20 张图片
  const BATCH_SIZE = 20
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE)
  
  // 筛选条件变更时，重置渲染数量
  useEffect(() => {
    setRenderedCount(BATCH_SIZE)
  }, [filterKey])
  
  // 逐步渲染：只渲染前 renderedCount 张图片
  const renderedImages = useMemo(() => {
    return dataList.slice(0, renderedCount)
  }, [dataList, renderedCount])
  
  // 优化：使用 useCallback 缓存滚动处理函数，避免每次渲染都创建新函数
  const handleScroll = useCallback(() => {
    if (!containerRef.current || isValidating || size >= pageTotal) return

    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const documentHeight = document.documentElement.scrollHeight

    // 当距离底部还有 800px 时开始加载
    if (scrollTop + windowHeight >= documentHeight - 800) {
      setSize(size + 1)
    }
  }, [isValidating, size, pageTotal, setSize])

  // 自动加载更多（当滚动到底部附近时）
  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])
  
  // 逐步渲染：当已渲染的图片数量小于总数量时，继续渲染下一批
  useEffect(() => {
    if (renderedCount >= dataList.length || isFiltering) return
    
    const timer = setTimeout(() => {
      setRenderedCount(prev => Math.min(prev + BATCH_SIZE, dataList.length))
    }, 50) // 每 50ms 渲染一批，保证流畅
    
    return () => clearTimeout(timer)
  }, [renderedCount, dataList.length, isFiltering])

  // 初始加载状态：首次加载且没有数据时显示加载动画
  const isInitialLoading = isLoading && dataList.length === 0

  return (
    <div className="w-full min-h-screen bg-[#0f172a] dark:bg-[#0f172a]" ref={containerRef}>
      {/* 初始加载态：首次加载时显示 */}
      {isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">正在加载图片...</span>
          </div>
        </div>
      )}

      {/* 筛选加载态：筛选触发时显示 */}
      {isFiltering && !isInitialLoading && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">正在筛选图片...</span>
          </div>
        </div>
      )}
      
      {/* 图片列表：仅在非筛选加载态时显示 */}
      {!isFiltering && !isInitialLoading && (
        <>
          <ImageGallery images={renderedImages} />
          
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
              <p className="text-gray-400 text-sm">暂无匹配的图片</p>
            </div>
          )}
          
          {/* 加载更多按钮 */}
          {!error && dataList.length > 0 && (
            <div className="flex items-center justify-center pb-8 pt-4">
              {isValidating ? (
                <div className="flex items-center space-x-2 text-gray-400">
                  <ReloadIcon className="h-5 w-5 animate-spin" />
                  <span className="text-sm">{t('Button.loading')}</span>
                </div>
              ) : size < pageTotal ? (
                <Button
                  disabled={isLoading}
                  onClick={() => {
                    setSize(size + 1)
                  }}
                  variant="outline"
                  className="select-none cursor-pointer border-gray-200 hover:border-gray-400 transition-colors"
                  aria-label={t('Button.loadMore')}
                >
                  {t('Button.loadMore')}
                </Button>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  )
}
