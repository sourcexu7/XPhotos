'use client'

import React, { useState } from 'react'
import type { ImageType, AlbumType } from '~/types'
import { useTranslations } from 'next-intl'
import { Card, CardFooter } from '~/components/ui/card'
import { Checkbox } from '~/components/ui/checkbox'
import { Switch } from '~/components/ui/switch'
import { Button } from '~/components/ui/button'
import { Select } from 'antd'
import { StarFilled, StarOutlined } from '@ant-design/icons'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Replace, Trash2, Eye, Edit, Palette, Trash2 as TrashIcon } from 'lucide-react'
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
  const t = useTranslations()
  const [localAlbumId, setLocalAlbumId] = useState(image.album_value || '')

  return (
    <Card className="group relative flex h-auto flex-col overflow-hidden border-2 border-transparent bg-card rounded-2xl transition-all duration-300 ease-out hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-0.5">
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
            onCheckedChange={(v) => onSelect(image.id, !!v)}
            className="h-5 w-5 rounded-lg border-2 border-white/50 bg-white/95 shadow-lg backdrop-blur-sm data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-white transition-all"
            aria-label={t('List.selectImage')}
          />
          {image.album_name && (
            <span className="max-w-[120px] truncate rounded-xl bg-black/70 px-2.5 py-1 text-xs font-medium text-white shadow-lg backdrop-blur-md">
              {image.album_name}
            </span>
          )}
        </div>

        {/* 右上角：查看按钮 */}
        <div className={`absolute right-3 top-3 z-20 transition-all duration-300 ${selected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                variant="ghost"
                className="h-9 w-9 rounded-xl bg-white/95 text-foreground shadow-lg backdrop-blur-sm transition-all duration-200 hover:bg-white hover:text-primary hover:scale-110 active:scale-100"
                onClick={() => onView(image)}
                aria-label={t('List.viewLargeImageTooltip')}
              >
                <Eye size={18} />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="px-2.5 py-1.5 text-xs font-medium">
              {t('List.viewLargeImageTooltip')}
            </TooltipContent>
          </ShadcnTooltip>
        </div>

        {/* 图片标题 */}
        {image.title && (
          <div className="absolute bottom-3 left-3 right-3 z-20">
            <p className="truncate text-sm font-semibold text-white drop-shadow-lg">
              {image.title}
            </p>
          </div>
        )}
      </div>

      {/* 底部操作栏 */}
      <CardFooter className="flex w-full flex-row flex-wrap items-center justify-between gap-2 border-t border-border/50 bg-card/80 backdrop-blur-sm px-4 py-3 rounded-b-2xl mt-1">
        {/* 公开/隐藏开关 */}
        <div className="flex items-center gap-2">
          <Switch
            checked={image.show === 0}
            disabled={updateShowLoading && updateShowId === image.id}
            onCheckedChange={(checked) => onUpdateShow(image.id, checked ? 0 : 1)}
            className="data-[state=checked]:bg-primary transition-all duration-200"
            aria-label={image.show === 0 ? t('List.currentPublicTooltip') : t('List.currentHiddenTooltip')}
          />
          <span className={`text-sm font-medium transition-colors ${
            image.show === 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
          }`}>
            {image.show === 0 ? '公开' : '隐藏'}
          </span>
        </div>

        {/* 精选按钮 */}
        <ShadcnTooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant={image.featured === 1 ? "default" : "ghost"}
              className={`h-8 w-8 rounded-lg transition-all duration-200 ${
                image.featured === 1 
                  ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground'
              }`}
              onClick={() => onUpdateFeatured(image.id, image.featured === 1 ? 0 : 1)}
              disabled={updateFeaturedLoading && updateFeaturedId === image.id}
              aria-label={image.featured === 1 ? t('List.featuredEnabledTooltip') : t('List.featuredDisabledTooltip')}
            >
              {updateFeaturedLoading && updateFeaturedId === image.id ? (
                <ReloadIcon className="h-4 w-4 animate-spin" />
              ) : image.featured === 1 ? (
                <StarFilled className="h-4 w-4" />
              ) : (
                <StarOutlined className="h-4 w-4" />
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 text-xs font-medium">
            {image.featured === 1 ? t('List.featuredEnabledTooltip') : t('List.featuredDisabledTooltip')}
          </TooltipContent>
        </ShadcnTooltip>

        {/* 绑定相册 */}
        <AlertDialog>
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-blue-100 hover:text-blue-600 dark:hover:bg-blue-900/30 dark:hover:text-blue-400"
                  onClick={() => setLocalAlbumId(image.album_value || '')}
                  aria-label={t('List.bindAlbum')}
                >
                  <Replace size={16} />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="px-2.5 py-1.5 text-xs font-medium">
              {t('List.bindAlbum')}
            </TooltipContent>
          </ShadcnTooltip>
          <AlertDialogContent className="sm:max-w-[420px] border-2 border-border/50 rounded-2xl shadow-2xl bg-card p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <AlertDialogHeader className="text-center space-y-1">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900/30">
                  <Replace size={24} className="text-blue-600 dark:text-blue-400" />
                </div>
                <AlertDialogTitle className="text-lg font-bold text-foreground">
                  {t('List.bindAlbum')}
                </AlertDialogTitle>
              </AlertDialogHeader>
            </div>
            
            <div className="px-6 pb-4">
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
            </div>

            <AlertDialogFooter className="px-6 pb-6 pt-2 gap-2">
              <AlertDialogCancel className="h-10 flex-1 rounded-xl border-border bg-muted/50 font-medium text-foreground hover:bg-muted transition-colors">
                {t('Button.canal')}
              </AlertDialogCancel>
              <AlertDialogAction 
                className="h-10 flex-1 rounded-xl bg-primary font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
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

        {/* 设为封面 */}
        <ShadcnTooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-emerald-100 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400"
              onClick={() => onSetCover(image.album_value, image.preview_url || image.url)}
              aria-label={t('List.setAlbumCover')}
            >
              <Palette size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 text-xs font-medium">
            {t('List.setAlbumCover')}
          </TooltipContent>
        </ShadcnTooltip>

        {/* 编辑 */}
        <ShadcnTooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-violet-100 hover:text-violet-600 dark:hover:bg-violet-900/30 dark:hover:text-violet-400"
              onClick={() => onEdit(image)}
              aria-label={t('List.editImageInfo')}
            >
              <Edit size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="px-2.5 py-1.5 text-xs font-medium">
            {t('List.editImageInfo')}
          </TooltipContent>
        </ShadcnTooltip>

        {/* 删除 */}
        <AlertDialog>
          <ShadcnTooltip>
            <TooltipTrigger asChild>
              <AlertDialogTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 rounded-lg text-muted-foreground transition-all duration-200 hover:bg-red-100 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                  aria-label={t('List.deleteImage')}
                >
                  <TrashIcon size={16} />
                </Button>
              </AlertDialogTrigger>
            </TooltipTrigger>
            <TooltipContent side="top" className="px-2.5 py-1.5 text-xs font-medium">
              {t('List.deleteImage')}
            </TooltipContent>
          </ShadcnTooltip>
          <AlertDialogContent className="sm:max-w-[420px] border-2 border-red-200 dark:border-red-800/50 rounded-2xl shadow-2xl bg-card p-0 overflow-hidden">
            <div className="px-6 pt-6 pb-4">
              <AlertDialogHeader className="text-center space-y-1">
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                  <Trash2 size={28} className="text-red-600 dark:text-red-400" />
                </div>
                <AlertDialogTitle className="text-lg font-bold text-foreground">
                  {t('Tips.reallyDelete')}
                </AlertDialogTitle>
              </AlertDialogHeader>
            </div>
            
            <div className="px-6 pb-4 space-y-3">
              <div className="rounded-xl bg-muted/50 p-3 space-y-2.5">
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('List.imageId')}</p>
                  <p className="text-sm font-mono font-semibold text-foreground bg-card px-3 py-2 rounded-lg border border-border/50">
                    {image.id}
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">{t('List.imageTitle')}</p>
                  <p className="text-sm font-medium text-foreground bg-card px-3 py-2 rounded-lg border border-border/50">
                    {image.title || t('List.noTitle')}
                  </p>
                </div>
              </div>
            </div>

            <AlertDialogFooter className="px-6 pb-6 pt-2 gap-2">
              <AlertDialogCancel className="h-10 flex-1 rounded-xl border-border bg-muted/50 font-medium text-foreground hover:bg-muted transition-colors">
                {t('Button.canal')}
              </AlertDialogCancel>
              <AlertDialogAction 
                className="h-10 flex-1 rounded-xl bg-red-600 font-semibold text-white hover:bg-red-700 transition-colors"
                onClick={() => onDelete(image.id)}
              >
                {t('Button.delete')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  )
}
