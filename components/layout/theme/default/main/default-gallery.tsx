'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef, useMemo, useCallback } from 'react'
import { VirtualImageGallery } from '~/components/ui/virtual-image-gallery'

export default function DefaultGallery(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)

  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite(
    (index) => [`client-${props.args}-${index}-${props.album}`, index],
    ([_, index]) => props.handle(index + 1, props.album),
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    },
  )

  const dataList: ImageType[] = useMemo(
    () => (data ? ([] as ImageType[]).concat(...(data as ImageType[][])) : []),
    [data],
  )

  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)

  // hasMore：由 pageTotal 精确控制，防止死循环
  const hasMore = useMemo(() => {
    if (typeof pageTotal === 'number') return size < pageTotal
    return false
  }, [size, pageTotal])

  // 滚动加载节流：passive + rAF，与 waterfall-gallery 保持一致
  const handleScroll = useCallback(() => {
    if (isValidating || !hasMore) return
    const scrollTop = window.scrollY
    const windowHeight = window.innerHeight
    const docHeight = document.documentElement.scrollHeight
    if (scrollTop + windowHeight >= docHeight - 200) {
      setSize((s) => s + 1)
    }
  }, [isValidating, hasMore, setSize])

  useEffect(() => {
    let rafId = 0
    const onScroll = () => {
      cancelAnimationFrame(rafId)
      rafId = requestAnimationFrame(handleScroll)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(rafId)
    }
  }, [handleScroll])

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto max-w-[1400px] px-3 py-4 sm:px-4 sm:py-6 md:px-6"
    >
      {/* 初始加载 */}
      {isLoading && dataList.length === 0 && (
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-gray-400">正在加载图片...</span>
          </div>
        </div>
      )}

      {/* 虚拟化瀑布流：替换原 MasonryPhotoAlbum，消除全量 DOM 渲染 */}
      {dataList.length > 0 && (
        <VirtualImageGallery
          images={dataList}
          enableVirtualScroll={true}
          virtualScrollThreshold={30}
        />
      )}

      {/* 底部状态 */}
      <div className="flex items-center justify-center my-4 pb-4 text-sm text-gray-400">
        {isValidating && (
          <span className="inline-flex items-center gap-2">
            <ReloadIcon className="h-4 w-4 animate-spin" />
            {t('Button.loading')}
          </span>
        )}
        {!isValidating && error && (
          <button
            type="button"
            onClick={() => setSize(size)}
            className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
          >
            <span className="inline-block h-2 w-2 rounded-full bg-red-400" />
            {t('Tips.loadFail') ?? '加载失败，点击重试'}
          </button>
        )}
        {!isValidating && !error && dataList.length === 0 && (
          <span>{t('Tips.noImg')}</span>
        )}
      </div>
    </div>
  )
}
