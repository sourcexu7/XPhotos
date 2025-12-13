'use client'

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageDataProps } from '~/types/props'
import React from 'react'
import ExifView from '~/components/admin/album/exif-view.tsx'
import { Switch } from '~/components/ui/switch'
import LivePhoto from '~/components/album/live-photo'
import { MotionImage } from '~/components/album/motion-image'
import { Badge } from '~/components/ui/badge'
import { useTranslations } from 'next-intl'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

export default function ImageView() {
  const t = useTranslations()
  const { imageView, imageViewData, setImageView, setImageViewData } = useButtonStore(
    (state) => state,
  )

  const props: ImageDataProps = {
    data: imageViewData,
  }

  const dataURL = useBlurImageDataUrl(imageViewData.blurhash)

  return (
    <Sheet
      defaultOpen={false}
      open={imageView}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageView(false)
          setImageViewData({} as ImageType)
        }
      }}
    >
      <SheetContent side="left" className="w-full sm:max-w-full md:w-[600px] overflow-y-auto scrollbar-hide p-0 border-r border-gray-200 shadow-2xl">
        <SheetHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <SheetTitle className="text-gray-900">{imageViewData.title || '图片预览'}</SheetTitle>
        </SheetHeader>
        <div className="p-6 space-y-6">
          <div className="rounded-lg overflow-hidden bg-gray-100 shadow-inner min-h-[200px] flex items-center justify-center">
            {imageViewData?.type === 1 ?
              <MotionImage
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="max-w-full max-h-[60vh] object-contain"
                src={imageViewData.preview_url || imageViewData.url}
                overrideSrc={imageViewData.preview_url || imageViewData.url}
                alt={imageViewData.detail}
                width={imageViewData.width}
                height={imageViewData.height}
                unoptimized
                loading="lazy"
                placeholder="blur"
                blurDataURL={dataURL}
              />
              :
              <LivePhoto url={imageViewData.preview_url || imageViewData.url} videoUrl={imageViewData.video_url} />
            }
          </div>
          
          {imageViewData?.labels && imageViewData.labels.length > 0 &&
            <div className="flex flex-wrap gap-2">
              {imageViewData?.labels.map((tag: string) => (
                <Badge key={tag} variant="secondary" className="bg-gray-100 text-gray-600 hover:bg-gray-200">{tag}</Badge>
              ))}
            </div>
          }
          
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">EXIF 信息</h3>
            <ExifView {...props} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">尺寸</span>
              <div className="text-sm font-mono">{imageViewData?.width} x {imageViewData?.height}</div>
            </div>
            <div className="space-y-1">
              <span className="text-xs font-medium text-gray-500">位置</span>
              <div className="text-sm font-mono truncate" title={`${imageViewData?.lat}, ${imageViewData?.lon}`}>
                {imageViewData?.lat && imageViewData?.lon ? `${imageViewData.lat}, ${imageViewData.lon}` : '无位置信息'}
              </div>
            </div>
          </div>

          <div className="space-y-1">
            <span className="text-xs font-medium text-gray-500">详情描述</span>
            <div className="text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 min-h-[60px]">
              {imageViewData?.detail || '暂无描述'}
            </div>
          </div>

          <div className="flex gap-4 pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between flex-1 p-3 border rounded-lg bg-white">
              <span className="text-sm text-gray-700">显示状态</span>
              <Switch className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent" checked={imageViewData?.show === 0} disabled />
            </div>
            <div className="flex items-center justify-between flex-1 p-3 border rounded-lg bg-white">
              <span className="text-sm text-gray-700">首页精选</span>
              <Switch className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent" checked={imageViewData?.show_on_mainpage === 0} disabled />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}