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
    <div className="flex h-full flex-1 flex-col space-y-2">
      <div className="rounded-lg border border-gray-200 bg-white p-3 text-sm text-gray-600">
        {mode === 'singleton' && t('Upload.modeDescSingleton')}
        {mode === 'livephoto' && t('Upload.modeDescLivephoto')}
        {mode === 'multiple' && t('Upload.modeDescMultiple')}
      </div>
      <Tabs
        activeKey={mode}
        items={modeItems}
        onChange={(key) => setMode(key)}
      />
    </div>
  )
}
