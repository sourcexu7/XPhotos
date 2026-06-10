'use client'

import { memo, useEffect, useMemo, useRef, useCallback } from 'react'
import type { ImageHandleProps } from '~/types/props.ts'
import { useSwrPageTotalHook } from '~/hooks/use-swr-page-total-hook.ts'
import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import type { ImageType } from '~/types'
import { ReloadIcon } from '@radix-ui/react-icons'
import GalleryImage from '~/components/gallery/simple/gallery-image'

/**
 * 单列画廊（Simple Gallery）—— 性能优化版
 *
 * 关键改进：
 *  1) 用 IntersectionObserver sentinel 替代 window.scroll 监听，更省电、更稳定
 *  2) 系统配置（下载开关/原图开关）整页只拉一次，不随每张图独立 useSWR
 *  3) filterKey 稳定化：筛选变化时从第一页重取，避免旧数据残留
 *  4) 保留原 GalleryImage 的完整信息：标题、EXIF、标签、复制/下载/分享按钮
 */

function flattenImageData(data: ImageType[][] | undefined): ImageType[] {
  if (!data || data.length === 0) return []
  const result: ImageType[] = []
  for (let i = 0; i < data.length; i++) {
    const page = data[i]
    if (!Array.isArray(page)) continue
    for (let j = 0; j < page.length; j++) result.push(page[j])
  }
  return result
}

function SimpleGalleryImpl(props: Readonly<ImageHandleProps>) {
  const { data: pageTotal } = useSwrPageTotalHook(props)
  const pageTotalNumber: number = typeof pageTotal === 'number' ? pageTotal : 0

  // 稳定的筛选键（服务于 SWR cache key）
  const filterKey = useMemo(() => {
    const cameras = (props.filters?.cameras ?? []).join(',')
    const lenses = (props.filters?.lenses ?? []).join(',')
    const tags = (props.filters?.tags ?? []).join(',')
    const tagsOperator = props.filters?.tagsOperator ?? 'and'
    const sort = props.sortByShootTime ?? ''
    return [cameras, lenses, tags, tagsOperator, sort].join('|')
  }, [props.filters, props.sortByShootTime])

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    (index) => [`client-simple-${props.args}-${index}-${props.album}-${filterKey}`, index] as const,
    ([, pageIndex]) => {
      const f = props.filters
      return (
        props.handle?.(
          (pageIndex as number) + 1,
          props.album,
          f?.cameras,
          f?.lenses,
          f?.tags,
          f?.tagsOperator ?? 'and',
          props.sortByShootTime,
        ) || Promise.resolve([])
      )
    },
    {
      revalidateOnFocus: false,
      // 允许过期数据在 sentinel 触发下一页时重新请求；revalidateIfStale 默认为 true，
      // 之前关掉它会导致 key 变化后（比如筛选切换后）新页迟迟不发起请求。
      revalidateIfStale: true,
      revalidateOnReconnect: false,
      // 第一次滑到底时允许请求第一页；切换筛选后也允许触发新的请求。
      revalidateFirstPage: false,
    },
  )

  const dataList = useMemo(() => flattenImageData(data), [data])

  // 系统配置：整页只拉一次，传给每张 GalleryImage，避免每张独立 useSWR
  const configFetcher = useCallback(() => {
    if (typeof props.configHandle !== 'function') return []
    return props.configHandle()
  }, [props.configHandle])
  const { data: configData = [] } = useSWR(['simple-gallery-config'], configFetcher, {
    revalidateOnFocus: false,
    revalidateIfStale: false,
    revalidateOnReconnect: false,
  })

  // ========== Infinite Scroll：sentinel IO，替代原始 scroll+距离判断 ==========
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const isLoadingRef = useRef(isLoading)
  isLoadingRef.current = isLoading

  // 用 ref 保留最新的 loadNext 逻辑，避免 IO 因依赖变化反复重建。
  const loadNextRef = useRef<() => void>(() => {})
  loadNextRef.current = () => {
    if (isLoadingRef.current) return
    if (pageTotalNumber > 0 && size >= pageTotalNumber) return
    setSize((s) => s + 1)
  }

  // sentinel 在下方 JSX 中始终渲染（条件渲染外），这里在挂载时建立 IO。
  // 注意：ref 会在首次 commit 后被 React 赋值，所以 useEffect 运行时 el 一定存在。
  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) loadNextRef.current()
        }
      },
      { rootMargin: '400px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // 筛选键变化时回到第一页
  const prevFilterKeyRef = useRef<string>(filterKey)
  useEffect(() => {
    if (prevFilterKeyRef.current === filterKey) return
    prevFilterKeyRef.current = filterKey
    setSize(1)
  }, [filterKey, setSize])

  const isInitialLoading = isLoading && dataList.length === 0

  return (
    <>
      {/* 注入 shimmer keyframes（只注入一次） */}
      <style
        dangerouslySetInnerHTML={{
          __html: '@keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}',
        }}
      />

      <div className="w-full mx-auto max-w-[1400px] space-y-3 sm:space-y-4 md:space-y-6">
        {isInitialLoading && (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-3">
              <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin" />
              <span className="text-sm text-muted-foreground">正在加载图片...</span>
            </div>
          </div>
        )}

        {!isInitialLoading && dataList.length === 0 && !error && (
          <div className="flex items-center justify-center py-12">
            <p className="text-gray-400 text-sm">暂无匹配的图片</p>
          </div>
        )}

        {error && !isLoading && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <p className="text-sm text-red-400">加载失败，请重试</p>
            <button
              type="button"
              onClick={() => mutate()}
              className="inline-flex items-center gap-2 text-xs text-red-400 hover:text-red-300"
            >
              <ReloadIcon className="h-3 w-3" />
              重试
            </button>
          </div>
        )}

        {!isInitialLoading && dataList.length > 0 &&
          dataList.map((photo, i) => (
            <GalleryImage key={photo.id ?? i} photo={photo} configData={configData as { config_key: string; config_value: string }[]} />
          ))
        }

        {/* sentinel 始终挂载，避免首次加载时 ref 为空导致 IntersectionObserver 建立失败 */}
        <div ref={sentinelRef} style={{ height: 1 }} aria-hidden />

        {isValidating && dataList.length > 0 && (
          <div className="flex items-center justify-center my-4 pb-4 text-sm text-gray-400">
            <span className="inline-flex items-center gap-2">
              <ReloadIcon className="h-4 w-4 animate-spin" />
              加载中...
            </span>
          </div>
        )}
      </div>
    </>
  )
}

export const SimpleGallery = memo(SimpleGalleryImpl)
export default SimpleGallery
