'use client'

import { Breadcrumb, Space, Typography } from 'antd'

type BreadcrumbItem = {
  title: string
}

type AdminPageHeaderProps = {
  title: string
  description?: string
  breadcrumbs?: BreadcrumbItem[]
}

export default function AdminPageHeader({ title, description, breadcrumbs }: Readonly<AdminPageHeaderProps>) {
  return (
    <div className="mb-4 md:mb-6">
      <Space orientation="vertical" size={4}>
        {Array.isArray(breadcrumbs) && breadcrumbs.length > 0 && (
          <Breadcrumb items={breadcrumbs} />
        )}
        <Typography.Title level={3} style={{ margin: 0 }}>
          {title}
        </Typography.Title>
        {description && (
          <Typography.Text type="secondary">
            {description}
          </Typography.Text>
        )}
      </Space>
    </div>
  )
}
