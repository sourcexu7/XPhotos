'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { Upload as AntUpload, Form as AntForm, Input as AntInput, Button as AntButton, Modal as AntModal, message as AntMessage, AutoComplete as AntAutoComplete, Tag as AntTag, Card as AntCard, Space as AntSpace, InputNumber as AntInputNumber, DatePicker as AntDatePicker } from 'antd'
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from '~/components/ui/select'
import MultipleSelector, { Option as MSOption } from '~/components/ui/origin/multiselect'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
import { getAlistStorages, addImage } from '~/lib/api/services'
import { UploadIcon } from '~/components/icons/upload'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'
const { Dragger } = AntUpload

interface UploadFile extends File {
  __key?: string
}

interface UploadResponse {
  code: number
  data?: {
    url: string
    imageId: string
    fileName: string
    key: string
  }
}

type AlistStorage = {
  mount_path: string
}

export default function LivePhotoFileUpload() {
  const t = useTranslations()
  const { data: albums } = useSWR('/api/v1/albums/get', fetcher)
  const { data: config } = useSWR('/api/v1/settings/get', fetcher)
  const [album, setAlbum] = useState('')
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [imageLabels, setImageLabels] = useState<string[]>([])
  const [exif, setExif] = useState<ExifType | null>(null)
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [hash, setHash] = useState('')
  const [detail, setDetail] = useState('')
  const [imageId, setImageId] = useState('')
  const [storage, setStorage] = useState('r2')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [alistStorage, setAlistStorage] = useState<AlistStorage[]>([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [primarySelect, setPrimarySelect] = useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<any[]>([])
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [exifPresets, setExifPresets] = useState({
    cameraModels: [] as string[],
    shutterSpeeds: [] as string[],
    isos: [] as string[],
    apertures: [] as string[],
  })
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [editingPresetsText, setEditingPresetsText] = useState({
    cameraModels: '',
    shutterSpeeds: '',
    isos: '',
    apertures: '',
  })
  const [previewCompressQuality, setPreviewCompressQuality] = useState(0.8)
  const [previewImageMaxWidthLimit, setPreviewImageMaxWidthLimit] = useState(0)
  const [previewImageMaxWidthLimitSwitchOn, setPreviewImageMaxWidthLimitSwitchOn] = useState(false)

  useEffect(() => {
    if (config?.data) {
      const c = config.data
      if (c.preview_compress_quality) setPreviewCompressQuality(Number(c.preview_compress_quality))
      if (c.preview_image_max_width_limit) setPreviewImageMaxWidthLimit(Number(c.preview_image_max_width_limit))
      if (c.preview_image_max_width_limit_switch_on) setPreviewImageMaxWidthLimitSwitchOn(c.preview_image_max_width_limit_switch_on === 'true')
    }
  }, [config])

  useEffect(() => {
    if (config?.data?.exif_presets) {
      try {
        const presets = JSON.parse(config.data.exif_presets)
        setExifPresets({
          cameraModels: presets.cameraModels || [],
          shutterSpeeds: presets.shutterSpeeds || [],
          isos: presets.isos || [],
          apertures: presets.apertures || [],
        })
      } catch (e) {
        console.error('Failed to parse EXIF presets:', e)
      }
    }
  }, [config])

  useEffect(() => {
    const loadTags = async () => {
      try {
        const res = await fetcher('/api/v1/settings/tags/get?tree=true')
        if (res?.data) setTagTree(res.data)
      } catch (e) {
        console.error('Failed to load tags:', e)
      }
    }
    loadTags()
  }, [])

  useEffect(() => {
    if (Array.isArray(tagTree) && tagTree.length > 0) {
      const allTags: string[] = []
      tagTree.forEach((node: any) => {
        if (node.children && Array.isArray(node.children)) {
          node.children.forEach((child: any) => {
            if (child.name && !allTags.includes(child.name)) {
              allTags.push(child.name)
            }
          })
        }
      })
      setPresetTags(allTags)
    }
  }, [tagTree])

  useEffect(() => {
    setImageLabels(prev => {
      const labels = [...prev]
      if (primarySelect && !labels.includes(primarySelect)) labels.push(primarySelect)
      secondarySelect?.forEach(s => { if (!labels.includes(s)) labels.push(s) })
      return labels
    })
  }, [primarySelect, secondarySelect])

  function togglePresetTag(tag: string) {
    if (!Array.isArray(imageLabels)) { setImageLabels([tag]); return }
    if (imageLabels.includes(tag)) setImageLabels(imageLabels.filter((t:string)=>t!==tag))
    else setImageLabels([...imageLabels, tag])
  }

  const loadExif = useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setExif(exifObj)
      if (tags?.GPSLatitude?.description) setLat(tags?.GPSLatitude?.description)
      else setLat('')
      if (tags?.GPSLongitude?.description) setLon(tags?.GPSLongitude?.description)
      else setLon('')
    } catch { console.error('loadExif error') }
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => { setWidth(Number(img.width)); setHeight(Number(img.height)) }
        if (e.target && typeof e.target.result === 'string') img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch { console.error('loadExif reader error') }
  }, [])

  const applyReferenceExif = useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setExif((prev) => ({ ...(prev || {}), ...exifObj }))
      setLat(tags?.GPSLatitude?.description || '')
      setLon(tags?.GPSLongitude?.description || '')
      toast.success(t('Upload.referenceExifToastSuccess'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      toast.error(t('Upload.referenceExifToastError'))
    }
  }, [t])

  async function getAlistStorage() {
    if (alistStorage.length > 0) { setStorageSelect(true); return }
    try {
      const res = await getAlistStorages()
      if (res?.code === 200) { setAlistStorage(res.data?.content); setStorageSelect(true) }
      else toast.error(t('Tips.getFailed'))
    } catch { toast.error(t('Tips.getFailed')) }
  }

  const storages = [ { label: 'Cloudflare R2', value: 'r2' }, { label: 'Amazon S3', value: 's3' }, { label: 'AList API', value: 'alist' } ]

  const uploadPreviewImage = useCallback((file: File, type: string) => {
    return new Promise<void>((resolve, reject) => {
      new Compressor(file, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/webp',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          try {
            const res = await uploadFile(compressedFile as File, type, storage, alistMountPath, { onProgress: () => {} })
            if (res?.code === 200) {
              setPreviewUrl(res?.data?.url || '')
              resolve()
            } else {
              reject(new Error('Upload failed'))
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error('Upload failed'))
          }
        },
        error(err) {
          reject(err instanceof Error ? err : new Error('Upload failed'))
        }
      })
    })
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, alistMountPath])

  const resHandle = useCallback(async (res: UploadResponse, file: File, type: number) => {
    if (type === 2) {
      if (res?.code === 200) setVideoUrl(res?.data?.url || '')
      else throw new Error('Upload failed')
    } else {
      if (res?.code === 200) {
        try { if (album === '/') await uploadPreviewImage(file, '/preview'); else await uploadPreviewImage(file, album + '/preview') }
        catch { throw new Error('Upload failed') }
        await loadExif(file)
        setHash(await encodeBrowserThumbHash(file))
        setUrl(res?.data?.url || '')
        if (res?.data?.imageId) setImageId(res?.data?.imageId)
      } else throw new Error('Upload failed')
    }
  }, [album, uploadPreviewImage, loadExif])

  const onRequestUpload = useCallback(async (file: File, type: number) => {
    const fileName = file.name.split('.').slice(0, -1).join('.')
      if (await isHeic(file) && type === 1) {
      const outputBuffer: Blob | Blob[] = await heicTo({ blob: file, type: 'image/jpeg' })
      const outputFile = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
      await uploadFile(outputFile, album, storage, alistMountPath, { onProgress: () => {} }).then(async (res) => { if (res.code === 200) await resHandle(res, outputFile, type); else throw new Error('Upload failed') })
    } else {
      await uploadFile(file, album, storage, alistMountPath, { onProgress: () => {} }).then(async (res) => { await resHandle(res, file, type) })
    }
  }, [album, storage, alistMountPath, resHandle])

  async function onBeforeUpload(type: number) { if (type === 1) { setTitle(''); setPreviewUrl(''); setVideoUrl(''); setImageLabels([]) } }

  const [images, setImages] = useState<UploadFile[]>([])
  const [videos, setVideos] = useState<UploadFile[]>([])

  const onImageUpload = useCallback(async (files: File[], { onSuccess, onError }: { onSuccess: (file: File) => void, onError: (file: File, error: Error) => void }) => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(async (file) => { try { await onBeforeUpload(1); await onRequestUpload(file, 1); onSuccess(file) } catch (error) { onError(file, error instanceof Error ? error : new Error('Upload failed')); throw new Error('Upload failed') } })
      toast.promise(() => Promise.all(uploadPromises), { loading: t('Upload.uploading'), success: () => t('Upload.uploadSuccess'), error: t('Upload.uploadError') }).finally(()=>setIsUploading(false))
    } catch (error) { console.error('Unexpected error during upload:', error); toast.error('Upload failed'); setIsUploading(false) }
  }, [onRequestUpload, t])

  const onVideoUpload = useCallback(async (files: File[], { onSuccess, onError }: { onSuccess: (file: File) => void, onError: (file: File, error: Error) => void }) => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(async (file) => { try { await onBeforeUpload(2); await onRequestUpload(file, 2); onSuccess(file) } catch (error) { onError(file, error instanceof Error ? error : new Error('Upload failed')); throw new Error('Upload failed') } })
      toast.promise(() => Promise.all(uploadPromises), { loading: t('Upload.uploading'), success: () => t('Upload.uploadSuccess'), error: t('Upload.uploadError') }).finally(()=>setIsUploading(false))
    } catch (error) { console.error('Unexpected error during upload:', error); toast.error('Upload failed'); setIsUploading(false) }
  }, [onRequestUpload, t])

  const submit = async () => {
    if (!url || url === '') { 
      // show modal to allow upload first
      setShowMissingModal(true)
      return
    }
    if (album === '') { toast.warning(t('Tips.selectAlbumFirst')); return }
    if (!height || height <= 0) { toast.warning(t('Tips.imageHeightRequired')); return }
    if (!width || width <= 0) { toast.warning(t('Tips.imageWidthRequired')); return }

    // 提交前校验原图 / 预览图 / 视频 URL 是否可访问；若失败且仍有本地文件，则自动重传一次
    async function verifyUrlAccessible(targetUrl: string): Promise<boolean> {
      if (!targetUrl || typeof targetUrl !== 'string') return false
      if (!/^https?:\/\//i.test(targetUrl)) return true
      try {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 8000)
        const res = await fetch(targetUrl, {
          method: 'HEAD',
          mode: 'cors',
          signal: controller.signal,
        })
        clearTimeout(timer)
        if (!res.ok) {
          const getController = new AbortController()
          const getTimer = setTimeout(() => getController.abort(), 8000)
          const probe = await fetch(targetUrl, {
            method: 'GET',
            mode: 'cors',
            signal: getController.signal,
          })
          clearTimeout(getTimer)
          return probe.ok
        }
        return true
      } catch {
        return false
      }
    }

    // 校验图像原图 / 预览图
    if (url) {
      const originOk = await verifyUrlAccessible(url)
      let previewOk = true
      if (previewUrl) {
        previewOk = await verifyUrlAccessible(previewUrl)
      }

      if (!originOk || !previewOk) {
        // 若还有本地图片文件，尝试自动重传一次
        if (images && images.length > 0) {
          try {
            await onImageUpload(images, { onSuccess: () => {}, onError: () => {} })
          } catch (e) {
            console.error('Re-upload photo after failed remote verification error', e)
                toast.error(t('Tips.cloudRemoteFileAnomalyRetryFailed'))
            return
          }
        } else {
              toast.error(t('Tips.remoteOriginOrPreviewMissing'))
          return
        }
      }
    }

    // 校验视频 URL（若存在）
    if (videoUrl) {
      const videoOk = await verifyUrlAccessible(videoUrl)
      if (!videoOk) {
        if (videos && videos.length > 0) {
          try {
            await onVideoUpload(videos, { onSuccess: () => {}, onError: () => {} })
          } catch (e) {
            console.error('Re-upload video after failed remote verification error', e)
            toast.error(t('Tips.cloudRemoteVideoAnomalyRetryFailed'))
            return
          }
        } else {
          toast.error(t('Tips.remoteVideoMissing'))
          return
        }
      }
    }

    // 构建 tagCategoryMap
    const tagCategoryMap: Record<string, string> = {}
    if (primarySelect) tagCategoryMap[primarySelect] = ''
    secondarySelect.forEach(tag => { tagCategoryMap[tag] = primarySelect || '' })

    const data = {
      album,
      title: title || '',
      url,
      preview_url: previewUrl || url,
      video_url: videoUrl || '',
      exif,
      width,
      height,
      lat: lat || '',
      lon: lon || '',
      detail: detail || '',
      labels: imageLabels,
      hash,
      type: 3,
      tagCategoryMap: Object.keys(tagCategoryMap).length ? tagCategoryMap : undefined,
    } as ImageType & { tagCategoryMap?: Record<string,string> }
    try {
      const res = await addImage(data)
      if (res?.code === 200) toast.success(t('Tips.saveSuccess'))
      else toast.error(t('Tips.saveFailed'))
    } catch { toast.error(t('Tips.saveFailed')) }
  }

  return (
    <div className="admin-upload flex flex-col space-y-2 h-full flex-1 font-sans text-sm">
      <div className="flex items-end space-x-2">
        <div className="flex flex-1 w-full space-x-1">
          <div className="flex flex-col" style={{ minWidth: 140 }}>
            <div className="text-xs text-gray-600 mb-1">{t('Upload.selectStorage')}</div>
            <Select value={storage} onValueChange={(value: string) => { setStorage(value); if (value === 'alist') { getAlistStorage() } else { setStorageSelect(false) } if (value === 's3') { try { toast.info(t('Tips.switchToS3Info')) } catch {} } }}>
              <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectStorage')} /></SelectTrigger>
              <SelectContent>
                {storages?.map((s: { label: string, value: string }) => (<SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-xs text-gray-600 mb-1">{t('Upload.selectAlbum')}</div>
            <Select value={album ?? undefined} onValueChange={(value: string) => setAlbum(value)}>
              <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectAlbum')} /></SelectTrigger>
              <SelectContent>
                {(albums?.data as AlbumType[])?.map((a: AlbumType) => (<SelectItem key={a.album_value} value={a.album_value}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          {storageSelect && (
            <div className="flex flex-col" style={{ minWidth: 140 }}>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.alistMountPath')}</div>
              <Select value={alistMountPath} onValueChange={(value: string) => setAlistMountPath(value)}>
                <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectMountPath')} /></SelectTrigger>
                <SelectContent>
                  {alistStorage?.map((s: AlistStorage) => (<SelectItem key={s.mount_path} value={s.mount_path}>{s.mount_path}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col space-y-2 overflow-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          <AntCard title={t('Upload.uploadImage')} className="shadow-sm">
            <Dragger
              accept="image/*,.heic"
              multiple={false}
              showUploadList={false}
              customRequest={({ file, onSuccess, onError }: any) => { onImageUpload([file], { onSuccess, onError }) }}
              disabled={isUploading}
            >
              <div className="flex flex-col items-center justify-center py-6">
                <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t('Upload.dragImageHere')}</p>
                <p className="text-xs text-gray-400 mt-1">{t('Upload.supportHeic')}</p>
              </div>
            </Dragger>
          </AntCard>

          <AntCard title={t('Upload.uploadVideo')} className="shadow-sm">
            <Dragger
              accept="video/*"
              multiple={false}
              showUploadList={false}
              customRequest={({ file, onSuccess, onError }: any) => { onVideoUpload([file], { onSuccess, onError }) }}
              disabled={isUploading}
            >
              <div className="flex flex-col items-center justify-center py-6">
                <UploadIcon className="h-8 w-8 text-gray-400 mb-2" />
                <p className="text-sm text-gray-600">{t('Upload.dragVideoHere')}</p>
              </div>
            </Dragger>
          </AntCard>
        </div>

        <AntCard title={t('Upload.imageInfo')} className="shadow-sm">
          <AntForm layout="vertical" className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <AntForm.Item label={t('Upload.title')} className="mb-0">
                <AntInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('Upload.inputTitle')} />
              </AntForm.Item>
              <AntForm.Item label={t('Upload.imageLabels')} className="mb-0">
                <MultipleSelector
                  value={imageLabels.map((l) => ({ label: l, value: l }))}
                  onChange={(v: MSOption[]) => setImageLabels(v.map((i) => i.value))}
                  options={presetTags.map((t) => ({ label: t, value: t }))}
                  placeholder={t('Upload.selectOrInputLabels')}
                  creatable
                />
              </AntForm.Item>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <AntForm.Item label={t('Upload.primaryTag')} className="mb-0">
                <Select value={primarySelect ?? undefined} onValueChange={(v: string) => setPrimarySelect(v)}>
                  <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectPrimaryTag')} /></SelectTrigger>
                  <SelectContent>
                    {tagTree?.map((node: any) => (<SelectItem key={node.id || node.category} value={node.category}>{node.category}</SelectItem>))}
                  </SelectContent>
                </Select>
              </AntForm.Item>
              <AntForm.Item label={t('Upload.secondaryTags')} className="mb-0">
                <MultipleSelector
                  value={secondarySelect.map((s) => ({ label: s, value: s }))}
                  onChange={(v: MSOption[]) => setSecondarySelect(v.map((i) => i.value))}
                  options={tagTree?.find((n: any) => n.category === primarySelect)?.children?.map((c: any) => ({ label: c.name, value: c.name })) || []}
                  placeholder={t('Upload.selectSecondaryTags')}
                  disabled={!primarySelect}
                />
              </AntForm.Item>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <AntForm.Item label={t('Upload.width')} className="mb-0">
                <AntInputNumber value={width} onChange={(v) => setWidth(v || 0)} className="w-full" />
              </AntForm.Item>
              <AntForm.Item label={t('Upload.height')} className="mb-0">
                <AntInputNumber value={height} onChange={(v) => setHeight(v || 0)} className="w-full" />
              </AntForm.Item>
              <AntForm.Item label={t('Upload.shootingTime')} className="mb-0">
                <AntDatePicker
                  showTime
                  locale={zhCN}
                  value={exif?.date ? dayjs(exif.date) : null}
                  onChange={(d) => setExif((prev) => ({ ...prev, date: d?.toDate() } as any))}
                  className="w-full"
                />
              </AntForm.Item>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <AntForm.Item label={t('Upload.lat')} className="mb-0">
                <AntInput value={lat} onChange={(e) => setLat(e.target.value)} placeholder={t('Upload.inputLat')} />
              </AntForm.Item>
              <AntForm.Item label={t('Upload.lon')} className="mb-0">
                <AntInput value={lon} onChange={(e) => setLon(e.target.value)} placeholder={t('Upload.inputLon')} />
              </AntForm.Item>
            </div>

            <AntForm.Item label={t('Upload.detail')} className="mb-0">
              <AntInput.TextArea value={detail} onChange={(e) => setDetail(e.target.value)} rows={3} placeholder={t('Upload.inputDetail')} />
            </AntForm.Item>
          </AntForm>
        </AntCard>

        <AntCard title={t('Upload.preview')} className="shadow-sm">
          <div className="grid grid-cols-2 gap-2">
            {url && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">{t('Upload.originalImage')}</div>
                <img src={url} alt="original" className="max-h-40 object-contain rounded border" />
              </div>
            )}
            {previewUrl && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">{t('Upload.previewImage')}</div>
                <img src={previewUrl} alt="preview" className="max-h-40 object-contain rounded border" />
              </div>
            )}
            {videoUrl && (
              <div className="space-y-1">
                <div className="text-xs text-gray-500">{t('Upload.video')}</div>
                <video src={videoUrl} controls className="max-h-40 rounded border" />
              </div>
            )}
          </div>
        </AntCard>
      </div>

      <div className="flex justify-end pt-2">
        <AntButton type="primary" onClick={submit} loading={isUploading}>
          {t('Upload.save')}
        </AntButton>
      </div>

      <AntModal
        title={t('Upload.missingFile')}
        open={showMissingModal}
        onOk={() => setShowMissingModal(false)}
        onCancel={() => setShowMissingModal(false)}
        okText={t('Button.ok')}
        cancelText={t('Button.cancel')}
      >
        <p>{t('Upload.pleaseUploadImageFirst')}</p>
      </AntModal>
    </div>
  )
}
