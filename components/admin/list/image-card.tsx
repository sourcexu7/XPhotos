'use client'

import React, { useState } from 'react'
import type { ImageType, AlbumType } from '~/types'
import { useTranslations } from 'next-intl'
import { Card, CardFooter } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Tooltip, Button, Select, Switch, theme } from 'antd'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import { ReloadIcon } from '@radix-ui/react-icons'
import { ArrowDown10, ScanSearch, Replace, Image as ImageIcon, Trash2, Pin, ChevronUp, ChevronDown } from 'lucide-react'
import { SquarePenIcon } from '~/components/icons/square-pen'
import { TooltipIconButton } from '~/components/ui/tooltip-icon-button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '~/components/ui/alert-dialog'
import {
  Tooltip as ShadcnTooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'

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

  // Sort actions
  onPin: (index: number) => void
  onMoveUp: (index: number) => void
  onMoveDown: (index: number) => void
  disablePin: boolean
  disableUp: boolean
  disableDown: boolean

  // Album binding
  albums?: AlbumType[]
  onBindAlbum: (image: ImageType, albumId: string) => Promise<void>
  updateImageAlbumLoading: boolean
  
  // Set cover
  onSetCover: (albumValue: string, coverUrl: string) => void
}

export default function ImageCard({
  image,
  index,
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
  onPin,
  onMoveUp,
  onMoveDown,
  disablePin,
  disableUp,
  disableDown,
  albums,
  onBindAlbum,
  updateImageAlbumLoading,
  onSetCover,
}: ImageCardProps) {
  const t = useTranslations()
  const [localAlbumId, setLocalAlbumId] = useState(image.album_value || '')
  const { token } = theme.useToken()

  return (
    <Card className="group flex h-auto flex-col items-center gap-0 overflow-hidden border-slate-200 bg-white py-0 shadow-sm transition-all duration-200 hover:shadow-md rounded-lg">
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 rounded-t-lg">
        <img
          src={image.preview_url || image.url}
          alt={image.title || t('List.imageAlt')}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
          decoding="async"
          draggable={false}
        />

        {/* 遮罩 */}
        <div className="pointer-events-none absolute inset-0 bg-black/0 transition-colors duration-300 group-hover:bg-black/5" />

        {/* 左上角：复选框 & 相册标签 */}
        <div
          className={`absolute left-2 top-2 z-10 flex flex-col gap-2 transition-opacity duration-200 ${
            selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <Checkbox
            checked={selected}
            onCheckedChange={(v) => onSelect(image.id, !!v)}
            className="h-4 w-4 rounded-sm bg-white shadow-sm"
          />
          <span className="max-w-[120px] truncate rounded-lg bg-black/50 px-2 py-0.5 text-[10px] text-white shadow-sm backdrop-blur-sm">
            {image.album_name}
          </span>
        </div>

        {/* 右上角：查看按钮 */}
        <Tooltip title={t('List.viewLargeImageTooltip')}>
          <button
            className="absolute right-2 top-2 transform rounded-full bg-white/90 p-1.5 text-slate-700 opacity-0 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-primary hover:scale-110 group-hover:opacity-100"
            onClick={() => onView(image)}
            aria-label={t('List.viewLargeImageTooltip')}
          >
            <ScanSearch size={16} />
          </button>
        </Tooltip>
      </div>

      {/* 底部操作栏 */}
      <CardFooter className="flex flex-col w-full border-t border-slate-100 bg-white p-2 gap-2 rounded-b-lg">
        {/* 顶部操作区：状态切换和排序 */}
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            <Tooltip title={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}>
              <Switch
                checked={image.show === 0}
                disabled={updateShowLoading && updateShowId === image.id}
                size="small"
                onChange={(checked: boolean) => onUpdateShow(image.id, checked ? 0 : 1)}
              />
            </Tooltip>
            <Tooltip title={image.featured === 1 ? t('List.featuredEnabledTooltip') : t('List.featuredDisabledTooltip')}>
              <div
                className={`cursor-pointer rounded-lg p-1 hover:bg-slate-100 ${
                  image.featured === 1 ? 'text-[var(--chart-3)]' : 'text-muted-foreground'
                }`}
                onClick={() => onUpdateFeatured(image.id, image.featured === 1 ? 0 : 1)}
              >
                {updateFeaturedLoading && updateFeaturedId === image.id ? (
                  <ReloadIcon className="h-4 w-4 animate-spin" />
                ) : image.featured === 1 ? (
                  <StarFilled />
                ) : (
                  <StarOutlined />
                )}
              </div>
            </Tooltip>
            <Badge className="flex h-6 items-center gap-0.5 border-slate-200 bg-slate-50 px-1.5 font-normal text-slate-500 hover:bg-slate-100 rounded-lg">
              <ArrowDown10 size={12} /> {image.sort}
            </Badge>
          </div>
          
          {/* 排序按钮 */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[12px] !text-slate-900 hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent md:text-[14px] transition-colors"
              disabled={disablePin}
              onClick={() => onPin(index)}
              aria-label={t('List.pinTopA11y')}
              title={t('List.pinTopTitle')}
            >
              <Pin size={14} />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[12px] !text-slate-900 hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent md:text-[14px] transition-colors"
              disabled={disableUp}
              onClick={() => onMoveUp(index)}
              aria-label={t('List.moveUpA11y')}
              title={t('List.moveUpTitle')}
            >
              <ChevronUp size={14} />
            </button>
            <button
              type="button"
              className="flex h-6 w-6 items-center justify-center rounded-lg text-[12px] !text-slate-900 hover:bg-slate-100 disabled:cursor-default disabled:text-slate-300 disabled:hover:bg-transparent md:text-[14px] transition-colors"
              disabled={disableDown}
              onClick={() => onMoveDown(index)}
              aria-label={t('List.moveDownA11y')}
              title={t('List.moveDownTitle')}
            >
              <ChevronDown size={14} />
            </button>
          </div>
        </div>
        
        {/* 底部操作区：功能按钮 */}
        <div className="flex items-center justify-center w-full gap-2 flex-wrap">
          <AlertDialog>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:ring-offset-2"
                    onClick={() => setLocalAlbumId(image.album_value || '')}
                    title={t('List.bindAlbum')}
                    aria-label={t('List.bindAlbum')}
                  >
                    <Replace size={16} className="text-primary" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('List.bindAlbum')}</TooltipContent>
            </ShadcnTooltip>
            <AlertDialogContent className="sm:max-w-md border border-slate-200 rounded-lg shadow-sm bg-white">
              <AlertDialogHeader className="text-center mb-4">
                <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                  {t('List.bindAlbum')}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <Select
                defaultValue={localAlbumId || undefined}
                onChange={setLocalAlbumId}
                placeholder={t('List.selectAlbum')}
                className="w-full"
                options={albums?.map((a: AlbumType) => ({
                  label: a.name,
                  value: a.id
                }))}
              />
              <AlertDialogFooter className="mt-4 space-x-2">
                <AlertDialogCancel className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                  {t('Button.canal')}
                </AlertDialogCancel>
                <AlertDialogAction className="px-3 py-1.5 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                  disabled={updateImageAlbumLoading}
                  onClick={() => onBindAlbum(image, localAlbumId)}
                >
                  {updateImageAlbumLoading && (
                    <ReloadIcon className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {t('Button.update')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-green-300 focus:ring-offset-2"
            onClick={() => onSetCover(image.album_value, image.preview_url || image.url)}
            title={t('List.setAlbumCover')}
            aria-label={t('List.setAlbumCover')}
          >
            <ImageIcon size={16} className="text-green-600" />
          </button>

          <button
            className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-purple-300 focus:ring-offset-2"
            onClick={() => onEdit(image)}
            title={t('List.editImageInfo')}
            aria-label={t('List.editImageInfo')}
          >
            <SquarePenIcon size={16} className="text-purple-600" />
          </button>

          <AlertDialog>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-700 transition-all duration-200 hover:bg-slate-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-red-300 focus:ring-offset-2"
                    title={t('List.deleteImage')}
                    aria-label={t('List.deleteImage')}
                  >
                    <Trash2 size={16} className="text-red-600" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('List.deleteImage')}</TooltipContent>
            </ShadcnTooltip>
            <AlertDialogContent className="sm:max-w-md border border-slate-200 rounded-lg shadow-sm bg-white">
              <AlertDialogHeader className="text-center mb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                </div>
                <AlertDialogTitle className="text-lg font-semibold text-slate-900">
                  {t('Tips.reallyDelete')}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-3 p-4 rounded-lg bg-slate-50">
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">{t('List.imageId')}</p>
                  <p className="text-sm font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    {image.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-slate-600">{t('List.imageTitle')}</p>
                  <p className="text-sm font-medium text-slate-900 bg-white px-3 py-2 rounded-lg border border-slate-200">
                    {image.title || t('List.noTitle')}
                  </p>
                </div>
              </div>
              <AlertDialogFooter className="mt-4 space-x-2">
                <AlertDialogCancel className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white text-slate-900 hover:bg-slate-50 text-sm font-medium transition-colors">
                  {t('Button.canal')}
                </AlertDialogCancel>
                <AlertDialogAction 
                  className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                  onClick={() => onDelete(image.id)}
                >
                  {t('Button.delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  )
}
