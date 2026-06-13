'use client'

import { useEffect, useState } from 'react'
import useSWR, { useSWRConfig } from 'swr'
import { Modal, message, Button, Space, theme } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { DashboardView, type PublicDashboardStats } from '~/components/public/dashboard/dashboard-view'
import AdminPageHeader from '~/components/admin/layout/page-header'

const fetcher = (url: string) => fetch(url).then((res) => res.json())

export default function DataOverviewPage() {
  const [mounted, setMounted] = useState(false)
  const [clearing, setClearing] = useState(false)
  const { mutate } = useSWRConfig()
  const { token } = theme.useToken()

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
      title: '确定要清空所有 Redis 缓存吗？',
      content: '清除后系统将从数据库重新拉取数据，可能短暂增加数据库压力。',
      okText: '确认清除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
      onOk: async () => {
        try {
          setClearing(true)
          const res = await fetch('/api/v1/settings/cache/clear', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          })
          if (!res.ok) throw new Error(`请求失败：${res.status}`)
          const body = await res.json().catch(() => ({}))
          const deleted = typeof body?.data?.deleted === 'number' ? body.data.deleted : undefined

          await mutate(
            (key) => typeof key === 'string' && key.startsWith('/api/'),
            undefined,
            { revalidate: true }
          )

          message.success(
            typeof deleted === 'number'
              ? `缓存已清除，共删除 ${deleted} 条 key`
              : '缓存已清除'
          )
        } catch (e) {
          console.error(e)
          message.error(e instanceof Error ? `清除失败：${e.message}` : '清除失败')
        } finally {
          setClearing(false)
        }
      },
    })
  }

  return (
    <div style={{ padding: token.marginLG }}>
      <AdminPageHeader title="数据一览" description="公开统计数据展示" />

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
            {clearing ? '正在清除…' : '一键清除 Redis 缓存'}
          </Button>
        </Space>
      </div>

      <DashboardView data={data} isLoading={isLoading} error={error} />
    </div>
  )
}
