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

  return (
    <div
      className={[
        'group flex items-center gap-4 py-3 px-4 transition-all duration-200 ease-out rounded-xl hover:bg-muted/30',
        !isLast ? 'border-b border-border/50' : '',
      ].join(' ')}
    >
      {/* 左侧缩略图 */}
      <div className="relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-muted ring-2 ring-transparent transition-all duration-200 group-hover:ring-primary/20 group-hover:shadow-md">
        <img
          src={image.preview_url || image.url}
          alt={image.title || t('List.imageAlt')}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
          decoding="async"
        />
      </div>

      {/* 中间信息区 */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-semibold text-foreground">
            {image.title || t('List.unnamedImage')}
          </span>
          <Badge variant="secondary" className="flex-shrink-0 border-border/50 bg-muted/60 px-2 text-[11px] font-medium text-muted-foreground rounded-lg">
            {image.album_name || t('List.unboundAlbum')}
          </Badge>
        </div>
        <p className="line-clamp-1 text-xs text-muted-foreground leading-relaxed">
          {image.detail || image.url}
        </p>
      </div>

      {/* 右侧操作区 */}
      <div className="flex flex-shrink-0 items-center gap-2.5">
        {/* 公开/隐藏开关 */}
        <Tooltip title={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}>
          <Switch
            checked={image.show === 0}
            disabled={updateShowLoading && updateShowId === image.id}
            size="small"
            onChange={(checked: boolean) => onUpdateShow(image.id, checked ? 0 : 1)}
            className="data-[state=checked]:bg-primary"
          />
        </Tooltip>

        {/* 排序徽章 */}
        <Badge variant="secondary" className="flex h-7 items-center gap-1 border-border/50 bg-muted/60 px-2 text-[11px] font-medium text-muted-foreground rounded-lg">
          <ArrowDown10 size={12} />
          <span>{image.sort}</span>
        </Badge>

        {/* 编辑按钮 */}
        <TooltipIconButton
          tooltip={t('List.editImageInfo')}
          className="h-8 w-8 p-0 border-2 border-transparent rounded-lg bg-muted/50 shadow-sm !text-muted-foreground hover:!bg-violet-100 hover:!text-violet-600 hover:!border-violet-300 dark:hover:!bg-violet-900/30 dark:hover:!text-violet-400 transition-all duration-200"
          onClick={() => onEdit(image)}
        >
          <SquarePenIcon className="h-3.5 w-3.5" />
        </TooltipIconButton>
      </div>
    </div>
  )
}
