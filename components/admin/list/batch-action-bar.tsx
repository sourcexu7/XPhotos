'use client'

import React from 'react'
import { Checkbox, Button, Tooltip, Space, theme } from 'antd'
import { DeleteOutlined, DownloadOutlined, ReloadOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface BatchActionBarProps {
  selectedCount: number
  totalCount: number
  onSelectAll: (checked: boolean) => void
  onRefresh: () => void
  onBatchDelete: () => void
  onBatchDownload: () => void
}

export default function BatchActionBar({
  selectedCount,
  totalCount,
  onSelectAll,
  onRefresh,
  onBatchDelete,
  onBatchDownload,
}: BatchActionBarProps) {
  const { token } = theme.useToken()
  const t = useTranslations()

  if (selectedCount === 0) return null

  const indeterminate = selectedCount > 0 && selectedCount < totalCount
  const allSelected = selectedCount === totalCount

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: `${token.paddingMD}px ${token.paddingLG}px`,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: token.margin,
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Space size="middle">
        <Checkbox
          checked={allSelected}
          indeterminate={indeterminate}
          onChange={(e) => onSelectAll(e.target.checked)}
        />
        <span style={{ fontSize: token.fontSize, fontWeight: 500 }}>
          {t('List.selectedPhotosCount', { count: selectedCount })}
        </span>
      </Space>
      <Space size="small">
        <Tooltip title={t('List.refreshListTooltip')}>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('Button.refresh')}
          </Button>
        </Tooltip>
        <Tooltip title={t('List.batchDownloadTooltip')}>
          <Button icon={<DownloadOutlined />} onClick={onBatchDownload}>
            {t('Button.batchDownload')}
          </Button>
        </Tooltip>
        <Tooltip title={t('List.deleteSelectedPhotosTooltip')}>
          <Button danger icon={<DeleteOutlined />} onClick={onBatchDelete}>
            {t('Button.batchDelete')}
          </Button>
        </Tooltip>
      </Space>
    </div>
  )
}
