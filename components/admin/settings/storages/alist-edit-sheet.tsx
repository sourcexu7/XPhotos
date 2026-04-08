'use client'

import type { Config } from '~/types'
import { Drawer } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { useSWRConfig } from 'swr'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Button } from 'antd'
import { useTranslations } from 'next-intl'

export default function AlistEditSheet() {
  const [loading, setLoading] = useState(false)
  const { mutate } = useSWRConfig()
  const { aListEdit, setAListEdit, setAListEditData, aListData } = useButtonStore(
    (state) => state,
  )
  const t = useTranslations()

  async function submit() {
    setLoading(true)
    try {
      await fetch('/api/v1/settings/update-alist-info', {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'PUT',
        body: JSON.stringify(aListData),
      }).then(res => res.json())
      toast.success(t('Config.updateSuccess'))
      // Keep SWR key consistent with AlistTabs read key: /api/v1/settings/alist-info
      mutate('/api/v1/settings/alist-info')
      setAListEdit(false)
      setAListEditData([] as Config[])
    } catch (e) {
      toast.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={t('Config.editAlist')}
      placement="left"
      size={400}
      open={aListEdit}
      onClose={() => {
        setAListEdit(false)
        setAListEditData([] as Config[])
      }}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: 'var(--admin-bg-secondary)' },
        body: { padding: '24px' },
      }}
    >
      <div className="flex flex-col space-y-4">
        {
          aListData?.map((config: Config) => (
            <label
              htmlFor="text"
              key={config.id}
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
            >
              <span className="text-xs font-medium text-gray-700"> {config.config_key} </span>

              <input
                type="text"
                id="name"
                value={config.config_value || ''}
                placeholder={t('Config.' + config.config_key)}
                onChange={(e) => setAListEditData(
                  aListData?.map((c: Config) => {
                    if (c.config_key === config.config_key) {
                      return { ...c, config_value: e.target.value }
                    }
                    return c
                  })
                )}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          ))
        }
        <Button type="primary" className="w-full mt-4 h-10" onClick={() => submit()} disabled={loading}>
          {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
          {t('Config.submit')}
        </Button>
      </div>
    </Drawer>
  )
}