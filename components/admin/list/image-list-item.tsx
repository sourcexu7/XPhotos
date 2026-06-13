'use client'

import React from 'react'
import type { ImageType } from '~/types'
import { useTranslations } from 'next-intl'
import { Tag, Tooltip, Switch, Button, theme } from 'antd'
import { SortAscendingOutlined } from '@ant-design/icons'
import { EditOutlined } from '@ant-design/icons'

interface ImageListItemProps {
  image: ImageType
  index: number
  isLast: boolean
  onEdit: (image: ImageType) => void

  // Update state
  onUpdateShow: (id: string, show: number) => void
  updateShowLoading: boolean
  updateShowId: string

}

export default function ImageListItem({
  image,
  isLast,
  onEdit,
  onUpdateShow,
  updateShowLoading,
  updateShowId,
}: ImageListItemProps) {
  const t = useTranslations()
  const { token } = theme.useToken()

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 16,
        padding: '12px 16px',
        transition: 'all 0.2s ease-out',
        borderRadius: 12,
        borderBottom: !isLast ? `1px solid ${token.colorBorderSecondary}` : undefined,
      }}
    >
      {/* 左侧缩略图 */}
      <div style={{
        height: 64,
        width: 96,
        flexShrink: 0,
        overflow: 'hidden',
        borderRadius: 12,
        backgroundColor: token.colorFillSecondary,
        transition: 'all 0.2s ease-out',
      }}>
        <img
          src={image.preview_url || image.url}
          alt={image.title || t('List.imageAlt')}
          style={{ height: '100%', width: '100%', objectFit: 'cover', transition: 'transform 0.3s' }}
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* 中间信息区 */}
      <div style={{ display: 'flex', minWidth: 0, flex: 1, flexDirection: 'column', gap: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            fontSize: 14,
            fontWeight: 600,
            color: token.colorText,
          }}>
            {image.title || t('List.unnamedImage')}
          </span>
          <Tag color="default" style={{ fontSize: 11, borderRadius: 6, marginInlineEnd: 0 }}>
            {image.album_name || t('List.unboundAlbum')}
          </Tag>
        </div>
        <p style={{
          fontSize: 12,
          color: token.colorTextSecondary,
          lineHeight: 1.6,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}>
          {image.detail || image.url}
        </p>
      </div>

      {/* 右侧操作区 */}
      <div style={{ display: 'flex', flexShrink: 0, alignItems: 'center', gap: 10 }}>
        {/* 公开/隐藏开关 */}
        <Tooltip title={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}>
          <Switch
            checked={image.show === 0}
            disabled={updateShowLoading && updateShowId === image.id}
            size="small"
            onChange={(checked: boolean) => onUpdateShow(image.id, checked ? 0 : 1)}
          />
        </Tooltip>

        {/* 排序徽章 */}
        <Tag color="default" style={{ display: 'inline-flex', alignItems: 'center', gap: 4, height: 28, fontSize: 11, borderRadius: 6, marginInlineEnd: 0 }}>
          <SortAscendingOutlined />
          <span>{image.sort}</span>
        </Tag>

        {/* 编辑按钮 */}
        <Tooltip title={t('List.editImageInfo')}>
          <Button
            type="text"
            size="small"
            onClick={() => onEdit(image)}
            style={{ height: 32, width: 32, borderRadius: 8 }}
          >
            <EditOutlined style={{ fontSize: 14 }} />
          </Button>
        </Tooltip>
      </div>
    </div>
  )
}
