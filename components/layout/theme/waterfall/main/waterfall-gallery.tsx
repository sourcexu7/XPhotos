'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from '~/components/ui/button.tsx'
import React, { useEffect, useRef } from 'react'
import { ImageGallery } from '~/components/ui/image-gallery'

export default function WaterfallGallery(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite(
    (index) => {
      return [`client-${props.args}-${index}-${props.album}`, index]
    },
    ([_, index]) => {
      return props.handle(index + 1, props.album)
    },
    {
      revalidateOnFocus: false,
      revalidateIfStale: false,
      revalidateOnReconnect: false,
    }
  )
  const dataList = data ? [].concat(...data) : []
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)

  // 自动加载更多（当滚动到底部附近时）
  useEffect(() => {
    const handleScroll = () => {
      if (!containerRef.current || isValidating || size >= pageTotal) return

      const scrollTop = window.scrollY
      const windowHeight = window.innerHeight
      const documentHeight = document.documentElement.scrollHeight

      // 当距离底部还有 800px 时开始加载
      if (scrollTop + windowHeight >= documentHeight - 800) {
        setSize(size + 1)
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [size, isValidating, pageTotal, setSize])

  return (
    <div className="w-full min-h-screen bg-[#0f172a] dark:bg-[#0f172a]" ref={containerRef}>
      {/* 瀑布流容器 - 使用新的 ImageGallery 组件 */}
      <ImageGallery images={dataList} />

      {/* 加载更多按钮 */}
      <div className="flex items-center justify-center pb-8 pt-4">
        {isValidating ? (
          <div className="flex items-center space-x-2 text-gray-400">
            <ReloadIcon className="h-5 w-5 animate-spin" />
            <span className="text-sm">{t('Button.loading')}</span>
          </div>
        ) : dataList.length > 0 ? (
          size < pageTotal && (
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
          )
        ) : (
          <p className="text-gray-400 text-sm">{t('Tips.noImg')}</p>
        )}
      </div>
    </div>
  )
}
