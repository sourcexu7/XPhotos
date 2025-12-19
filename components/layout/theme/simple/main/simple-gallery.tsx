'use client'

import type { HandleProps, ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated.ts'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef, useState, useMemo } from 'react'
import GalleryImage from '~/components/gallery/simple/gallery-image.tsx'
import { Button } from '~/components/ui/button'

export default function SimpleGallery(props: Readonly<ImageHandleProps>) {
  const cameras = props.filters?.cameras || []
  const lenses = props.filters?.lenses || []
  const tags = props.filters?.tags || []
  const tagsOperator = props.filters?.tagsOperator || 'and'
  const sortByShootTime = props.sortByShootTime
  
  const { data: pageTotal } = useSwrPageTotalHook(props)
  
  // 使用筛选条件和排序作为 key，筛选条件或排序变更时会自动重新请求
  const filterKey = JSON.stringify({ cameras, lenses, tags, tagsOperator, sortByShootTime })
  
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
  
  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)
  const dataList: ImageType[] = data ? ([] as ImageType[]).concat(...data) : []
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)
  
  // 筛选状态：是否有筛选条件
  const hasFilters = (cameras.length > 0 || lenses.length > 0 || tags.length > 0)
  
  // 跟踪上一次的筛选条件，用于检测筛选条件变更
  const prevFilterKeyRef = useRef<string>(filterKey)
  const [isFiltering, setIsFiltering] = useState(false)
  
  // 检测筛选条件变更，立即显示加载态（仅在有筛选条件时）
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      if (hasFilters) {
        setIsFiltering(true)
      } else {
        setIsFiltering(false)
      }
      prevFilterKeyRef.current = filterKey
    }
  }, [filterKey, hasFilters])
  
  // 数据加载完成后，关闭筛选加载态
  useEffect(() => {
    if (isFiltering && !isValidating && dataList.length > 0) {
      setIsFiltering(false)
    }
    // 如果筛选后无数据，也要关闭加载态
    if (isFiltering && !isValidating && dataList.length === 0) {
      setIsFiltering(false)
    }
  }, [isFiltering, isValidating, dataList.length])
  
  // 分批渲染：每次渲染 20 张图片
  const BATCH_SIZE = 20
  const [renderedCount, setRenderedCount] = useState(BATCH_SIZE)
  
  // 筛选条件变更时，重置渲染数量、size 并清空数据
  useEffect(() => {
    setRenderedCount(BATCH_SIZE)
    setSize(1) // 重置到第一页
    // 清空数据，触发重新请求
    mutate()
  }, [filterKey, mutate, setSize])
  
  // 逐步渲染：只渲染前 renderedCount 张图片
  const renderedImages = useMemo(() => {
    return dataList.slice(0, renderedCount)
  }, [dataList, renderedCount])

  // 自动触底加载更多（替换底部按钮）
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isValidating || size >= pageTotal) return

      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // 距离底部 100px 内触发加载
      if (scrollTop + windowHeight >= documentHeight - 100) {
        setSize(size + 1)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [isValidating, pageTotal, setSize, size])
  
  // 逐步渲染：当已渲染的图片数量小于总数量时，继续渲染下一批
  useEffect(() => {
    if (renderedCount >= dataList.length || isFiltering) return
    
    const timer = setTimeout(() => {
      setRenderedCount(prev => Math.min(prev + BATCH_SIZE, dataList.length))
    }, 50) // 每 50ms 渲染一批，保证流畅
    
    return () => clearTimeout(timer)
  }, [renderedCount, dataList.length, isFiltering])

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto max-w-[1400px] px-3 space-y-3 sm:px-4 sm:py-1 sm:space-y-4 md:px-6 md:space-y-6"
    >
      {/* 筛选加载态：筛选触发时显示 */}
      {isFiltering && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">正在筛选图片...</span>
          </div>
        </div>
      )}
      
      {/* 图片列表：仅在非筛选加载态时显示 */}
      {!isFiltering && (
        <>
          {renderedImages?.map((item: ImageType) => (
            <GalleryImage key={item.id} photo={item} configData={configData} />
          ))}

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

          {/* 加载状态 */}
          {!error && dataList.length > 0 && isValidating && (
            <div className="flex items-center justify-center my-4 pb-4 text-sm text-gray-400">
              <span className="inline-flex items-center gap-2">
                <ReloadIcon className="h-4 w-4 animate-spin" />
                {t('Button.loading')}
              </span>
            </div>
          )}
        </>
      )}
    </div>
  )
}
