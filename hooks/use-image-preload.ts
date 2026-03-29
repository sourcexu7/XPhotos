'use client'

import { useEffect, useMemo, useRef } from 'react'
import type { ImageType } from '~/types'

const DEFAULT_CONCURRENCY = 4

function pickUrl(img: ImageType): string | null {
  const u = (img as any)?.preview_url || (img as any)?.previewUrl || (img as any)?.url
  return typeof u === 'string' && u.length > 0 ? u : null
}

export function useImagePreload(images: ImageType[], start: number = 0, count: number = 0, concurrency = DEFAULT_CONCURRENCY) {
  const queue = useMemo(() => {
    const list = Array.isArray(images) ? images : []
    const slice = count > 0 ? list.slice(start, start + count) : list.slice(start)
    return slice.map(pickUrl).filter(Boolean) as string[]
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
        img.loading = 'eager'
        img.src = url

        const done = () => {
          inFlightRef.current--
          loadNext()
        }

        img.onload = done
        img.onerror = done
      }
    }

    loadNext()

    return () => {
      cancelled = true
    }
  }, [queue, concurrency])
}
