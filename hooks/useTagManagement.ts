'use client'

import { useState, useCallback } from 'react'

interface UseTagManagementOptions {
  onCascaderChange?: (value: string[]) => void
}

interface TagState {
  labels: string[]
  primarySelect: string | null
  secondarySelect: string[]
  cascaderValue: string[]
}

export function useTagManagement(options: UseTagManagementOptions = {}) {
  const [state, setState] = useState<TagState>({
    labels: [],
    primarySelect: null,
    secondarySelect: [],
    cascaderValue: [],
  })

  const togglePresetTag = useCallback((tag: string) => {
    if (!tag || typeof tag !== 'string' || tag.trim() === '') return

    const trimmedTag = tag.trim()

    setState(prev => {
      const existingIndex = prev.labels.findIndex(
        t => t.trim().toLowerCase() === trimmedTag.toLowerCase()
      )

      let newLabels: string[]
      if (existingIndex >= 0) {
        newLabels = prev.labels.filter((_, i) => i !== existingIndex)
      } else {
        newLabels = Array.from(new Set([...prev.labels, trimmedTag].map(v => v.trim()))).filter(Boolean)
      }

      return { ...prev, labels: newLabels }
    })
  }, [])

  const handleLabelsChange = useCallback((vals: string[]) => {
    const cleanedVals = Array.isArray(vals)
      ? vals.filter((v) => v && typeof v === 'string' && v.trim() !== '')
      : []

    const uniqueVals = Array.from(new Set(cleanedVals.map(v => v.trim()))).filter(Boolean)

    setState(prev => {
      const cascaderTags = prev.cascaderValue.filter(
        (v) => v && typeof v === 'string' && v.trim() !== ''
      )
      const allCascaderTagsRemoved = cascaderTags.every(
        tag => !uniqueVals.includes(tag.trim())
      )

      const newState = { ...prev, labels: uniqueVals }

      if (allCascaderTagsRemoved) {
        newState.cascaderValue = []
        newState.primarySelect = null
        newState.secondarySelect = []
      }

      return newState
    })
  }, [])

  const handleCascaderChange = useCallback((value: string[]) => {
    if (!value || value.length === 0) {
      setState(prev => ({ ...prev, cascaderValue: [] }))
      options.onCascaderChange?.(value)
      return
    }

    const [primary, ...secondary] = value
    const toAdd: string[] = [primary, ...secondary].filter(
      (v) => v && typeof v === 'string' && v.trim() !== ''
    )

    setState(prev => {
      const baseLabels = Array.isArray(prev.labels) ? [...prev.labels] : []
      const labelSet = new Set(baseLabels.map(v => v.trim()))
      toAdd.forEach(v => {
        if (v && v.trim() !== '') {
          labelSet.add(v.trim())
        }
      })

      return {
        ...prev,
        cascaderValue: value,
        primarySelect: primary || null,
        secondarySelect: secondary.filter((v) => v && typeof v === 'string'),
        labels: Array.from(labelSet).filter(Boolean),
      }
    })

    options.onCascaderChange?.(value)
  }, [options])

  const applyBatchLabels = useCallback((batchLabels: string[]) => {
    setState(prev => {
      const currentLabels = Array.isArray(prev.labels) ? prev.labels : []
      const newLabels = [...currentLabels]
      batchLabels.forEach(tag => {
        if (!newLabels.includes(tag)) newLabels.push(tag)
      })
      return { ...prev, labels: Array.from(new Set(newLabels)) }
    })
  }, [])

  const setLabels = useCallback((labels: string[]) => {
    setState(prev => ({ ...prev, labels }))
  }, [])

  const setTagState = useCallback((newState: Partial<TagState>) => {
    setState(prev => ({ ...prev, ...newState }))
  }, [])

  const clearTags = useCallback(() => {
    setState({
      labels: [],
      primarySelect: null,
      secondarySelect: [],
      cascaderValue: [],
    })
  }, [])

  return {
    ...state,
    togglePresetTag,
    handleLabelsChange,
    handleCascaderChange,
    applyBatchLabels,
    setLabels,
    setState: setTagState,
    clearTags,
  }
}
