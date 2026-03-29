'use client'

import type { Config } from '~/types'
import { Drawer } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button, Switch } from 'antd'
import { useTranslations } from 'next-intl'
import { normalizeStorageFolder } from '~/lib/utils/storage'
import { Divider } from 'antd'

export default function COSEditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { cosEdit, setCosEdit, setCosEditData, cosData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  const keyOrder = useMemo(() => [
    'cos_secret_id',
    'cos_secret_key',
    'cos_region',
    'cos_endpoint',
    'cos_bucket',
    'cos_storage_folder',
    'cos_force_path_style',
    'cos_cdn',
    'cos_cdn_url',
    'cos_direct_download',
  ], [])

  function getVal(arr: Config[] | undefined, key: string): string {
    return (arr || []).find((c) => c.config_key === key)?.config_value || ''
  }

  function setVal(arr: Config[] | undefined, key: string, val: string): Config[] {
    return (arr || []).map((c) => {
      if (c.config_key === key) c.config_value = val
      return c
    })
  }

  function normalizeAndValidate(data: Config[] | undefined): { ok: boolean, next: Config[], message?: string } {
    const required = ['cos_secret_id', 'cos_secret_key', 'cos_region', 'cos_endpoint', 'cos_bucket']
    const missing = required.filter(k => !getVal(data, k))
    if (missing.length) {
      return { ok: false, next: data || [], message: `缺少必要配置：${missing.join(', ')}` }
    }

    let next = [...(data || [])]

    // endpoint ensure https
    const endpoint = getVal(next, 'cos_endpoint')
    if (endpoint && !/^https:\/\//i.test(endpoint)) {
      next = setVal(next, 'cos_endpoint', `https://${endpoint.replace(/^https?:\/\//i, '')}`)
    }

    // 规范化 storage_folder
    const storageFolder = normalizeStorageFolder(getVal(next, 'cos_storage_folder'))
    next = setVal(next, 'cos_storage_folder', storageFolder)

    // cdn url: if enable cdn then required
    const cosCdn = getVal(next, 'cos_cdn') === 'true'
    const cosCdnUrl = getVal(next, 'cos_cdn_url')
    if (cosCdn && !cosCdnUrl) {
      return { ok: false, next, message: '已开启 COS CDN，请填写 cos_cdn_url' }
    }

    return { ok: true, next }
  }

  const orderedData = useMemo(() => {
    const arr = cosData || []
    const map = new Map(arr.map(i => [i.config_key, i]))
    return keyOrder.map(k => map.get(k)).filter(Boolean) as Config[]
  }, [cosData, keyOrder])

  async function submit() {
    setLoading(true)
    try {
      const { ok, next, message } = normalizeAndValidate(cosData)
      if (!ok) {
        toast.error(message || '配置不完整')
        return
      }
      setCosEditData(next)
      await fetch('/api/v1/settings/update-cos-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(next),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      mutate('/api/v1/settings/cos-info')
      setCosEdit(false)
      setCosEditData([] as Config[])
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={t('Config.editCOS')}
      placement="left"
      size={400}
      open={cosEdit}
      onClose={() => {
        setCosEdit(false)
        setCosEditData([] as Config[])
      }}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: '#f9fafb' },
        body: { padding: '24px' },
      }}
    >
      <Divider titlePlacement="left" plain style={{ margin: '0 0 16px 0' }}>基础配置</Divider>

      <div className="flex flex-col space-y-4">
        {orderedData?.map((config: Config) => {
          const isSwitch = config.config_key === 'cos_force_path_style' || config.config_key === 'cos_cdn' || config.config_key === 'cos_direct_download'
          const isSecret = config.config_key === 'cos_secret_key'
          const isCdnUrl = config.config_key === 'cos_cdn_url'
          const cdnEnabled = getVal(cosData, 'cos_cdn') === 'true'

          if (isCdnUrl && !cdnEnabled) {
            return null
          }

          if (isSwitch) {
            return (
              <div
                key={config.id}
                className="flex flex-row items-center justify-between rounded-lg border bg-white p-3 shadow-sm"
              >
                <div className="flex flex-col gap-1">
                  <div className="text-sm font-medium text-gray-700">
                    {t('Config.' + config.config_key)}
                  </div>
                </div>
                <Switch
                  className="cursor-pointer"
                  checked={config.config_value === 'true'}
                  onChange={(value) => setCosEditData(
                    cosData?.map((c: Config) => {
                      if (c.config_key === config.config_key) {
                        return { ...c, config_value: value ? 'true' : 'false' }
                      }
                      if (c.config_key === 'cos_cdn_url' && config.config_key === 'cos_cdn' && !value) {
                        return { ...c, config_value: '' }
                      }
                      return c
                    })
                  )}
                />
              </div>
            )
          }

          return (
            <label
              htmlFor="text"
              key={config.id}
              className="block overflow-hidden rounded-md border border-gray-200 bg-white px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> {config.config_key} </span>

              <input
                type={isSecret ? 'password' : 'text'}
                id="name"
                value={config.config_value || ''}
                placeholder={t('Config.' + config.config_key)}
                onChange={(e) => setCosEditData(
                  cosData?.map((c: Config) => {
                    if (c.config_key === config.config_key) {
                      return { ...c, config_value: e.target.value }
                    }
                    return c
                  })
                )}
                className="mt-1 w-full border-none bg-transparent p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          )
        })}
        <Button type="primary" className="w-full mt-4 h-10" onClick={() => submit()} disabled={loading}>
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Config.submit')}
        </Button>
      </div>
    </Drawer>
  )
}

