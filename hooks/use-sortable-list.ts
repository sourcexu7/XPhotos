'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'

interface SortableItem {
  id: string
  sort: number
}

interface UseSortableListOptions<T extends SortableItem> {
  onSave?: (items: T[]) => Promise<void>
  onSuccess?: () => void
  onError?: () => void
  successMessage?: string
  errorMessage?: string
}

export function useSortableList<T extends SortableItem>(
  initialItems: T[] = [],
  options: UseSortableListOptions<T> = {}
) {
  const {
    onSave,
    onSuccess,
    onError,
    successMessage = '排序已保存',
    errorMessage = '调整失败，请重试',
  } = options

  const [items, setItems] = useState<T[]>(initialItems)
  const [prevItems, setPrevItems] = useState<T[]>(initialItems)
  const [saving, setSaving] = useState(false)

  // 重新计算排序值
  const recalcSortValues = useCallback((list: T[]): T[] => {
    if (!list.length) return list
    return list.map((item, idx) => ({
      ...item,
      sort: idx,
    }))
  }, [])

  // 保存排序
  const persistSort = useCallback(async (newItems: T[]) => {
    if (!onSave) return

    setPrevItems(items)
    const withSort = recalcSortValues(newItems)
    setItems(withSort)
    setSaving(true)

    try {
      await onSave(withSort)
      toast.success(successMessage)
      onSuccess?.()
    } catch {
      toast.error(errorMessage)
      setItems(prevItems)
      onError?.()
    } finally {
      setSaving(false)
    }
  }, [items, prevItems, onSave, recalcSortValues, successMessage, errorMessage, onSuccess, onError])

  // 上移
  const moveUp = useCallback((index: number) => {
    if (index <= 0 || items.length <= 1 || saving) return
    const next = [...items]
    ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
    void persistSort(next)
  }, [items, saving, persistSort])

  // 下移
  const moveDown = useCallback((index: number) => {
    if (index >= items.length - 1 || items.length <= 1 || saving) return
    const next = [...items]
    ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
    void persistSort(next)
  }, [items, saving, persistSort])

  // 置顶
  const pinTop = useCallback((index: number) => {
    if (index <= 0 || items.length <= 1 || saving) return
    const next = [...items]
    const [item] = next.splice(index, 1)
    next.unshift(item)
    void persistSort(next)
  }, [items, saving, persistSort])

  // 更新项目
  const updateItems = useCallback((newItems: T[]) => {
    setItems(newItems)
    setPrevItems(newItems)
  }, [])

  // 禁用状态
  const disableUp = useCallback((index: number) => index <= 0 || saving, [saving])
  const disableDown = useCallback((index: number) => index >= items.length - 1 || saving, [items.length, saving])
  const disablePin = useCallback((index: number) => index <= 0 || saving, [saving])

  return {
    items,
    setItems: updateItems,
    saving,
    moveUp,
    moveDown,
    pinTop,
    disableUp,
    disableDown,
    disablePin,
  }
}
