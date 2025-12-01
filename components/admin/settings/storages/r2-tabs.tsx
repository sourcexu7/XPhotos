'use client'

import React from 'react'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import { toast } from 'sonner'
import { useButtonStore } from '~/app/providers/button-store-providers'
import R2EditSheet from '~/components/admin/settings/storages/r2-edit-sheet'
import { useTranslations } from 'next-intl'
import TabsTableCell from '~/components/admin/settings/storages/tabs-table-cell'
import { Card, Button, Table, Space, Typography, theme } from 'antd'
import { ReloadOutlined, EditOutlined } from '@ant-design/icons'

export default function R2Tabs() {
  const { data, error, isValidating, mutate } = useSWR('/api/v1/settings/r2-info', fetcher
    , { revalidateOnFocus: false })
  const { setR2Edit, setR2EditData } = useButtonStore(
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
    <Space vertical size={token.marginLG} style={{ width: '100%' }}>
      <Card
        title={<Typography.Title level={5} style={{ margin: 0 }}>{t('Config.r2Title')}</Typography.Title>}
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
                setR2Edit(true)
                setR2EditData(JSON.parse(JSON.stringify(data)))
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
      {Array.isArray(data) && data.length > 0 && <R2EditSheet />}
    </Space>
  )
}