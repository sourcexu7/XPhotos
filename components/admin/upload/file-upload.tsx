'use client'

import React, { useState } from 'react'
import { Tabs } from 'antd'
import { useTranslations } from 'next-intl'
import SimpleFileUpload from '~/components/admin/upload/simple-file-upload'
import MultipleFileUpload from '~/components/admin/upload/multiple-file-upload'
import LivephotoFileUpload from '~/components/admin/upload/livephoto-file-upload'

export default function FileUpload() {
  const [mode, setMode] = useState('singleton')
  const t = useTranslations()
  const modeItems = [
    {
      key: 'singleton',
      label: t('Upload.simple'),
      children: <SimpleFileUpload />,
    },
    {
      key: 'livephoto',
      label: t('Upload.livephoto'),
      children: <LivephotoFileUpload />,
    },
    {
      key: 'multiple',
      label: t('Upload.multiple'),
      children: <MultipleFileUpload idPrefix="admin-multiple-upload" />,
    },
  ]

  return (
    <div className="flex h-full flex-1 flex-col space-y-4">
      <div className="rounded-lg border border-border bg-background-alt p-4 text-sm text-text-secondary">
        {mode === 'singleton' && t('Upload.modeDescSingleton')}
        {mode === 'livephoto' && t('Upload.modeDescLivephoto')}
        {mode === 'multiple' && t('Upload.modeDescMultiple')}
      </div>
      <Tabs
        activeKey={mode}
        items={modeItems}
        onChange={(key) => setMode(key)}
        className="rounded-lg border border-border bg-background-alt"
        tabBarStyle={{
          borderBottom: '1px solid var(--border)',
          padding: '0 16px',
        }}
        tabStyle={{
          padding: '12px 16px',
          borderRadius: '8px 8px 0 0',
          marginRight: '8px',
        }}
        activeTabStyle={{
          backgroundColor: 'var(--background)',
          border: '1px solid var(--border)',
          borderBottom: '1px solid var(--background-alt)',
        }}
      />
    </div>
  )
}
