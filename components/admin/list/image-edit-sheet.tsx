'use client'

import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import React, { useState, useRef } from 'react'
import { toast } from 'sonner'
import { ReloadIcon } from '@radix-ui/react-icons'
import { Switch } from '~/components/ui/switch'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from '~/components/ui/sheet'
import { Button } from '~/components/ui/button'
import { Tag, TagInput } from 'emblor'
import { exifReader } from '~/lib/utils/file'

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const referenceInputRef = useRef<HTMLInputElement | null>(null)

  const applyReferenceExif = async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setImageEditData({
        ...image,
        exif: { ...(image?.exif || {}), ...exifObj },
        lat: tags?.GPSLatitude?.description || image?.lat || '',
        lon: tags?.GPSLongitude?.description || image?.lon || '',
      } as ImageType)
      toast.success('已从参考图提取 EXIF（未上传参考图）')
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      toast.error('参考图无有效 EXIF 信息或解析失败')
    }
  }

  async function submit() {
    if (!image.url) { toast.error('图片链接不能为空！'); return }
    if (!image.height || image.height <= 0) { toast.error('图片高度不能为空且必须大于 0！'); return }
    if (!image.width || image.width <= 0) { toast.error('图片宽度不能为空且必须大于 0！'); return }
    try {
      setLoading(true)
      await fetch('/api/v1/images/update', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(image), method: 'PUT' }).then(response => response.json())
      toast.success('更新成功！')
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) { toast.error('更新失败！') } finally { setLoading(false) }
  }

  const GroupTitle = ({ title }: { title: string }) => (
    <div className="text-sm font-medium text-gray-900 uppercase tracking-wide mb-3 mt-6 pb-2 border-b border-gray-200">
      {title}
    </div>
  )

  const InputField = ({ label, id, value, onChange, type = 'text', placeholder = '' }: any) => (
    <label
      htmlFor={id}
      className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 mb-3 bg-white"
    >
      <span className="text-xs font-medium text-gray-700">{label}</span>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 text-xs !text-black font-normal placeholder:text-gray-400"
      />
    </label>
  )

  return (
    <Sheet
      defaultOpen={false}
      open={imageEdit}
      onOpenChange={(open: boolean) => { if (!open) { setImageEdit(false); setImageEditData({} as ImageType) } }}
      modal={false}
    >
      <SheetContent side="left" className="w-[400px] sm:w-[400px] p-0 flex flex-col h-full shadow-2xl border-r border-gray-200 bg-white [&>button]:!text-black [&>button]:!opacity-100" onInteractOutside={(event: any) => event.preventDefault()}>
        <SheetHeader className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <SheetTitle className="text-lg font-semibold text-gray-900">编辑图片信息</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
          <GroupTitle title="基本信息" />
          <InputField label="标题" id="title" value={image?.title ?? ''} onChange={(e:any) => setImageEditData({...image, title: e.target.value})} placeholder="图片标题" />
          <InputField label="详情描述" id="detail" value={image?.detail ?? ''} onChange={(e:any) => setImageEditData({...image, detail: e.target.value})} placeholder="图片描述" />
          
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">标签</label>
            <TagInput
              tags={!image.labels ? [] : image.labels.map((label: string) => ({ id: Math.floor(Math.random() * 1000), text: label }))}
              setTags={(newTags: any) => setImageEditData({...image, labels: newTags?.map((label: Tag) => label.text)})}
              placeholder="输入标签回车添加"
              styleClasses={{
                inlineTagsContainer: 'border border-gray-300 rounded-md bg-white p-1 gap-1 min-h-[38px]',
                input: 'w-full min-w-[80px] focus-visible:outline-none shadow-none px-2 h-7 text-xs !text-black font-normal placeholder:text-gray-400',
                tag: { body: 'h-6 bg-gray-100 border border-gray-200 rounded text-xs px-2 flex items-center gap-1 text-gray-900', closeButton: 'text-gray-400 hover:text-red-500' },
              }}
              activeTagIndex={activeTagIndex}
              setActiveTagIndex={setActiveTagIndex}
            />
          </div>

          <div className="flex gap-4 mb-4">
            <div className="flex items-center justify-between flex-1 p-3 border rounded-lg bg-gray-50">
              <span className="text-sm text-gray-900">显示状态</span>
              <Switch className="data-[state=checked]:bg-gray-900 data-[state=unchecked]:bg-gray-200 [&_span]:bg-white border-transparent" checked={image?.show === 0} onCheckedChange={(value) => setImageEditData({...image, show: value ? 0 : 1})} />
            </div>
          </div>

          <InputField label="排序权重 (越大越靠前)" id="sort" type="number" value={image?.sort ?? 0} onChange={(e:any) => setImageEditData({...image, sort: Number(e.target.value)})} />

          <GroupTitle title="链接资源" />
          <InputField label="原图链接" id="url" value={image?.url ?? ''} onChange={(e:any) => setImageEditData({...image, url: e.target.value})} />
          <InputField label="预览图链接" id="preview_url" value={image?.preview_url ?? ''} onChange={(e:any) => setImageEditData({...image, preview_url: e.target.value})} />
          <InputField label="视频链接 (LivePhoto)" id="video_url" value={image?.video_url ?? ''} onChange={(e:any) => setImageEditData({...image, video_url: e.target.value})} />

          <GroupTitle title="尺寸与位置" />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="宽度 (px)" id="width" type="number" value={image?.width ?? 0} onChange={(e:any) => setImageEditData({...image, width: Number(e.target.value)})} />
            <InputField label="高度 (px)" id="height" type="number" value={image?.height ?? 0} onChange={(e:any) => setImageEditData({...image, height: Number(e.target.value)})} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="经度" id="lon" value={image?.lon ?? ''} onChange={(e:any) => setImageEditData({...image, lon: e.target.value})} />
            <InputField label="纬度" id="lat" value={image?.lat ?? ''} onChange={(e:any) => setImageEditData({...image, lat: e.target.value})} />
          </div>

          <GroupTitle title="EXIF 信息" />
          <div className="mb-2 flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => referenceInputRef.current?.click()}>
              参考图提取 EXIF（仅本地解析）
            </Button>
            <input
              ref={referenceInputRef}
              type="file"
              accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) applyReferenceExif(file)
                e.target.value = ''
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <InputField label="相机品牌" id="exif_make" value={image?.exif?.make ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, make: e.target.value}})} />
            <InputField label="相机型号" id="exif_model" value={image?.exif?.model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, model: e.target.value}})} />
          </div>
          <InputField label="镜头型号" id="exif_lens_model" value={image?.exif?.lens_model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, lens_model: e.target.value}})} />
          <div className="grid grid-cols-2 gap-3">
            <InputField label="焦距" id="exif_focal_length" value={image?.exif?.focal_length ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, focal_length: e.target.value}})} />
            <InputField label="光圈" id="exif_f_number" value={image?.exif?.f_number ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, f_number: e.target.value}})} />
            <InputField label="快门" id="exif_exposure_time" value={image?.exif?.exposure_time ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, exposure_time: e.target.value}})} />
            <InputField label="ISO" id="exif_iso" value={image?.exif?.iso_speed_rating ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, iso_speed_rating: e.target.value}})} />
          </div>
          <div className="mb-3">
            <label className="block overflow-hidden rounded-md border border-gray-100 px-3 py-2 shadow-sm focus-within:border-gray-400 focus-within:ring-1 focus-within:ring-gray-400 bg-white">
              <span className="text-xs font-medium text-gray-700">拍摄日期</span>
              <input 
                type="date" 
                value={image?.exif?.data_time ? image.exif.data_time.split(' ')[0].replace(/:/g, '-') : ''} 
                onChange={(e) => { const dateValue = e.target.value ? `${e.target.value.replace(/-/g, ':')} 00:00:00` : ''; setImageEditData({...image, exif: {...image.exif, data_time: dateValue}}) }} 
                className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 text-xs !text-black font-normal" 
              />
            </label>
          </div>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white">
          <Button 
            disabled={loading}
            onClick={() => submit()} 
            className="w-full h-10 bg-blue-600 hover:bg-blue-700 border-none text-base font-medium rounded-md shadow-sm transition-all text-white"
          >
            {loading && <ReloadIcon className="mr-2 h-4 w-4 animate-spin"/>}
            保存更改
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}