'use client'

import React from 'react'
import { Checkbox, Button, Tooltip, Space, theme } from 'antd'
import { DeleteOutlined, DownloadOutlined, ReloadOutlined, RobotOutlined, CheckSquareOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

interface BatchActionBarProps {
  selectedCount: number
  /** 当前页图片数 */
  totalCount: number
  /** 当前页内已勾选数量（跨页选中时与 selectedCount 不同） */
  pageSelectedCount?: number
  /** 符合当前筛选条件的图片总数（全部页） */
  matchingCount?: number
  /** 是否处于"全选筛选结果"状态 */
  allFilteredSelected?: boolean
  /** 全选筛选结果请求进行中 */
  selectingAll?: boolean
  /** 服务端是否支持按筛选全选（未注册 allIdsHandle 时隐藏入口） */
  canSelectAllFiltered?: boolean
  onSelectAll: (checked: boolean) => void
  onSelectAllFiltered?: () => void
  onRefresh: () => void
  onBatchDelete: () => void
  onBatchDownload: () => void
  aiTagEnabled?: boolean
  onBatchAiTag?: () => void
}

export default function BatchActionBar({
  selectedCount,
  totalCount,
  pageSelectedCount,
  matchingCount = 0,
  allFilteredSelected = false,
  selectingAll = false,
  canSelectAllFiltered = false,
  onSelectAll,
  onSelectAllFiltered,
  onRefresh,
  onBatchDelete,
  onBatchDownload,
  aiTagEnabled = false,
  onBatchAiTag,
}: BatchActionBarProps) {
  const { token } = theme.useToken()
  const t = useTranslations()

  // 常驻显示：未选中时也可直接全选，无需先手动勾选一张
  const pageCount = pageSelectedCount ?? selectedCount
  const pageAllSelected = totalCount > 0 && pageCount === totalCount
  const indeterminate = !pageAllSelected && (pageCount > 0 || allFilteredSelected)
  const hasSelection = selectedCount > 0

  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 20,
        padding: `${token.paddingMD}px ${token.paddingLG}px`,
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${allFilteredSelected ? token.colorPrimaryBorder : token.colorBorder}`,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        rowGap: token.marginSM,
        marginBottom: token.margin,
        backgroundColor: token.colorBgContainer,
      }}
    >
      <Space size="middle" wrap>
        <Space size="small">
          <Checkbox
            checked={pageAllSelected}
            indeterminate={indeterminate}
            onChange={(e) => onSelectAll(e.target.checked)}
            disabled={totalCount === 0}
            aria-label={t('List.selectAllCurrentPage')}
          />
          <span style={{ fontSize: token.fontSize, fontWeight: 500 }}>
            {t('List.selectedPhotosCount', { count: selectedCount })}
          </span>
        </Space>
        {canSelectAllFiltered && onSelectAllFiltered && (
          <Tooltip title={t('List.selectAllFilteredTooltip')}>
            <Button
              size="small"
              type={allFilteredSelected ? 'primary' : 'default'}
              ghost={allFilteredSelected}
              icon={<CheckSquareOutlined />}
              loading={selectingAll}
              disabled={matchingCount === 0}
              onClick={onSelectAllFiltered}
            >
              {t('List.selectAllFilteredBtn', { count: matchingCount })}
            </Button>
          </Tooltip>
        )}
        {allFilteredSelected && (
          <span style={{ fontSize: token.fontSizeSM, color: token.colorPrimary }}>
            {t('List.allFilteredSelectedHint', { count: selectedCount })}
          </span>
        )}
      </Space>
      <Space size="small">
        <Tooltip title={t('List.refreshListTooltip')}>
          <Button icon={<ReloadOutlined />} onClick={onRefresh}>
            {t('Button.refresh')}
          </Button>
        </Tooltip>
        <Tooltip title={t('List.batchDownloadTooltip')}>
          <Button icon={<DownloadOutlined />} disabled={!hasSelection} onClick={onBatchDownload}>
            {t('Button.batchDownload')}
          </Button>
        </Tooltip>
        {aiTagEnabled && onBatchAiTag && (
          <Tooltip title={t('List.batchAiTagTooltip')}>
            <Button icon={<RobotOutlined />} disabled={!hasSelection} onClick={onBatchAiTag}>
              {t('List.batchAiTagBtn')}
            </Button>
          </Tooltip>
        )}
        <Tooltip title={t('List.deleteSelectedPhotosTooltip')}>
          <Button danger icon={<DeleteOutlined />} disabled={!hasSelection} onClick={onBatchDelete}>
            {t('Button.batchDelete')}
          </Button>
        </Tooltip>
      </Space>
    </div>
  )
}
