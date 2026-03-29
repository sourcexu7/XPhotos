'use client'

import AlistTabs from '~/components/admin/settings/storages/alist-tabs'
import S3Tabs from '~/components/admin/settings/storages/s3-tabs'
import R2Tabs from '~/components/admin/settings/storages/r2-tabs'
import COSTabs from '~/components/admin/settings/storages/cos-tabs'
import { Tabs } from 'antd'
import AdminPageHeader from '~/components/admin/layout/page-header'
import { useTranslations } from 'next-intl'

export default function Storages() {
  const t = useTranslations()
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
      key: 'cos',
      label: 'Tencent COS',
      children: <COSTabs />
    },
    {
      key: 'alist',
      label: 'AList API',
      children: <AlistTabs />
    }
  ]

  return (
    <div className="space-y-4" style={{ height: '100%' }}>
      <AdminPageHeader
        title={t('Link.storages')}
        description={t('AdminHeader.storagesDesc')}
        breadcrumbs={[{ title: t('Link.settings') }, { title: t('Link.storages') }]}
      />
      <Tabs
        defaultActiveKey="s3"
        items={items}
        style={{ height: '100%' }}
      />
    </div>
  )
}