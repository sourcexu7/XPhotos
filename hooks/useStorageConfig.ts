'use client'

import { useState, useCallback } from 'react'
import { toast } from 'sonner'
import { getAlistStorage } from '~/lib/utils/uploadUtils'

interface AlistStorage {
  mount_path: string
}

interface StorageConfig {
  storage: string
  alistMountPath: string
  alistStorage: AlistStorage[]
  isStorageSelect: boolean
}

export function useStorageConfig() {
  const [config, setConfigState] = useState<StorageConfig>({
    storage: 's3',
    alistMountPath: '',
    alistStorage: [],
    isStorageSelect: false,
  })

  const loadAlistStorage = useCallback(async () => {
    if (config.alistStorage.length > 0) {
      setConfigState(prev => ({ ...prev, isStorageSelect: true }))
      return
    }

    try {
      const storageList = await getAlistStorage()
      setConfigState(prev => ({
        ...prev,
        alistStorage: storageList,
        isStorageSelect: storageList.length > 0,
      }))
    } catch (e) {
      console.error('Failed to load AList storage', e)
    }
  }, [config.alistStorage.length])

  const handleStorageChange = useCallback((storage: string) => {
    setConfigState(prev => ({ ...prev, storage }))
    if (storage === 'alist') {
      loadAlistStorage()
    } else {
      setConfigState(prev => ({ ...prev, isStorageSelect: false }))
    }
  }, [loadAlistStorage])

  const handleAlistMountPathChange = useCallback((mountPath: string) => {
    setConfigState(prev => ({ ...prev, alistMountPath: mountPath }))
  }, [])

  const setConfig = useCallback((newConfig: Partial<StorageConfig>) => {
    setConfigState(prev => ({ ...prev, ...newConfig }))
  }, [])

  const storages = [
    { label: 'Cloudflare R2', value: 'r2' },
    { label: 'Amazon S3', value: 's3' },
    { label: 'Tencent COS', value: 'cos' },
    { label: 'AList API', value: 'alist' },
  ]

  return {
    ...config,
    storages,
    handleStorageChange,
    handleAlistMountPathChange,
    loadAlistStorage,
    setConfig,
  }
}
