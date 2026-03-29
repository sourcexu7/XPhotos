'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

type CacheValue<T> = {
  size: number
  setAt: number
  pages: Array<T[]>
}

const DEFAULT_TTL = 10 * 60_000

function safeJsonParse<T>(raw: string | null): T | null {
  if (!raw) return null
  try {
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

export function useGalleryPageCache<T>(key: string, ttlMs: number = DEFAULT_TTL) {
  const storageKey = useMemo(() => `gallery:pages:${key}`, [key])

  const [cached, setCached] = useState<CacheValue<T> | null>(() => {
    if (typeof window === 'undefined') return null
    const v = safeJsonParse<CacheValue<T>>(sessionStorage.getItem(storageKey))
    if (!v) return null
    if (Date.now() - v.setAt > ttlMs) return null
    return v
  })

  const save = useCallback((value: CacheValue<T>) => {
    setCached(value)
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(value))
    } catch {
      // ignore
    }
  }, [storageKey])

  const clear = useCallback(() => {
    setCached(null)
    try {
      sessionStorage.removeItem(storageKey)
    } catch {
      // ignore
    }
  }, [storageKey])

  useEffect(() => {
    if (!cached) return
    if (Date.now() - cached.setAt > ttlMs) {
      clear()
    }
  }, [cached, ttlMs, clear])

  return {
    cached,
    save,
    clear,
  }
}

