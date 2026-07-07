'use client'

import { useCallback, useEffect, useMemo, useRef } from 'react'

type CacheValue<T> = {
  size: number
  setAt: number
  pages: Array<T[]>
}

const DEFAULT_TTL = 5 * 60_000
// 单条缓存上限 150KB，防止移动端 OOM
const MAX_ENTRY_BYTES = 150 * 1024

function isSessionStorageAvailable(): boolean {
  // Safari 私人浏览模式下 sessionStorage 可能抛 SecurityError
  try {
    const k = '__ss_test__'
    sessionStorage.setItem(k, '1')
    sessionStorage.removeItem(k)
    return true
  } catch {
    return false
  }
}

const SS_AVAILABLE = typeof window !== 'undefined' && isSessionStorageAvailable()

function ssGet(key: string): string | null {
  if (!SS_AVAILABLE) return null
  try { return sessionStorage.getItem(key) } catch { return null }
}

function ssSet(key: string, value: string): void {
  if (!SS_AVAILABLE) return
  try {
    sessionStorage.setItem(key, value)
  } catch {
    // QuotaExceededError：清掉所有 gallery 缓存后重试
    pruneAll()
    try { sessionStorage.setItem(key, value) } catch { /* give up */ }
  }
}

function ssDel(key: string): void {
  if (!SS_AVAILABLE) return
  try { sessionStorage.removeItem(key) } catch { /* ignore */ }
}

function pruneAll(): void {
  if (!SS_AVAILABLE) return
  try {
    const toDelete: string[] = []
    for (let i = 0; i < sessionStorage.length; i++) {
      const k = sessionStorage.key(i)
      if (k?.startsWith('gallery:pages:')) toDelete.push(k)
    }
    toDelete.forEach((k) => { try { sessionStorage.removeItem(k) } catch {} })
  } catch { /* ignore */ }
}

export function useGalleryPageCache<T>(key: string, ttlMs: number = DEFAULT_TTL) {
  const storageKey = useMemo(() => `gallery:pages:${key}`, [key])

  // 用 ref 存缓存值，不触发 re-render
  const cachedRef = useRef<CacheValue<T> | null>(null)

  // 初始化时从 sessionStorage 读取
  useEffect(() => {
    const raw = ssGet(storageKey)
    if (!raw) return
    try {
      const v = JSON.parse(raw) as CacheValue<T>
      if (Date.now() - v.setAt <= ttlMs) {
        cachedRef.current = v
      } else {
        ssDel(storageKey)
      }
    } catch {
      ssDel(storageKey)
    }
  // 只在 key 变化时重新读取
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey])

  const save = useCallback((value: CacheValue<T>) => {
    cachedRef.current = value
    try {
      const serialized = JSON.stringify(value)
      if (serialized.length <= MAX_ENTRY_BYTES) {
        ssSet(storageKey, serialized)
      }
    } catch { /* ignore serialization errors */ }
  }, [storageKey])

  const clear = useCallback(() => {
    cachedRef.current = null
    ssDel(storageKey)
  }, [storageKey])

  return {
    get cached() { return cachedRef.current },
    save,
    clear,
  }
}
