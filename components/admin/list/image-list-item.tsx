'use client'

import React from 'react'
import type { ImageType } from '~/types'
import { useTranslations } from 'next-intl'
import { Badge } from '~/components/ui/badge'
import { Tooltip, Switch } from 'antd'
import { ArrowDown10 } from 'lucide-react'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { TooltipIconButton } from '~/components/ui/tooltip-icon-button'

interface ImageListItemProps {
  image: ImageType
  index: number
  isLast: boolean
  onEdit: (image: ImageType) => void
  
  // Update state
  onUpdateShow: (id: string, show: number) => void
  updateShowLoading: boolean
  updateShowId: string

  // Sort actions
  onPin: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  disablePin: boolean
  disableUp: boolean
  disableDown: boolean
}

export default function ImageListItem({
  image,
  index,
  isLast,
  onEdit,
  onUpdateShow,
  updateShowLoading,
  updateShowId,
  onPin,
  onMoveUp,
  onMoveDown,
  disablePin,
  disableUp,
  disableDown,
}: ImageListItemProps) {
  const t = useTranslations()

  return (
    <div
      className={[
        'flex items-center gap-3 py-2 transition-all duration-200 ease-in-out',
        !isLast ? 'border-b border-gray-100' : '',
      ].join(' ')}
    >
      {/* 左侧缩略图 */}
      <div className="h-16 w-24 flex-shrink-0 overflow-hidden rounded-md bg-gray-100">
        <img
          src={image.preview_url || image.url}
          alt={image.title || t('List.imageAlt')}
          className="h-full w-full object-cover"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* 中间信息 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium text-gray-900">
            {image.title || t('List.unnamedImage')}
          </span>
          <Badge className="border-gray-200 bg-white px-1.5 text-[11px] text-gray-500">
            {image.album_name || t('List.unboundAlbum')}
          </Badge>
        </div>
        <p className="line-clamp-1 text-xs text-gray-500">
          {image.detail || image.url}
        </p>
      </div>

      {/* 右侧操作区 */}
      <div className="flex flex-shrink-0 items-center gap-2">
        <Tooltip title={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}>
          <Switch
            checked={image.show === 0}
            disabled={updateShowLoading && updateShowId === image.id}
            size="small"
            onChange={(checked: boolean) => onUpdateShow(image.id, checked ? 0 : 1)}
          />
        </Tooltip>
        <Badge className="border-gray-200 bg-white px-1.5 text-[11px] text-gray-500">
          <ArrowDown10 size={14} className="mr-0.5" />
          {image.sort}
        </Badge>
        {/* 排序按钮 */}
        <div className="ml-1 flex items-center gap-1">
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
            disabled={disablePin}
            onClick={() => onPin(index)}
            aria-label={t('List.pinTopA11y')}
            title={t('List.pinTopTitle')}
          >
            📌
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
            disabled={disableUp}
            onClick={() => onMoveUp(index)}
            aria-label={t('List.moveUpA11y')}
            title={t('List.moveUpTitle')}
          >
            ↑
          </button>
          <button
            type="button"
            className="flex h-6 w-6 items-center justify-center rounded text-[12px] !text-gray-900 hover:bg-gray-100 disabled:cursor-default disabled:text-gray-300 disabled:hover:bg-transparent md:text-[14px]"
            disabled={disableDown}
            onClick={() => onMoveDown(index)}
            aria-label={t('List.moveDownA11y')}
            title={t('List.moveDownTitle')}
          >
            ↓
          </button>
        </div>
        <TooltipIconButton
          tooltip={t('List.editImageInfo')}
          className="h-8 w-8 p-0 border-0 bg-white hover:bg-gray-100 shadow-none !text-gray-900"
          onClick={() => onEdit(image)}
        >
          <SquarePenIcon className="h-3.5 w-3.5 !text-gray-900 p-0 hover:bg-transparent" />
        </TooltipIconButton>
      </div>
    </div>
  )
}
