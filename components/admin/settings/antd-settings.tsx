'use client'

import React from 'react'
import AntdForm from '~/components/admin/form/antd-form'
import { Card } from 'antd'

export default function AntdSettings({ initialValues, onSave }: { initialValues?: any; onSave?: (v: any) => void }) {
  return (
    <Card title="设置">
      <AntdForm initialValues={initialValues} onFinish={onSave} />
    </Card>
  )
}
