'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { theme } from 'antd'
import { useTranslations } from 'next-intl'
import AdminPageHeader from '~/components/admin/layout/page-header'

const TagManager = dynamic(
  () => import('~/components/admin/tags/tag-manager'),
  { ssr: false }
)

export default function AdminSettingsTagPage() {
  const { token } = theme.useToken()
  const t = useTranslations()
  return (
    <div className="space-y-4">
      <AdminPageHeader
        title={t('Link.tags')}
        description={t('AdminHeader.tagsDesc')}
        breadcrumbs={[{ title: t('Link.settings') }, { title: t('Link.tags') }]}
      />
      <div style={{ padding: token.paddingMD, background: token.colorBgLayout, minHeight: '100%', borderRadius: token.borderRadiusLG }}>
        <TagManager />
      </div>
    </div>
  )
}
