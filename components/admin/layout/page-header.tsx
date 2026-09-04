'use client'

import { Breadcrumb, Space, Typography, theme } from 'antd'
import type { ReactNode } from 'react'

type BreadcrumbItem = {
  title: string
}

type AdminPageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
  toolbar?: ReactNode
}

export default function AdminPageHeader({ title, description, breadcrumbs, toolbar }: Readonly<AdminPageHeaderProps>) {
  const { token } = theme.useToken()

  return (
    <div style={{ marginBottom: token.marginMD, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: token.marginSM }}>
      <div>
        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} style={{ marginBottom: token.marginXS }} />
        )}
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text type="secondary">
            {description}
          </Typography.Text>
        )}
      </div>
      {toolbar && (
        <Space wrap>
          {toolbar}
        </Space>
      )}
    </div>
  )
}
