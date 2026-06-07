'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageType } from '~/types'

export type GalleryPage = {
  page: number
  pageSize: number
  pageTotal: number
  items: ImageType[]
}

type Params = {
  album: string
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
  sortByShootTime?: 'asc' | 'desc'
}

function buildUrl(params: Params, page: number): string {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('album', params.album)
  if (params.cameras?.length) q.set('cameras', params.cameras.join(','))
  if (params.lenses?.length) q.set('lenses', params.lenses.join(','))
  if (params.tags?.length) {
    q.set('tags', params.tags.join(','))
    if (params.tagsOperator) q.set('tagsOperator', params.tagsOperator)
  }
  if (params.sortByShootTime) q.set('sortByShootTime', params.sortByShootTime)
  return `/api/v1/public/gallery/images?${q.toString()}`
}

async function fetchPage(url: string): Promise<GalleryPage> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<GalleryPage>
}

/**
 * 手动分页 hook，不依赖 SWR 缓存累积。
 * 所有可变状态用 ref 跟踪，避免 stale closure 导致重复请求或停止加载。
 *
 * 为了避免移动端 Safari 因无限加载导致内存/解码崩溃，
 * 提供 `softLimit` 软上限：超过后 `hasMore` 仍为 true，但
 * `shouldLoadNext` 变为 false，页面应切换到"点击加载更多"。
 */
export function useGalleryPages(params: Params, softLimit = 400) {
  const [pages, setPages] = useState<GalleryPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  // 用 ref 避免 callbacks 频繁重建
  const paramsRef = useRef(params)
  paramsRef.current = params
  const isLoadingRef = useRef(false)
  const loadedPageRef = useRef(0)
  const totalPagesRef = useRef<number | null>(null)
  // 服务器是否明确响应过一次（用于区分“尚未加载”和“真的无数据”）
  const hasRespondedRef = useRef(false)

  // loadNext 引用稳定，永不重建（内部通过 ref 读最新状态）
  const loadNext = useCallback(async () => {
    if (isLoadingRef.current) return
    const next = loadedPageRef.current + 1
    const total = totalPagesRef.current
    if (total !== null && next > total) return

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const url = buildUrl(paramsRef.current, next)
      const data = await fetchPage(url)
      totalPagesRef.current = data.pageTotal
      loadedPageRef.current = next
      hasRespondedRef.current = true
      setPages((prev) => {
        if (prev.some((p) => p.page === data.page)) return prev
        return [...prev, data]
      })
    } catch (e) {
      setError(e instanceof Error ? e : new Error(String(e)))
    } finally {
      isLoadingRef.current = false
      setIsLoading(false)
    }
  }, []) // 空依赖：所有可变值通过 ref 访问

  const reset = useCallback(() => {
    setPages([])
    setError(null)
    setIsLoading(false)
    isLoadingRef.current = false
    loadedPageRef.current = 0
    totalPagesRef.current = null
    hasRespondedRef.current = false
  }, [])

  const hasMore = totalPagesRef.current === null
    ? true
    : loadedPageRef.current < totalPagesRef.current

  const allImages = pages.flatMap((p) => p.items)
  // softLimit：达到软上限后，停止自动继续，提示用户点击"加载更多"
  const atSoftLimit = allImages.length >= softLimit
  const shouldLoadNext = hasMore && !atSoftLimit

  // 首次请求是否已经完成（用于空态/错误态的显示时机判断）
  const [hasRespondedOnce, setHasRespondedOnce] = useState(false)
  // 副作用：同步到 state，避免依赖 SSR 时 ref 与 state 不同步
  // 这里直接暴露 ref 并不合适（ref 不触发渲染），所以改用 state
  useEffect(() => {
    if (pages.length > 0 || error) {
      setHasRespondedOnce(true)
    }
  }, [pages, error])

  return {
    pages,
    allImages,
    isLoading,
    error,
    hasMore,
    shouldLoadNext,
    atSoftLimit,
    hasRespondedOnce,
    loadNext,
    reset,
  }
}
