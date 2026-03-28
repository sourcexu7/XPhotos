/**
 * 通用 loading 状态管理 Hook
 * 用于管理多个异步操作的 loading 状态
 */

import { useState, useCallback } from 'react'

export type LoadingState = Record<string, boolean>

export interface UseLoadingReturn<T extends LoadingState> {
  loading: T
  startLoading: (key: keyof T) => void
  stopLoading: (key: keyof T) => void
  withLoading: <R>(key: keyof T, fn: () => Promise<R>) => Promise<R | undefined>
  isLoading: (key: keyof T) => boolean
  resetLoading: () => void
}

export function useLoading<T extends LoadingState>(
  initialState: T
): UseLoadingReturn<T> {
  const [loading, setLoading] = useState<T>(initialState)

  const startLoading = useCallback((key: keyof T) => {
    setLoading((prev) => ({ ...prev, [key]: true }))
  }, [])

  const stopLoading = useCallback((key: keyof T) => {
    setLoading((prev) => ({ ...prev, [key]: false }))
  }, [])

  const withLoading = useCallback(
    async <R,>(key: keyof T, fn: () => Promise<R>): Promise<R | undefined> => {
      startLoading(key)
      try {
        const result = await fn()
        return result
      } finally {
        stopLoading(key)
      }
    },
    [startLoading, stopLoading]
  )

  const isLoading = useCallback(
    (key: keyof T) => {
      return loading[key]
    },
    [loading]
  )

  const resetLoading = useCallback(() => {
    setLoading(initialState)
  }, [initialState])

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
    isLoading,
    resetLoading,
  }
}
