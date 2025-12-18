'use client'

import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import React, { useEffect, useRef } from 'react'
import { MasonryPhotoAlbum, RenderImageContext, RenderImageProps } from 'react-photo-album'
import BlurImage from '~/components/album/blur-image.tsx'

function renderNextImage(
  _: RenderImageProps,
  { photo }: RenderImageContext,
  dataList: never[],
) {
  return (
    <BlurImage photo={photo} dataList={dataList} />
  )
}

export default function DefaultGallery(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const { data, error, isLoading, isValidating, size, setSize } = useSWRInfinite(
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
  const dataList = data ? ([] as ImageType[]).concat(...data) : []
  const t = useTranslations()
  const containerRef = useRef<HTMLDivElement>(null)

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

  return (
    <div
      ref={containerRef}
      className="w-full mx-auto max-w-[1400px] px-3 py-4 space-y-4 sm:px-4 sm:py-6 md:px-6"
    >
      <div className="flex flex-col lg:flex-row w-full items-start justify-between lg:relative overflow-x-clip">
        {/* 左侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className="hidden lg:flex lg:flex-1 flex-col px-2 lg:sticky top-4 self-start">
        </div>
        
        {/* 中间内容区 - 响应式宽度 */}
        <div className="w-full lg:w-[66.667%] mx-auto">
          <MasonryPhotoAlbum
            columns={(containerWidth) => {
              if (containerWidth < 640) return 2
              if (containerWidth < 768) return 2
              if (containerWidth < 1024) return 3
              return 4
            }}
            photos={
              dataList?.map((item: ImageType) => ({
                src: item.preview_url || item.url,
                alt: item.detail,
                ...item
              })) || []
            }
            render={{image: (...args) => renderNextImage(...args, dataList)}}
          />
        </div>
        
        {/* 右侧边栏 - 桌面端显示，移动端隐藏 */}
        <div className="hidden lg:flex flex-wrap space-x-2 lg:space-x-0 lg:flex-col flex-1 px-2 py-1 lg:py-0 space-y-1 text-gray-500 lg:sticky top-4 self-start">
        </div>
      </div>
      
      {/* 加载状态 & 错误提示（无按钮） */}
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
            onClick={() => setSize(size)} // 触发当前页重试
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
