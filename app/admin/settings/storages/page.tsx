'use client'

import AlistTabs from '~/components/admin/settings/storages/alist-tabs'
import S3Tabs from '~/components/admin/settings/storages/s3-tabs'
import R2Tabs from '~/components/admin/settings/storages/r2-tabs'
import { Tabs } from 'antd'

export default function Storages() {
  const items = [
    {
      key: 's3',
      label: 'Amazon S3',
      children: <S3Tabs />
    },
    {
      key: 'r2',
      label: 'Cloudflare R2',
      children: <R2Tabs />
    },
    {
      key: 'alist',
      label: 'AList API',
      children: <AlistTabs />
    }
  ]

  return (
    <div style={{ height: '100%' }}>
      <Tabs
        defaultActiveKey="s3"
        items={items}
        style={{ height: '100%' }}
      />
    </div>
  )
}