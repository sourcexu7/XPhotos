'use client'

import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Modal, message, Button, Space, theme } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { DashboardView, type PublicDashboardStats } from '~/components/public/dashboard/dashboard-view'
import AdminPageHeader from '~/components/admin/layout/page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DataOverviewPage() {
  const [mounted, setMounted] = useState(false)
  const [clearing, setClearing] = useState(false)
  const { mutate } = useSWRConfig()
  const { token } = theme.useToken()
  const t = useTranslations('DataOverview')

  useEffect(() => {
    setMounted(true)
  }, [])

  const { data, error, isLoading } = useSWR<PublicDashboardStats>(
    mounted ? '/api/v1/public/dashboard' : null,
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      dedupingInterval: 60000,
    }
  )

  const handleClearCache = () => {
    Modal.confirm({
      title: t('clearConfirmTitle'),
      content: t('clearConfirmContent'),
      okText: t('clearConfirmOk'),
      cancelText: t('clearConfirmCancel'),
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          setClearing(true)
          const res = await fetch('/api/v1/settings/cache/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) throw new Error(t('clearRequestFailed', { status: res.status }))
          const body = await res.json().catch(() => ({}))
          const deleted = typeof body?.data?.deleted === 'number' ? body.data.deleted : undefined

          await mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/'),
            undefined,
            { revalidate: true }
          )

          message.success(
            typeof deleted === 'number'
              ? t('clearSuccessWithCount', { count: deleted })
              : t('clearSuccess')
          )
        } catch (e) {
          console.error(e)
          message.error(e instanceof Error ? t('clearFailed', { message: e.message }) : t('clearFailedDefault'))
        } finally {
          setClearing(false)
        }
      },
    })
  }

  return (
    <div style={{ padding: token.marginLG }}>
      <AdminPageHeader title={t('title')} description={t('description')} />

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: token.margin,
        }}
      >
        <div />
        <Space>
          <Button
            danger
            icon={<ReloadOutlined />}
            onClick={handleClearCache}
            loading={clearing}
          >
            {clearing ? t('clearing') : t('clearCache')}
          </Button>
        </Space>
      </div>

      <DashboardView data={data} isLoading={isLoading} error={error} />
    </div>
  )
}
