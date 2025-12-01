'use client'

import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import React, { useState } from 'react'
import { toast } from 'sonner'
import { Switch } from '~/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '~/components/ui/sheet'
import { Button } from 'antd'
import { Tag, TagInput } from 'emblor'

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)

  async function submit() {
    if (!image.url) {
      toast.error('图片链接不能为空！')
      return
    }
    if (!image.height || image.height <= 0) {
      toast.error('图片高度不能为空且必须大于 0！')
      return
    }
    if (!image.width || image.width <= 0) {
      toast.error('图片宽度不能为空且必须大于 0！')
      return
    }
    try {
      setLoading(true)
      await fetch('/api/v1/images/update', {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(image),
        method: 'PUT',
      }).then(response => response.json())
      toast.success('更新成功！')
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) {
      toast.error('更新失败！')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet
      defaultOpen={false}
      open={imageEdit}
      onOpenChange={(open: boolean) => {
        if (!open) {
          setImageEdit(false)
          setImageEditData({} as ImageType)
        }
      }}
      modal={false}
    >
      <SheetContent side="left" className="w-full overflow-y-auto scrollbar-hide p-2" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader>
          <SheetTitle>编辑图片</SheetTitle>
        </SheetHeader>
        <div className="mt-2 space-y-2">
          <label
            htmlFor="title"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 图片标题 </span>

            <input
              type="text"
              id="title"
              placeholder="请输入图片标题"
              value={image?.title ?? ''}
              onChange={(e) => setImageEditData({...image, title: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 链接 </span>

            <input
              type="text"
              id="url"
              placeholder="输入链接"
              value={image?.url ?? ''}
              onChange={(e) => setImageEditData({...image, url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="preview_url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 预览链接 </span>

            <input
              type="text"
              id="preview_url"
              placeholder="输入预览链接"
              value={image?.preview_url ?? ''}
              onChange={(e) => setImageEditData({...image, preview_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="video_url"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 视频链接 </span>

            <input
              type="text"
              id="video_url"
              placeholder="输入视频链接"
              value={image?.video_url ?? ''}
              onChange={(e) => setImageEditData({...image, video_url: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="detail"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 详情 </span>

            <input
              type="text"
              id="detail"
              placeholder="输入详情"
              value={image?.detail ?? ''}
              onChange={(e) => setImageEditData({...image, detail: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="width"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 宽度 px </span>

            <input
              type="number"
              id="width"
              value={image?.width ?? 0}
              onChange={(e) => setImageEditData({...image, width: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="height"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 高度 px </span>

            <input
              type="number"
              id="height"
              value={image?.height ?? 0}
              onChange={(e) => setImageEditData({...image, height: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lon"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 经度 </span>

            <input
              type="text"
              id="lon"
              placeholder="输入经度"
              value={image?.lon ?? ''}
              onChange={(e) => setImageEditData({...image, lon: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="lat"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 纬度 </span>

            <input
              type="text"
              id="lat"
              placeholder="输入纬度"
              value={image?.lat ?? ''}
              onChange={(e) => setImageEditData({...image, lat: e.target.value})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <label
            htmlFor="sort"
            className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600"
          >
            <span className="text-xs font-medium text-gray-700"> 排序 </span>

            <input
              type="number"
              id="sort"
              value={image?.sort ?? 0}
              onChange={(e) => setImageEditData({...image, sort: Number(e.target.value)})}
              className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
            />
          </label>
          <TagInput
            tags={!image.labels ? [] : image.labels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
            setTags={(newTags: any) => {
              setImageEditData({...image, labels: newTags?.map((label: Tag) => label.text)})
            }}
            placeholder="请输入图片索引标签，如：猫猫，不要输入特殊字符。"
            styleClasses={{
              inlineTagsContainer:
                'border-input rounded-lg bg-background shadow-sm shadow-black/5 transition-shadow focus-within:border-ring focus-within:outline-none focus-within:ring-[3px] focus-within:ring-ring/20 p-1 gap-1',
              input: 'w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7',
              tag: {
                body: 'h-7 relative bg-background border border-input hover:bg-background rounded-md font-medium text-xs ps-2 pe-7',
                closeButton:
                  'absolute -inset-y-px -end-px p-0 rounded-e-lg flex size-7 transition-colors outline-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 text-muted-foreground/80 hover:text-foreground',
              },
            }}
            activeTagIndex={activeTagIndex}
            setActiveTagIndex={setActiveTagIndex}
          />

          {/* EXIF 信息编辑区域 */}
          <div className="border-t pt-4 mt-4">
            <h3 className="text-sm font-semibold mb-3">EXIF 信息</h3>
            
            <label
              htmlFor="exif_data_time"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 拍摄日期 (YYYY-MM-DD) </span>
              <input
                type="date"
                id="exif_data_time"
                value={image?.exif?.data_time ? image.exif.data_time.split(' ')[0].replace(/:/g, '-') : ''}
                onChange={(e) => {
                  const dateValue = e.target.value ? `${e.target.value.replace(/-/g, ':')} 00:00:00` : ''
                  setImageEditData({...image, exif: {...image.exif, data_time: dateValue}})
                }}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_make"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 相机品牌 </span>
              <input
                type="text"
                id="exif_make"
                placeholder="如：Canon"
                value={image?.exif?.make ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, make: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_model"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 相机型号 </span>
              <input
                type="text"
                id="exif_model"
                placeholder="如：EOS R5"
                value={image?.exif?.model ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, model: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_lens_model"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 镜头型号 </span>
              <input
                type="text"
                id="exif_lens_model"
                placeholder="如：RF24-70mm F2.8 L IS USM"
                value={image?.exif?.lens_model ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, lens_model: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_focal_length"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 焦距 (mm) </span>
              <input
                type="text"
                id="exif_focal_length"
                placeholder="如：50mm"
                value={image?.exif?.focal_length ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, focal_length: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_f_number"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 光圈 </span>
              <input
                type="text"
                id="exif_f_number"
                placeholder="如：f/2.8"
                value={image?.exif?.f_number ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, f_number: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_exposure_time"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> 快门速度 </span>
              <input
                type="text"
                id="exif_exposure_time"
                placeholder="如：1/200s"
                value={image?.exif?.exposure_time ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, exposure_time: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>

            <label
              htmlFor="exif_iso"
              className="block overflow-hidden rounded-md border border-gray-200 px-3 py-2 shadow-sm focus-within:border-blue-600 focus-within:ring-1 focus-within:ring-blue-600 mb-2"
            >
              <span className="text-xs font-medium text-gray-700"> ISO </span>
              <input
                type="text"
                id="exif_iso"
                placeholder="如：100"
                value={image?.exif?.iso_speed_rating ?? ''}
                onChange={(e) => setImageEditData({...image, exif: {...image.exif, iso_speed_rating: e.target.value}})}
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 sm:text-sm"
              />
            </label>
          </div>

          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要显示图片
              </div>
            </div>
            <Switch
              className="cursor-pointer"
              checked={image?.show === 0}
              onCheckedChange={(value) => setImageEditData({...image, show: value ? 0 : 1})}
            />
          </div>
          <div className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
            <div className="flex flex-col gap-1">
              <div className="text-medium">首页显示状态</div>
              <div className="text-tiny text-default-400">
                是否需要在首页显示图片
              </div>
            </div>
            <Switch
              className="cursor-pointer"
              checked={image?.show_on_mainpage === 0}
              onCheckedChange={(value) => setImageEditData({...image, show_on_mainpage: value ? 0 : 1})}
            />
          </div>
          <Button
            type="primary"
            loading={loading}
            onClick={() => submit()}
            className="w-full"
            size="large"
          >
            更新
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}