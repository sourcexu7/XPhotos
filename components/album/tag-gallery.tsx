'use client'

import type { ImageHandleProps } from '~/types/props'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook'
import useSWRInfinite from 'swr/infinite'
import { useTranslations } from 'next-intl'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import React, { useEffect, useMemo, useCallback } from 'react'
import { VirtualImageGallery } from '~/components/ui/virtual-image-gallery'
import { SparklesIcon } from '~/components/icons/sparkles'
import { UndoIcon } from '~/components/icons/undo'
import { useRouter } from 'next-nprogress-bar'

export default function TagGallery(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)

  const { data, isLoading, isValidating, size, setSize } = useSWRInfinite(
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
  const router = useRouter()

  const hasMore = useMemo(() => {
    if (typeof pageTotal === 'number') return size < pageTotal
    return false
  }, [size, pageTotal])

  // 无限滚动（取代手动按钮），passive + rAF 节流
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

  const exifIconClass = 'text-muted-foreground !p-0 w-[18px] h-[18px]'
  const exifTextClass = 'text-tiny text-sm select-none items-center text-muted-foreground leading-[18px] m-0'

  return (
    <div className="w-full p-2 space-y-4">
      {/* 标签 + 返回 */}
      <div className="flex items-center justify-between px-2 pt-1">
        <div className="flex items-center space-x-2">
          <SparklesIcon className={exifIconClass} size={18} />
          <p className={exifTextClass}>{props.album}</p>
        </div>
        <div className="flex items-center space-x-2 cursor-pointer" onClick={() => router.back()}>
          <UndoIcon className={exifIconClass} size={18} />
          <p className={exifTextClass}>{t('Button.goBack')}</p>
        </div>
      </div>

      {/* 初始加载 */}
      {isLoading && dataList.length === 0 && (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-white/20 border-t-white rounded-full animate-spin" />
            <span className="text-sm text-muted-foreground">正在加载图片...</span>
          </div>
        </div>
      )}

      {/* 虚拟化瀑布流：替换原 MasonryPhotoAlbum */}
      {dataList.length > 0 && (
        <VirtualImageGallery
          images={dataList}
          enableVirtualScroll={true}
          virtualScrollThreshold={30}
        />
      )}

      {/* 底部状态 */}
      <div className="flex items-center justify-center my-4">
        {isValidating && (
          <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
        )}
        {!isValidating && !isLoading && dataList.length === 0 && (
          <span className="text-muted-foreground text-sm">{t('Tips.noImg')}</span>
        )}
      </div>
    </div>
  )
}
