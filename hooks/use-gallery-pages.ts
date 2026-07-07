'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { ImageType } from '~/types'

export type LayoutSlot = {
  id: string
  x: number
  y: number
  w: number
  h: number
}

export type GalleryPageLayout = {
  containerWidth: number
  cols: number
  gap: number
  slots: LayoutSlot[]
  nextColHeights: number[]
}

export type GalleryPage = {
  page: number
  pageSize: number
  pageTotal: number
  items: ImageType[]
  layout?: GalleryPageLayout
}

type Params = {
  album: string
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
  sortByShootTime?: 'asc' | 'desc'
  pageSize?: number
}

/** 布局参数：由前端测量后传入，后端用于预计算每张图的绝对定位 */
export type LayoutParams = {
  containerWidth: number
  cols: number
  gap: number
}

function buildUrl(params: Params, page: number, layoutParams?: LayoutParams, colHeights?: number[]): string {
  const q = new URLSearchParams()
  q.set('page', String(page))
  q.set('album', params.album)
  if (params.pageSize && params.pageSize > 0) q.set('pageSize', String(params.pageSize))
  if (params.cameras?.length) q.set('cameras', params.cameras.join(','))
  if (params.lenses?.length) q.set('lenses', params.lenses.join(','))
  if (params.tags?.length) {
    q.set('tags', params.tags.join(','))
    if (params.tagsOperator) q.set('tagsOperator', params.tagsOperator)
  }
  if (params.sortByShootTime) q.set('sortByShootTime', params.sortByShootTime)
  // 布局参数
  if (layoutParams) {
    q.set('containerWidth', String(layoutParams.containerWidth))
    q.set('cols', String(layoutParams.cols))
    q.set('gap', String(layoutParams.gap))
    if (colHeights && colHeights.length > 0) {
      q.set('colHeights', JSON.stringify(colHeights))
    }
  }
  return `/api/v1/public/gallery/images?${q.toString()}`
}

async function fetchPage(url: string): Promise<GalleryPage> {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json() as Promise<GalleryPage>
}

export function useGalleryPages(params: Params, softLimit = 400) {
  const [pages, setPages] = useState<GalleryPage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const paramsRef = useRef(params)
  paramsRef.current = params
  const isLoadingRef = useRef(false)
  const loadedPageRef = useRef(0)
  const totalPagesRef = useRef<number | null>(null)

  // 布局参数：前端测量后通过 setLayoutParams 传入
  const layoutParamsRef = useRef<LayoutParams | undefined>(undefined)
  // 上一页计算出的列高，传给后端做下一页的起点
  const lastColHeightsRef = useRef<number[] | undefined>(undefined)

  const [layoutParams, setLayoutParamsState] = useState<LayoutParams | undefined>(undefined)
  const setLayoutParams = useCallback((lp: LayoutParams) => {
    layoutParamsRef.current = lp
    setLayoutParamsState(lp)
  }, [])

  const loadNext = useCallback(async () => {
    if (isLoadingRef.current) return
    const next = loadedPageRef.current + 1
    const total = totalPagesRef.current
    if (total !== null && next > total) return

    isLoadingRef.current = true
    setIsLoading(true)
    setError(null)

    try {
      const url = buildUrl(
        paramsRef.current,
        next,
        layoutParamsRef.current,
        lastColHeightsRef.current,
      )
      const data = await fetchPage(url)
      totalPagesRef.current = data.pageTotal
      loadedPageRef.current = next

      // 保存本页结尾的列高，供下一页使用
      if (data.layout?.nextColHeights) {
        lastColHeightsRef.current = data.layout.nextColHeights
      }

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
  }, [])

  const reset = useCallback(() => {
    setPages([])
    setError(null)
    setIsLoading(false)
    isLoadingRef.current = false
    loadedPageRef.current = 0
    totalPagesRef.current = null
    lastColHeightsRef.current = undefined
  }, [])

  const hasMore = totalPagesRef.current === null
    ? true
    : loadedPageRef.current < totalPagesRef.current

  const allImages = pages.flatMap((p) => p.items)
  const atSoftLimit = allImages.length >= softLimit
  const shouldLoadNext = hasMore && !atSoftLimit

  // 所有页的 layout slots 合并（当后端返回了布局数据时使用）
  const allLayoutSlots: LayoutSlot[] | undefined = pages.every((p) => p.layout)
    ? pages.flatMap((p) => p.layout!.slots)
    : undefined

  // 最新一页的布局元数据（用于获取 totalHeight 等）
  const lastLayout = pages.length > 0 ? pages[pages.length - 1].layout : undefined

  const [hasRespondedOnce, setHasRespondedOnce] = useState(false)
  useEffect(() => {
    if (pages.length > 0 || error) setHasRespondedOnce(true)
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
    // 布局相关
    setLayoutParams,
    layoutParams,
    allLayoutSlots,
    lastLayout,
    lastColHeights: lastColHeightsRef.current,
  }
}
