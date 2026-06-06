'use client'

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
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

const VALID_STORAGES = new Set(['s3', 'cos', 'r2', 'alist'])

export function useStorageConfig() {
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>(
    '/api/v1/settings/get-custom-info',
    fetcher,
  )

  const defaultStorage =
    configs?.find((c) => c.config_key === 'default_storage')?.config_value?.trim().toLowerCase() || ''
  const initialStorage = VALID_STORAGES.has(defaultStorage) ? defaultStorage : 's3'

  const [config, setConfigState] = useState<StorageConfig>({
    storage: '',
    alistMountPath: '',
    alistStorage: [],
    isStorageSelect: false,
  })

  // 用接口返回的 default_storage 作为默认值（只在接口第一次返回后写入一次，避免覆盖用户手动选择）
  useEffect(() => {
    if (!initialStorage) return
    setConfigState((prev) => {
      if (prev.storage) return prev
      return { ...prev, storage: initialStorage }
    })
  }, [initialStorage])

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
