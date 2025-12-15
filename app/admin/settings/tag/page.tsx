'use client'
import React from 'react'
import dynamic from 'next/dynamic'
import { theme } from 'antd'

const TagManager = dynamic(
  () => import('~/components/admin/tags/tag-manager'),
  { ssr: false }
)

export default function AdminSettingsTagPage() {
  const { token } = theme.useToken()
  return (
    <div style={{ padding: token.paddingMD, background: token.colorBgLayout, minHeight: '100%', borderRadius: token.borderRadiusLG }}>
      <TagManager />
    </div>
  )
}
