'use client'

import React, { useState } from 'react'
import type { ImageType, AlbumType } from '~/types'
import { useTranslations } from 'next-intl'
import { Card, Checkbox, Switch, Button, Modal, Tooltip, Select, theme } from 'antd'
import {
  StarFilled,
  StarOutlined,
  SwapOutlined,
  DeleteOutlined,
  EyeOutlined,
  EditOutlined,
  FileImageOutlined,
  LoadingOutlined,
} from '@ant-design/icons'

interface ImageCardProps {
  image: ImageType
  index: number
  selected: boolean
  onSelect: (id: string, checked: boolean) => void
  onView: (image: ImageType) => void
  onEdit: (image: ImageType) => void
  onDelete: (id: string) => void

  // Update state
  onUpdateShow: (id: string, show: number) => void
  updateShowLoading: boolean
  updateShowId: string

  onUpdateFeatured: (id: string, featured: number) => void
  updateFeaturedLoading: boolean
  updateFeaturedId: string

  // Album binding
  albums?: AlbumType[]
  onBindAlbum: (image: ImageType, albumId: string) => Promise<void>
  updateImageAlbumLoading: boolean

  // Set cover
  onSetCover: (albumValue: string, coverUrl: string) => void
}

export default function ImageCard({
  image,
  selected,
  onSelect,
  onView,
  onEdit,
  onDelete,
  onUpdateShow,
  updateShowLoading,
  updateShowId,
  onUpdateFeatured,
  updateFeaturedLoading,
  updateFeaturedId,
  albums,
  onBindAlbum,
  updateImageAlbumLoading,
  onSetCover,
}: ImageCardProps) {
  const { token } = theme.useToken()
  const t = useTranslations()
  const [localAlbumId, setLocalAlbumId] = useState('')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  const cardRootClassName =
    'group relative flex h-auto flex-col overflow-hidden border-2 border-transparent rounded-2xl transition-all duration-300 ease-out hover:shadow-xl hover:-translate-y-0.5'

  return (
    <Card
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column', flex: 1 },
      }}
      rootClassName={cardRootClassName}
    >
      {/* 图片区域 */}
      <div className="relative w-full overflow-hidden rounded-t-2xl bg-muted">
        <div className="aspect-[4/3] w-full">
          <img
            src={image.preview_url || image.url}
            alt={image.title || t('List.imageAlt')}
            className="h-full w-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
        </div>

        {/* 渐变遮罩层 */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-black/5 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        {/* 左上角：复选框 & 相册标签 */}
        <div
          className={`absolute left-3 top-3 z-20 flex flex-col gap-2 transition-all duration-300 ${
            selected ? 'opacity-100 scale-100' : 'opacity-0 scale-95 group-hover:opacity-100 group-hover:scale-100'
          }`}
        >
          <Checkbox
            checked={selected}
            onChange={(e) => onSelect(image.id, e.target.checked)}
            aria-label={t('List.selectImage')}
          />
          {image.album_name && (
            <span className="max-w-[120px] truncate rounded-xl bg-black/70 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-md">
              {image.album_name}
            </span>
          )}
        </div>

        {/* 右上角：查看按钮 */}
        <div
          className={`absolute right-3 top-3 z-20 transition-all duration-300 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Tooltip title={t('List.viewLargeImageTooltip')} placement="bottom">
            <Button
              type="text"
              size="small"
              onClick={() => onView(image)}
              aria-label={t('List.viewLargeImageTooltip')}
              icon={<EyeOutlined />}
              style={{
                height: 36,
                width: 36,
                borderRadius: 12,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              }}
            />
          </Tooltip>
        </div>

        {/* 图片标题 */}
        {image.title && (
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <p className="truncate text-sm font-semibold text-white drop-shadow-lg">{image.title}</p>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <div className="flex w-full flex-row flex-wrap items-center justify-between gap-2 border-t border-border/50 px-4 py-3 rounded-b-2xl mt-1">
        {/* 公开/隐藏开关 */}
        <div className="flex items-center gap-2">
          <Switch
            checked={image.show === 0}
            disabled={updateShowLoading && updateShowId === image.id}
            onChange={(checked) => onUpdateShow(image.id, checked ? 0 : 1)}
            aria-label={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}
          />
          <span
            className={`text-sm font-medium transition-colors ${
              image.show === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            }`}
          >
            {image.show === 0 ? '公开' : '隐藏'}
          </span>
        </div>

        {/* 精选按钮 */}
        <Tooltip
          title={
            image.featured === 1 ? t('List.featuredEnabledTooltip') : t('List.featuredDisabledTooltip')
          }
        >
          <Button
            type="text"
            size="small"
            onClick={() => onUpdateFeatured(image.id, image.featured === 1 ? 0 : 1)}
            disabled={updateFeaturedLoading && updateFeaturedId === image.id}
            aria-label={
              image.featured === 1 ? t('List.featuredEnabledTooltip') : t('List.featuredDisabledTooltip')
            }
            icon={
              updateFeaturedLoading && updateFeaturedId === image.id ? (
                <LoadingOutlined />
              ) : image.featured === 1 ? (
                <StarFilled />
              ) : (
                <StarOutlined />
              )
            }
            style={{
              height: 32,
              width: 32,
              borderRadius: 8,
              color: image.featured === 1 ? undefined : undefined,
              backgroundColor: image.featured === 1 ? undefined : undefined,
            }}
            className={
              image.featured === 1
                ? 'ant-btn-featured-active'
                : 'ant-btn-featured-inactive'
            }
          />
        </Tooltip>

        {/* 绑定相册 */}
        <Tooltip title={t('List.bindAlbum')}>
          <Button
            type="text"
            size="small"
            onClick={() => {
              const currentAlbum = albums?.find((a) => a.album_value === image.album_value)
              setLocalAlbumId(currentAlbum?.id || '')
              setDialogOpen(true)
            }}
            aria-label={t('List.bindAlbum')}
            icon={<SwapOutlined />}
            style={{ height: 32, width: 32, borderRadius: 8 }}
          />
        </Tooltip>

        {/* 设为封面 */}
        <Tooltip title={t('List.setAlbumCover')}>
          <Button
            type="text"
            size="small"
            onClick={() =>
              onSetCover(image.album_value || '', image.preview_url || image.url || '')
            }
            aria-label={t('List.setAlbumCover')}
            icon={<FileImageOutlined />}
            style={{ height: 32, width: 32, borderRadius: 8 }}
          />
        </Tooltip>

        {/* 编辑 */}
        <Tooltip title={t('List.editImageInfo')}>
          <Button
            type="text"
            size="small"
            onClick={() => onEdit(image)}
            aria-label={t('List.editImageInfo')}
            icon={<EditOutlined />}
            style={{ height: 32, width: 32, borderRadius: 8 }}
          />
        </Tooltip>

        {/* 删除 */}
        <Tooltip title={t('List.deleteImage')}>
          <Button
            type="text"
            size="small"
            onClick={() => setDeleteDialogOpen(true)}
            aria-label={t('List.deleteImage')}
            icon={<DeleteOutlined />}
            style={{ height: 32, width: 32, borderRadius: 8 }}
          />
        </Tooltip>
      </div>

      {/* 绑定相册弹窗 */}
      <Modal
        open={dialogOpen}
        onCancel={() => setDialogOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setDialogOpen(false)}
            style={{ height: 36, borderRadius: 12, flex: 1 }}
          >
            {t('Button.canal')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            disabled={updateImageAlbumLoading || !localAlbumId}
            onClick={async () => {
              await onBindAlbum(image, localAlbumId)
              setDialogOpen(false)
            }}
            style={{ height: 36, borderRadius: 12, flex: 1, backgroundColor: token.colorPrimary }}
            icon={updateImageAlbumLoading ? <LoadingOutlined /> : undefined}
          >
            {t('Button.update')}
          </Button>,
        ]}
        width={400}
        centered
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        {/* 顶部图标 + 标题 */}
        <div className="flex flex-col items-center pt-8 pb-5 px-6 gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 dark:bg-blue-900/30 ring-4 ring-blue-100 dark:ring-blue-900/20">
            <SwapOutlined />
          </div>
          <div className="text-center space-y-1">
            <div className="text-base font-semibold text-foreground">{t('List.bindAlbum')}</div>
            {image.album_name && (
              <p className="text-xs text-muted-foreground">
                当前：<span className="font-medium text-foreground">{image.album_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* 选择器 */}
        <div className="px-6 pb-5" id={`album-select-container-${image.id}`}>
          <Select
            value={localAlbumId || undefined}
            onChange={(val) => setLocalAlbumId(val)}
            placeholder={t('List.selectAlbum')}
            style={{ width: '100%' }}
            getPopupContainer={() =>
              document.getElementById(`album-select-container-${image.id}`) || document.body
            }
            options={albums?.map((a: AlbumType) => ({
              label: a.name,
              value: a.id,
            }))}
          />
        </div>
      </Modal>

      {/* 删除确认弹窗 */}
      <Modal
        open={deleteDialogOpen}
        onCancel={() => setDeleteDialogOpen(false)}
        footer={[
          <Button
            key="cancel"
            onClick={() => setDeleteDialogOpen(false)}
            style={{ height: 40, borderRadius: 12, flex: 1 }}
          >
            {t('Button.canal')}
          </Button>,
          <Button
            key="confirm"
            type="primary"
            danger
            onClick={() => {
              onDelete(image.id)
              setDeleteDialogOpen(false)
            }}
            style={{ height: 40, borderRadius: 12, flex: 1 }}
          >
            {t('Button.delete')}
          </Button>,
        ]}
        width={420}
        centered
        styles={{ body: { padding: 0, overflow: 'hidden' } }}
      >
        <div className="px-6 pt-6 pb-4">
          <div className="text-center space-y-1">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <DeleteOutlined />
            </div>
            <div className="text-lg font-bold text-foreground">{t('Tips.reallyDelete')}</div>
          </div>
        </div>

        <div className="px-6 pb-4 space-y-3">
          <div className="rounded-xl bg-muted/50 p-3 space-y-2.5">
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('List.imageId')}
              </p>
              <p className="text-sm font-mono font-semibold text-foreground bg-card px-3 py-2 rounded-lg border border-border/50">
                {image.id}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
                {t('List.imageTitle')}
              </p>
              <p className="text-sm font-medium text-foreground bg-card px-3 py-2 rounded-lg border border-border/50">
                {image.title || t('List.noTitle')}
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </Card>
  )
}
