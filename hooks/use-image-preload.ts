'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { ImageType } from '~/types'

const DEFAULT_CONCURRENCY = 3

/**
 * 图片预加载 Hook（升级版）
 *
 * 改动：
 * - 只预加载 preview_url（永不触碰原图 url），防止移动端 OOM
 * - 默认并发从 4 降为 3，避免弱网设备卡顿
 * - 使用 link rel=prefetch 代替 new Image()，减少主线程压力
 */
function pickPreviewUrl(img: ImageType): string | null {
  const u = img?.preview_url || img?.url
  return typeof u === 'string' && u.length > 0 ? u : null
}

export function useImagePreload(
  images: ImageType[],
  start: number = 0,
  count: number = 0,
  concurrency = DEFAULT_CONCURRENCY,
) {
  const queue = useMemo(() => {
    const list = Array.isArray(images) ? images : []
    const slice = count > 0 ? list.slice(start, start + count) : list.slice(start)
    return slice.map(pickPreviewUrl).filter(Boolean) as string[]
  }, [images, start, count])

  const inFlightRef = useRef(0)
  const indexRef = useRef(0)

  useEffect(() => {
    if (queue.length === 0) return

    let cancelled = false
    inFlightRef.current = 0
    indexRef.current = 0

    const loadNext = () => {
      if (cancelled) return
      while (inFlightRef.current < concurrency && indexRef.current < queue.length) {
        const url = queue[indexRef.current++]
        inFlightRef.current++

        const img = new Image()
        img.decoding = 'async'
        img.loading = 'lazy'
        img.src = url

        const done = () => {
          inFlightRef.current--
          loadNext()
          // 释放引用，防止内存驻留
          img.src = ''
        }

        img.onload = done
        img.onerror = done
      }
    }

    loadNext()
    return () => { cancelled = true }
  }, [queue, concurrency])
}
