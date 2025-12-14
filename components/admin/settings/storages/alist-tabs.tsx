'use client'

import React from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import AlistEditSheet from '~/components/admin/settings/storages/alist-edit-sheet'
import { useTranslations } from 'next-intl'
import TabsTableCell from '~/components/admin/settings/storages/tabs-table-cell'
import { Card, Button, Table, Space, Typography, theme } from 'antd'
import { ReloadOutlined, EditOutlined } from '@ant-design/icons'

export default function AlistTabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/storage/alist/info', fetcher
    , { revalidateOnFocus: false })
  const { setAListEdit, setAListEditData } = useButtonStore(
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
      render: (_: unknown, record: { renderValue: () => unknown }) => record.renderValue(),
    },
  ]

  const tableData = data ? TabsTableCell({ data }) : []

  return (
    <Space vertical size={token.marginLG} style={{ width: '100%' }}>
      <Card
        title={<Typography.Title level={5} style={{ margin: 0 }}>{t('Config.alistTitle')}</Typography.Title>}
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
              type="primary"
              icon={<EditOutlined />}
              onClick={() => {
                setAListEdit(true)
                try {
                  const cloned = typeof structuredClone === 'function' ? structuredClone(data) : JSON.parse(JSON.stringify(data ?? {}))
                  setAListEditData(cloned)
                } catch {
                  setAListEditData(data ?? {})
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
      {Array.isArray(data) && data.length > 0 && <AlistEditSheet />}
    </Space>
  )
}