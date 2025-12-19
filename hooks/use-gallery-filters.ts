/**
 * 画廊组件筛选逻辑公共 Hook
 * 提取 simple-gallery 和 waterfall-gallery 的重复逻辑
 */

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import type { ImageType } from '~/types'

/**
 * 生成稳定的筛选键，避免 JSON.stringify 的性能开销
 */
function createFilterKey(
  cameras: string[],
  lenses: string[],
  tags: string[],
  tagsOperator: string,
  sortByShootTime?: 'desc' | 'asc'
): string {
  return [
    cameras.join(','),
    lenses.join(','),
    tags.join(','),
    tagsOperator,
    sortByShootTime || '',
  ].join('|')
}

/**
 * 使用原生 for 循环扁平化数组，避免 concat 的性能开销
 */
function flattenImageData(data: ImageType[][] | undefined): ImageType[] {
  if (!data || data.length === 0) return []
  const result: ImageType[] = []
  for (let i = 0; i < data.length; i++) {
    if (Array.isArray(data[i])) {
      for (let j = 0; j < data[i].length; j++) {
        result.push(data[i][j])
      }
    }
  }
  return result
}

interface UseGalleryFiltersProps {
  cameras: string[]
  lenses: string[]
  tags: string[]
  tagsOperator: 'and' | 'or'
  sortByShootTime?: 'desc' | 'asc'
  data: ImageType[][] | undefined
  isValidating: boolean
  setSize: (size: number | ((size: number) => number)) => void
  mutate: () => void
}

export function useGalleryFilters({
  cameras,
  lenses,
  tags,
  tagsOperator,
  sortByShootTime,
  data,
  isValidating,
  setSize,
  mutate,
}: UseGalleryFiltersProps) {
  // 优化：使用稳定的筛选键生成函数
  const filterKey = useMemo(
    () => createFilterKey(cameras, lenses, tags, tagsOperator, sortByShootTime),
    [cameras, lenses, tags, tagsOperator, sortByShootTime]
  )

  // 优化：使用原生 for 循环扁平化数组
  const dataList = useMemo(() => flattenImageData(data), [data])

  // 优化：使用 useMemo 缓存筛选状态计算
  const hasFilters = useMemo(
    () => cameras.length > 0 || lenses.length > 0 || tags.length > 0,
    [cameras.length, lenses.length, tags.length]
  )

  // 跟踪上一次的筛选条件，用于检测筛选条件变更
  const prevFilterKeyRef = useRef<string>(filterKey)
  const [isFiltering, setIsFiltering] = useState(false)

  // 检测筛选条件变更，立即显示加载态（仅在有筛选条件时）
  useEffect(() => {
    if (prevFilterKeyRef.current !== filterKey) {
      if (hasFilters) {
        setIsFiltering(true)
      } else {
        setIsFiltering(false)
      }
      prevFilterKeyRef.current = filterKey
    }
  }, [filterKey, hasFilters])

  // 数据加载完成后，关闭筛选加载态
  useEffect(() => {
    if (isFiltering && !isValidating && dataList.length > 0) {
      setIsFiltering(false)
    }
    // 如果筛选后无数据，也要关闭加载态
    if (isFiltering && !isValidating && dataList.length === 0) {
      setIsFiltering(false)
    }
  }, [isFiltering, isValidating, dataList.length])

  // 筛选条件变更时，重置渲染数量、size 并清空数据
  useEffect(() => {
    setSize(1) // 重置到第一页
    // 清空数据，触发重新请求
    mutate()
  }, [filterKey, mutate, setSize])

  return {
    filterKey,
    dataList,
    hasFilters,
    isFiltering,
  }
}

