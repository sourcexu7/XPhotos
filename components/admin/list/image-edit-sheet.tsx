'use client'

import { useButtonStore } from '~/app/providers/button-store-providers'
import type { ImageType } from '~/types'
import type { ImageServerHandleProps } from '~/types/props'
import { useSwrInfiniteServerHook } from '~/hooks/use-swr-infinite-server-hook'
import React, { useState, useRef } from 'react'
import { message } from 'antd'
import { ReloadOutlined } from '@ant-design/icons'
import { Button, Switch, Drawer } from 'antd'
import { TagInput } from 'emblor'
import { exifReader } from '~/lib/utils/file'
import { useTranslations } from 'next-intl'

export default function ImageEditSheet(props : Readonly<ImageServerHandleProps & { pageNum: number } & { album: string }>) {
  const { pageNum, album, ...restProps } = props
  const { mutate } = useSwrInfiniteServerHook(restProps, pageNum, album)
  const { imageEdit, image, setImageEdit, setImageEditData } = useButtonStore(
    (state) => state,
  )
  const [loading, setLoading] = useState(false)
  const [activeTagIndex, setActiveTagIndex] = useState<number | null>(null)
  const referenceInputRef = useRef<HTMLInputElement | null>(null)
  const t = useTranslations('List')

  const applyReferenceExif = async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setImageEditData({
        ...image,
        exif: { ...(image?.exif || {}), ...exifObj },
        lat: tags?.GPSLatitude?.description || image?.lat || '',
        lon: tags?.GPSLongitude?.description || image?.lon || '',
      } as ImageType)
      message.success(t('exifExtractedNoRef'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      message.error(t('exifParseFailed'))
    }
  }

  async function submit() {
    if (!image.url) { message.error(t('urlRequired')); return }
    if (!image.height || image.height <= 0) { message.error(t('heightRequired')); return }
    if (!image.width || image.width <= 0) { message.error(t('widthRequired')); return }
    try {
      setLoading(true)
      await fetch('/api/v1/images/update', { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(image), method: 'PUT' }).then(response => response.json())
      message.success(t('updateSuccess'))
      setImageEditData({} as ImageType)
      setImageEdit(false)
      await mutate()
    } catch (e) { message.error(t('updateFailed')) } finally { setLoading(false) }
  }

  const GroupTitle = ({ title }: { title: string }) => (
    <div className="text-sm font-medium text-foreground uppercase tracking-wide mb-4 mt-6 pb-2 border-b border-border">
      {title}
    </div>
  )

  const InputField = ({ label, id, value, onChange, type = 'text', placeholder = '' }: any) => (
    <label
      htmlFor={id}
      className="block overflow-hidden rounded-lg border border-border px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 mb-4 bg-card transition-all duration-200"
    >
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      <input
        type={type}
        id={id}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 text-sm text-foreground font-normal placeholder:text-muted-foreground"
      />
    </label>
  )

  return (
    <Drawer
      title={t('editImageTitle')}
      placement="left"
      size="large"
      open={imageEdit}
      onClose={() => { setImageEdit(false); setImageEditData({} as ImageType) }}
      mask={false}
      styles={{
        header: { padding: '16px 24px', background: 'var(--card)' },
        body: { padding: 0 },
      }}
      footer={
        <div className="p-4 bg-card border-t border-border">
          <Button 
            type="primary"
            disabled={loading}
            onClick={() => submit()} 
            className="w-full h-10 bg-primary hover:bg-primary/90 border-none text-base font-medium shadow-sm transition-all duration-200 transform hover:scale-[1.01]"
          >
            {loading && <ReloadOutlined spin style={{ marginRight: 8, fontSize: 16 }} />}
            {t('saveChanges')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col h-full bg-card">
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          <GroupTitle title={t('basicInfo')} />
          <div className="space-y-4">
            <InputField label={t('titleLabel')} id="title" value={image?.title ?? ''} onChange={(e:any) => setImageEditData({...image, title: e.target.value})} placeholder={t('titlePlaceholder')} />
            <InputField label={t('detailLabel')} id="detail" value={image?.detail ?? ''} onChange={(e:any) => setImageEditData({...image, detail: e.target.value})} placeholder={t('detailPlaceholder')} />
            
            <div className="mb-4">
              <label className="block text-xs font-medium text-muted-foreground mb-2">{t('tagLabel')}</label>
              <TagInput
                tags={!image.labels ? [] : image.labels.map((label: string) => ({ id: Math.floor(Math.random() * 1000).toString(), text: label }))}
                setTags={(newTags: any) => setImageEditData({...image, labels: newTags?.map((label: any) => label.text)})}
                placeholder={t('tagPlaceholder')}
                styleClasses={{
                  inlineTagsContainer: 'border border-border rounded-lg bg-card p-2 gap-2 min-h-[44px] transition-all duration-200 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20',
                  input: 'w-full min-w-[100px] focus-visible:outline-none shadow-none px-2 h-8 text-sm text-foreground font-normal placeholder:text-muted-foreground',
                  tag: { body: 'h-7 bg-muted border border-border rounded text-xs px-2 flex items-center gap-1 text-foreground', closeButton: 'text-muted-foreground hover:text-destructive transition-colors' },
                }}
                activeTagIndex={activeTagIndex}
                setActiveTagIndex={setActiveTagIndex}
              />
            </div>

            <div className="p-4 border border-border rounded-lg bg-muted/50 transition-all duration-200">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{t('showStatus')}</span>
                <Switch 
                  checked={image?.show === 0} 
                  onChange={(checked) => setImageEditData({...image, show: checked ? 0 : 1})} 
                  checkedChildren={t('show')} 
                  unCheckedChildren={t('hide')}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </div>

            <InputField label={t('sortWeightDesc')} id="sort" type="number" value={image?.sort ?? 0} onChange={(e:any) => setImageEditData({...image, sort: Number(e.target.value)})} />
          </div>

          <GroupTitle title={t('linkResources')} />
          <div className="space-y-4">
            <InputField label={t('originalUrl')} id="url" value={image?.url ?? ''} onChange={(e:any) => setImageEditData({...image, url: e.target.value})} />
            <InputField label={t('previewUrl')} id="preview_url" value={image?.preview_url ?? ''} onChange={(e:any) => setImageEditData({...image, preview_url: e.target.value})} />
            <InputField label={t('videoUrl')} id="video_url" value={image?.video_url ?? ''} onChange={(e:any) => setImageEditData({...image, video_url: e.target.value})} />
          </div>

          <GroupTitle title={t('sizePosition')} />
          <div className="grid grid-cols-2 gap-4">
            <InputField label={t('widthPx')} id="width" type="number" value={image?.width ?? 0} onChange={(e:any) => setImageEditData({...image, width: Number(e.target.value)})} />
            <InputField label={t('heightPx')} id="height" type="number" value={image?.height ?? 0} onChange={(e:any) => setImageEditData({...image, height: Number(e.target.value)})} />
            <InputField label={t('longitude')} id="lon" value={image?.lon ?? ''} onChange={(e:any) => setImageEditData({...image, lon: e.target.value})} />
            <InputField label={t('latitude')} id="lat" value={image?.lat ?? ''} onChange={(e:any) => setImageEditData({...image, lat: e.target.value})} />
          </div>

          <GroupTitle title={t('exifInfo')} />
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Button 
                size="small" 
                onClick={() => referenceInputRef.current?.click()}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground border-none transition-all duration-200"
              >
                {t('extractExifFromRef')}
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
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('cameraBrand')} id="exif_make" value={image?.exif?.make ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, make: e.target.value}})} />
              <InputField label={t('cameraModel')} id="exif_model" value={image?.exif?.model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, model: e.target.value}})} />
            </div>
            <InputField label={t('lensModel')} id="exif_lens_model" value={image?.exif?.lens_model ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, lens_model: e.target.value}})} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label={t('focalLength')} id="exif_focal_length" value={image?.exif?.focal_length ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, focal_length: e.target.value}})} />
              <InputField label={t('aperture')} id="exif_f_number" value={image?.exif?.f_number ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, f_number: e.target.value}})} />
              <InputField label={t('shutter')} id="exif_exposure_time" value={image?.exif?.exposure_time ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, exposure_time: e.target.value}})} />
              <InputField label={t('iso')} id="exif_iso" value={image?.exif?.iso_speed_rating ?? ''} onChange={(e:any) => setImageEditData({...image, exif: {...image.exif, iso_speed_rating: e.target.value}})} />
            </div>
            <div className="mb-4">
              <label className="block overflow-hidden rounded-lg border border-border px-4 py-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20 bg-card transition-all duration-200">
                <span className="text-xs font-medium text-muted-foreground">{t('captureDate')}</span>
                <input 
                  type="date" 
                  value={image?.exif?.data_time ? image.exif.data_time.split(' ')[0].replace(/:/g, '-') : ''} 
                  onChange={(e) => { const dateValue = e.target.value ? `${e.target.value.replace(/-/g, ':')} 00:00:00` : ''; setImageEditData({...image, exif: {...image.exif, data_time: dateValue}}) }} 
                  className="mt-1 w-full border-none p-0 focus:border-transparent focus:outline-none focus:ring-0 text-sm text-foreground font-normal" 
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </Drawer>
  )
}