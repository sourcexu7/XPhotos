'use client'

import React from 'react'
import { Checkbox } from '~/components/ui/checkbox'
import { Button as AntButton, Tooltip } from 'antd'
import { DeleteOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: (checked: boolean) => void
  onRefresh: () => void
  onBatchDelete: () => void
}

export default function BatchActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onRefresh,
  onBatchDelete,
}: BatchActionBarProps) {
  const t = useTranslations()

  if (selectedCount === 0) return null

  return (
    <div className="sticky top-0 z-20 bg-card text-foreground border border-border px-4 py-3 rounded-lg flex justify-between items-center animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-3">
        <Checkbox
          checked={selectedCount < totalCount ? 'indeterminate' : true}
          onCheckedChange={(v) => onSelectAll(!!v)}
        />
        <span className="text-sm font-medium">
          {t('List.selectedPhotosCount', { count: selectedCount })}
        </span>
      </div>
      <div className="flex gap-3">
        <Tooltip title={t('List.refreshListTooltip')}>
          <AntButton
            type="text"
            className="text-foreground hover:bg-muted flex items-center gap-1 rounded-lg"
            icon={<ReloadOutlined />}
            onClick={onRefresh}
          >
            {t('Button.refresh')}
          </AntButton>
        </Tooltip>
        <Tooltip title={t('List.deleteSelectedPhotosTooltip')}>
          <AntButton
            type="default"
            danger
            icon={<DeleteOutlined />}
            onClick={onBatchDelete}
            className="bg-card border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 rounded-lg transition-all duration-200"
          >
            {t('Button.batchDelete')}
          </AntButton>
        </Tooltip>
      </div>
    </div>
  )
}
