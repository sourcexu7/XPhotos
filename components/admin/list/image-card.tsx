'use client'

import { useState } from 'react'
import type { ImageType, AlbumType } from '~/types'
import { useTranslations } from 'next-intl'
import { Card, CardFooter } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Badge } from '~/components/ui/badge'
import { Tooltip, Button, Select, Switch, theme } from 'antd'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import { ReloadIcon } from '@radix-ui/react-icons'
import { ArrowDown as ArrowDown10, ScanSearch, Replace, Image as ImageIcon, Trash2 } from 'lucide-react'
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
    <Card className="group flex h-auto flex-col items-center gap-0 overflow-hidden border-gray-200 bg-white py-0 shadow-sm transition-all duration-200 hover:shadow-md">
      {/* 图片区域 */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
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
          <span className="max-w-[120px] truncate rounded bg-black/50 px-2 py-0.5 text-[10px] text-white shadow-sm backdrop-blur-sm">
            {image.album_name}
          </span>
        </div>

        {/* 右上角：查看按钮 */}
        <Tooltip title={t('List.viewLargeImageTooltip')}>
          <button
            className="absolute right-2 top-2 transform rounded-full bg-white/90 p-1.5 text-gray-700 opacity-0 shadow-sm backdrop-blur transition-all duration-200 hover:bg-white hover:text-blue-600 hover:scale-110 group-hover:opacity-100"
            onClick={() => onView(image)}
          >
            <ScanSearch size={16} />
          </button>
        </Tooltip>
      </div>

      {/* 底部操作栏 */}
      <CardFooter className="flex h-14 w-full items-center justify-between border-t border-gray-100 bg-white p-2">
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
              className={`cursor-pointer rounded p-1 hover:bg-gray-100 ${
                image.featured === 1 ? 'text-[#E2B714]' : 'text-gray-400'
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
          <Badge className="flex h-6 items-center gap-0.5 border-gray-200 bg-gray-50 px-1.5 font-normal text-gray-500 hover:bg-gray-100">
            <ArrowDown10 size={12} /> {image.sort}
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
        </div>

        <div className="flex items-center gap-1">
          <AlertDialog>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    onClick={() => setLocalAlbumId(image.album_value || '')}
                    title={t('List.bindAlbum')}
                  >
                    <Replace size={14} className="text-blue-500" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('List.bindAlbum')}</TooltipContent>
            </ShadcnTooltip>
            <AlertDialogContent className="sm:max-w-md border border-gray-200 rounded-lg shadow-md bg-white">
              <AlertDialogHeader className="text-center mb-4">
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">
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
                <AlertDialogCancel className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50 text-sm font-medium">
                  {t('Button.canal')}
                </AlertDialogCancel>
                <AlertDialogAction className="px-3 py-1.5 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium"
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
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-green-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={() => onSetCover(image.album_value, image.preview_url || image.url)}
            title={t('List.setAlbumCover')}
          >
            <ImageIcon size={14} className="text-green-500" />
          </button>

          <button
            className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-purple-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
            onClick={() => onEdit(image)}
            title={t('List.editImageInfo')}
          >
            <SquarePenIcon size={14} className="text-purple-500" />
          </button>

          <AlertDialog>
            <ShadcnTooltip>
              <TooltipTrigger asChild>
                <AlertDialogTrigger asChild>
                  <button
                    className="flex h-7 w-7 items-center justify-center rounded-md bg-gray-100 text-gray-700 transition-all duration-200 hover:bg-gray-200 hover:text-red-600 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2"
                    title={t('List.deleteImage')}
                  >
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </AlertDialogTrigger>
              </TooltipTrigger>
              <TooltipContent>{t('List.deleteImage')}</TooltipContent>
            </ShadcnTooltip>
            <AlertDialogContent className="sm:max-w-md border border-gray-200 rounded-lg shadow-md bg-white">
              <AlertDialogHeader className="text-center mb-4">
                <div className="flex justify-center mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-50">
                    <Trash2 size={20} className="text-red-600" />
                  </div>
                </div>
                <AlertDialogTitle className="text-lg font-semibold text-gray-900">
                  {t('Tips.reallyDelete')}
                </AlertDialogTitle>
              </AlertDialogHeader>
              <div className="space-y-3 p-4 rounded-lg bg-gray-50">
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">{t('List.imageId')}</p>
                  <p className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {image.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-600">{t('List.imageTitle')}</p>
                  <p className="text-sm font-medium text-gray-900 bg-white px-3 py-2 rounded border border-gray-200">
                    {image.title || t('List.noTitle')}
                  </p>
                </div>
              </div>
              <AlertDialogFooter className="mt-4 space-x-2">
                <AlertDialogCancel className="px-3 py-1.5 border border-gray-300 rounded-md bg-white text-black hover:bg-gray-50 text-sm font-medium">
                  {t('Button.canal')}
                </AlertDialogCancel>
                <AlertDialogAction className="px-3 py-1.5 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium">
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
