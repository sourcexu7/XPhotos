'use client'

import type { Config } from '~/types'
import { Drawer, theme } from 'antd'
import { useButtonStore } from '~/app/providers/button-store-providers'
import React, { useState } from 'react'
import { message } from 'antd'
import { useSWRConfig } from 'swr'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, Input } from 'antd'
import { useTranslations } from 'next-intl'

export default function AlistEditSheet() {
  const { token } = theme.useToken()
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
      message.success(t('Config.updateSuccess'))
      // Keep SWR key consistent with AlistTabs read key: /api/v1/settings/alist-info
      mutate('/api/v1/settings/alist-info')
      setAListEdit(false)
      setAListEditData([] as Config[])
    } catch (e) {
      message.error(t('Config.updateFailed'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <Drawer
      title={t('Config.editAlist')}
      placement="left"
      open={aListEdit}
      onClose={() => {
        setAListEdit(false)
        setAListEditData([] as Config[])
      }}
      mask={false}
      styles={{
        wrapper: { width: 400 },
        header: { padding: `${token.padding} ${token.paddingLG}`, background: token.colorBgElevated },
        body: { padding: token.paddingLG },
      }}
    >
      <div className="flex flex-col space-y-4">
        {
          aListData?.map((config: Config) => (
            <div key={config.id} className="w-full space-y-1">
              <label htmlFor={`config-${config.id}`} className="text-xs font-medium text-gray-700">
                {' '}{config.config_key}{' '}
              </label>
              <Input
                id={`config-${config.id}`}
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
                allowClear
              />
            </div>
          ))
        }
        <Button type="primary" className="w-full mt-4 h-10" onClick={() => submit()} disabled={loading}>
          {loading && <ReloadOutlined style={{ marginRight: 8, fontSize: 16 }} spin />}
          {t('Config.submit')}
        </Button>
      </div>
    </Drawer>
  )
}