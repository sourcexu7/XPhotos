'use client'

import React from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import S3EditSheet from '~/components/admin/settings/storages/s3-edit-sheet'
import { useTranslations } from 'next-intl'
import TabsTableCell from '~/components/admin/settings/storages/tabs-table-cell'
import { Card, Button, Table, Space, Typography, theme } from 'antd'
import { ReloadOutlined, EditOutlined, SafetyOutlined } from '@ant-design/icons'

export default function S3Tabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/settings/s3-info', fetcher
    , { revalidateOnFocus: false })
  const { setS3Edit, setS3EditData } = useButtonStore(
    (state) => state,
  )
  const { token } = theme.useToken()
  const t = useTranslations()

  if (error) {
    toast.error(t('Config.requestFailed'))
  }

  const columns = [
    {
      title: 'Key',
      dataIndex: 'config_key',
      key: 'config_key',
    },
    {
      title: 'Value',
      key: 'value',
      render: (_: any, record: any) => record.renderValue(),
    },
  ]

  const tableData = data ? TabsTableCell({ data }) : []

  return (
    <Space orientation="vertical" size={token.marginLG} style={{ width: '100%' }}>
      <Card
        title={<Typography.Title level={5} style={{ margin: 0 }}>{t('Config.s3Title')}</Typography.Title>}
        extra={
          <Space>
            <Button
              icon={<ReloadOutlined spin={isValidating} />}
              loading={isValidating}
              onClick={() => mutate()}
            >
              {t('Config.refresh')}
            </Button>
            <Button
              icon={<SafetyOutlined />}
              onClick={async () => {
                try {
                  const res = await fetch('/api/v1/settings/validate-s3', { method: 'GET' })
                  const isJson = res.headers.get('content-type')?.includes('application/json')
                  const json = isJson ? await res.json() : null
                  if (!json || json.code !== 200) {
                    const text = await res.text().catch(() => '')
                    throw new Error(text || '验证失败')
                  }
                  const { bucket, endpoint, checks } = json.data || {}
                  const summary = [
                    `HeadBucket: ${checks?.headBucket || 'unknown'}`,
                    `PutObject: ${checks?.putObject || 'unknown'}`,
                    `GetObject: ${checks?.getObject || 'unknown'}`,
                    `DeleteObject: ${checks?.deleteObject || 'unknown'}`,
                  ].join(' | ')
                  toast.success(`S3 验证成功：${bucket} @ ${endpoint} — ${summary}`)
                } catch (e: any) {
                  toast.error(`S3 验证失败：${e?.message || ''}`)
                }
              }}
            >
              验证配置
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setS3Edit(true)
                try {
                  const cloned = typeof structuredClone === 'function' ? structuredClone(data) : JSON.parse(JSON.stringify(data ?? {}))
                  setS3EditData(cloned)
                } catch {
                  setS3EditData(data ?? {})
                }
              }}
            >
              {t('Config.edit')}
            </Button>
          </Space>
        }
        style={{ borderRadius: token.borderRadiusLG }}
      >
        {data && (
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            size="middle"
            rowKey="key"
          />
        )}
      </Card>
      {Array.isArray(data) && data.length > 0 && <S3EditSheet />}
    </Space>
  )
}