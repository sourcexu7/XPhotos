'use client'

import React, { useState, useEffect, useRef } from 'react'
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
    url?: string
    key?: string
    imageId?: string
    fileName?: string
  }
  message?: string
}

export default function LivephotoFileUpload() {
  dayjs.locale('zh-cn')
  const [alistStorage, setAlistStorage] = useState<{ mount_path: string }[]>([])
  const referenceInputRef = useRef<HTMLInputElement | null>(null)
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('s3')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [imageId, setImageId] = useState('')
  const [primarySelect, setPrimarySelect] = useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = useState<string[]>([])
  const [isUploading, setIsUploading] = useState(false)
  const [showMissingModal, setShowMissingModal] = useState(false)
  // EXIF presets (editable in modal, persisted in localStorage)
  const presetsStorageKey = 'picimpact_exif_presets'
  const defaultPresets = {
    cameraModels: ['Canon EOS R5','Sony A7 III','Nikon Z7 II','Fujifilm X-T4','iPhone 13 Pro'],
    shutterSpeeds: ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1'],
    isos: ['50','100','200','400','800','1600','3200','6400'],
    apertures: ['1.4','1.8','2.0','2.8','3.5','4.0','5.6','8.0','11','16'],
  }
  const [exifPresets, setExifPresets] = useState(() => {
    try { const raw = localStorage.getItem(presetsStorageKey); if (raw) return JSON.parse(raw) } catch {}
    return defaultPresets
  })
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [editingPresetsText, setEditingPresetsText] = useState({ cameraModels: '', shutterSpeeds: '', isos: '', apertures: '' })
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [hash, setHash] = useState('')
  const [detail, setDetail] = useState('')
  const [imageLabels, setImageLabels] = useState([] as string[])

  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const [presetTags, setPresetTags] = useState<string[]>([])
  useEffect(() => { fetcher('/api/v1/settings/tags/get').then((res: { data: { name: string }[] }) => { if (res?.data) setPresetTags(res.data.map((t)=>t.name)) }).catch(()=>{}) }, [])

  useEffect(() => {
    if (!primarySelect && (!secondarySelect || secondarySelect.length === 0)) return
    setImageLabels(prev => {
      const labels = Array.isArray(prev) ? [...prev] : []
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

  const loadExif = React.useCallback(async (file: File) => {
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

  const applyReferenceExif = React.useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setExif((prev) => ({ ...(prev || {}), ...exifObj }))
      setLat(tags?.GPSLatitude?.description || '')
      setLon(tags?.GPSLongitude?.description || '')
      toast.success('已从参考图提取 EXIF（未上传参考图）')
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      toast.error('参考图无有效 EXIF 信息或解析失败')
    }
  }, [])

  async function getAlistStorage() {
    if (alistStorage.length > 0) { setStorageSelect(true); return }
    try {
      const res = await fetch('/api/v1/storage/alist/storages', { method: 'GET' }).then(r=>r.json())
      if (res?.code === 200) { setAlistStorage(res.data?.content); setStorageSelect(true) }
      else toast.error('获取失败')
    } catch { toast.error('获取失败') }
  }

  const storages = [ { label: 'Cloudflare R2', value: 'r2' }, { label: 'Amazon S3', value: 's3' }, { label: 'AList API', value: 'alist' } ]

  const uploadPreviewImage = React.useCallback(async (file: File, type: string) => {
    new Compressor(file, {
      quality: previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
      async success(compressedFile) {
        const res = await uploadFile(compressedFile, type, storage, alistMountPath, { onProgress: () => {} })
        if (res?.code === 200) setPreviewUrl(res?.data?.url || '')
        else throw new Error('Upload failed')
      },
      error() { throw new Error('Upload failed') }
    })
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, alistMountPath])

  const resHandle = React.useCallback(async (res: UploadResponse, file: File, type: number) => {
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

  const onRequestUpload = React.useCallback(async (file: File, type: number) => {
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

  const [images, setImages] = React.useState<UploadFile[]>([])
  const [videos, setVideos] = React.useState<UploadFile[]>([])

  const onImageUpload = React.useCallback(async (files: File[], { onSuccess, onError }: { onSuccess: (file: File) => void, onError: (file: File, error: Error) => void }) => {
    setIsUploading(true)
    try {
      const uploadPromises = files.map(async (file) => { try { await onBeforeUpload(1); await onRequestUpload(file, 1); onSuccess(file) } catch (error) { onError(file, error instanceof Error ? error : new Error('Upload failed')); throw new Error('Upload failed') } })
      toast.promise(() => Promise.all(uploadPromises), { loading: t('Upload.uploading'), success: () => t('Upload.uploadSuccess'), error: t('Upload.uploadError') }).finally(()=>setIsUploading(false))
    } catch (error) { console.error('Unexpected error during upload:', error); toast.error('Upload failed'); setIsUploading(false) }
  }, [onRequestUpload, t])

  const onVideoUpload = React.useCallback(async (files: File[], { onSuccess, onError }: { onSuccess: (file: File) => void, onError: (file: File, error: Error) => void }) => {
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
    const tagCategoryMap: Record<string,string> = {}
    if (primarySelect && secondarySelect && secondarySelect.length>0) secondarySelect.forEach(s => { tagCategoryMap[s]=primarySelect })

    const data = {
      album,
      url,
      client_image_id: imageId,
      title,
      preview_url: previewUrl,
      video_url: videoUrl,
      blurhash: hash,
      exif,
      labels: imageLabels,
      detail,
      width,
      height,
      type: 3,
      lat,
      lon,
      tagCategoryMap: Object.keys(tagCategoryMap).length ? tagCategoryMap : undefined,
    } as ImageType & { tagCategoryMap?: Record<string,string> }
    try {
      const res = await fetch('/api/v1/images/add', { headers: { 'Content-Type': 'application/json' }, method: 'post', body: JSON.stringify(data) }).then(r => r.json())
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
            <Select value={storage} onValueChange={(value: string) => { setStorage(value); if (value === 'alist') { getAlistStorage() } else { setStorageSelect(false) } if (value === 's3') { try { toast.info('已切换到 Amazon S3：无需选择目录，请先选择相册再上传') } catch {} } }}>
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
                {data?.map((a: AlbumType) => (<SelectItem key={a.album_value} value={a.album_value}>{a.name}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col" style={{ minWidth: 240 }}>
            <div className="text-xs text-gray-600 mb-1">一级标签（Primary）</div>
            <Select value={primarySelect ?? undefined} onValueChange={(value: string) => setPrimarySelect(value)}>
              <SelectTrigger className="w-full md:w-[240px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="选择一级标签（可选）" /></SelectTrigger>
              <SelectContent>
                {presetTags?.map((s: string) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col" style={{ minWidth: 240 }}>
            <div className="text-xs text-gray-600 mb-1">二级标签（Secondary，多选）</div>
            <div>
              <MultipleSelector
                value={(secondarySelect || []).map(s => ({ value: s, label: s }))}
                options={(presetTags || []).map(s => ({ value: s, label: s }))}
                placeholder="选择二级标签（可多选）"
                onChange={(opts?: MSOption[]) => setSecondarySelect((opts || []).map(o => o.value))}
              />
            </div>
          </div>

          {storage === 'alist' && storageSelect && alistStorage?.length > 0 && (
            <div style={{ minWidth: 220 }}>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.selectAlistDirectory')}</div>
              <Select value={alistMountPath ?? undefined} onValueChange={(value: string) => setAlistMountPath(value)}>
                <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectAlistDirectory')} /></SelectTrigger>
                <SelectContent>
                  {alistStorage?.map((s: { mount_path: string })=>(<SelectItem key={s?.mount_path} value={s?.mount_path}>{s?.mount_path}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <AntModal
          title="文件未上传"
          open={showMissingModal}
          onCancel={() => setShowMissingModal(false)}
          footer={[
            <AntButton key="cancel" onClick={() => setShowMissingModal(false)}>{'取消'}</AntButton>,
            <AntButton key="upload" type="primary" onClick={async () => {
              setShowMissingModal(false)
              try {
                setIsUploading(true)
                if (images.length>0) await onImageUpload(images, { onSuccess: ()=>{}, onError: ()=>{} })
                if (videos.length>0) await onVideoUpload(videos, { onSuccess: ()=>{}, onError: ()=>{} })
                await submit()
              } catch (e) {
                console.error(e)
                toast.error('上传失败')
              } finally {
                setIsUploading(false)
              }
            }}>{'上传并提交'}</AntButton>
          ]}
        >
          <div>检测到有文件尚未上传。点击“上传并提交”将先上传选中的文件，然后提交元数据。</div>
        </AntModal>

        <div>
          <AntButton className="h-9 flex items-center justify-center" size="middle" type="primary" loading={isUploading} onClick={async ()=>{ try { if (images.length>0) await onImageUpload(images,{onSuccess:()=>{},onError:()=>{}}); if (videos.length>0) await onVideoUpload(videos,{onSuccess:()=>{},onError:()=>{}}); await submit() } catch{ } }} disabled={(images.length===0 && videos.length===0) || album==='' || storage==='' || (storage==='alist' && alistMountPath==='')}>{t('Button.submit')}</AntButton>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="h-full">
          <AntCard className="h-full" title="上传文件">
            <AntSpace vertical size="middle" style={{ width: '100%' }}>
              <Dragger multiple={false} maxCount={1} beforeUpload={()=>false} showUploadList={false} disabled={storage===''||album===''||(storage==='alist'&&alistMountPath==='')} style={{ padding:12, minHeight:120 }} onChange={(info)=>{ const fileList=info.fileList||[]; const last=fileList.length>0? (fileList[fileList.length-1].originFileObj as UploadFile): undefined; if (last) { if (!last.__key) last.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; setImages(last?[last]:[]) } else setImages([]) }}>
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <UploadIcon />
                  <p className="font-medium text-sm">{t('Upload.dragOrClick')}</p>
                  <p className="text-muted-foreground text-xs">{t('Upload.uploadTipsSingle') ?? '可拖拽或点击上传（最多 1 个文件）'}</p>
                  {(storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')) && (
                    <p className="text-[12px]" style={{ color: '#999' }}>
                      请先选择存储与相册{storage === 'alist' ? '（以及 AList 目录）' : ''}
                    </p>
                  )}
                </div>
              </Dragger>

              <Dragger multiple={false} maxCount={1} beforeUpload={()=>false} showUploadList={false} disabled={storage===''||album===''||(storage==='alist'&&alistMountPath==='')} style={{ padding:12, minHeight:120 }} onChange={(info)=>{ const fileList=info.fileList||[]; const last=fileList.length>0? (fileList[fileList.length-1].originFileObj as UploadFile): undefined; if (last) { if (!last.__key) last.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`; setVideos(last?[last]:[]) } else setVideos([]) }}>
                <div className="flex flex-col items-center justify-center h-full gap-2">
                  <UploadIcon />
                  <p className="font-medium text-sm">{t('Upload.dragOrClickVideo') ?? '拖拽或点击上传视频'}</p>
                  <p className="text-muted-foreground text-xs">{t('Upload.uploadTipsSingle') ?? '可拖拽或点击上传（最多 1 个文件）'}</p>
                  {(storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')) && (
                    <p className="text-[12px]" style={{ color: '#999' }}>
                      请先选择存储与相册{storage === 'alist' ? '（以及 AList 目录）' : ''}
                    </p>
                  )}
                </div>
              </Dragger>
            </AntSpace>
          </AntCard>
        </div>

        <div className="h-full">
          <AntCard className="h-full" title="元数据">
            <AntSpace vertical size="middle" style={{ width: '100%' }}>
              <div className="text-xs font-medium" style={{ color: '#666' }}>地址与尺寸</div>
              <div>
                <div className="text-xs text-gray-600 mb-1">{t('Upload.title')}</div>
                <AntInput value={title} placeholder={t('Upload.inputTitle')} onChange={(e)=>setTitle(e.target.value)} />
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">{t('Upload.url')}</div>
                <AntInput disabled value={url} />
                {!url && (
                  <div className="text-[12px] mt-1" style={{ color: '#cf1322' }}>未上传原图，提交前将提示上传或自动上传。</div>
                )}
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">{t('Upload.previewUrl')}</div>
                <AntInput disabled value={previewUrl} />
              </div>

              <div>
                <div className="text-xs text-gray-600 mb-1">{t('Upload.videoUrl')}</div>
                <AntInput disabled value={videoUrl} />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <div className="text-xs text-gray-600 mb-1">{t('Upload.width')}</div>
                  <AntInputNumber disabled value={width} onChange={(val)=>setWidth(Number(val) || 0)} style={{ width: '100%' }} />
                  {!width && (
                    <div className="text-[12px] mt-1" style={{ color: '#cf1322' }}>缺少宽度信息，解析 EXIF 后将自动填充。</div>
                  )}
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">{t('Upload.height')}</div>
                  <AntInputNumber disabled value={height} onChange={(val)=>setHeight(Number(val) || 0)} style={{ width: '100%' }} />
                  {!height && (
                    <div className="text-[12px] mt-1" style={{ color: '#cf1322' }}>缺少高度信息，解析 EXIF 后将自动填充。</div>
                  )}
                </div>
              </div>

              <div className="text-xs font-medium" style={{ color: '#666' }}>描述</div>

            <AntModal
              title="管理常用 EXIF 选项"
              open={isPresetModalOpen}
              onOk={() => {
                try {
                  const next = {
                    cameraModels: editingPresetsText.cameraModels.split(',').map(s=>s.trim()).filter(Boolean),
                    shutterSpeeds: editingPresetsText.shutterSpeeds.split(',').map(s=>s.trim()).filter(Boolean),
                    isos: editingPresetsText.isos.split(',').map(s=>s.trim()).filter(Boolean),
                    apertures: editingPresetsText.apertures.split(',').map(s=>s.trim()).filter(Boolean),
                  }
                  localStorage.setItem(presetsStorageKey, JSON.stringify(next))
                  setExifPresets(next)
                  setIsPresetModalOpen(false)
                  AntMessage.success('已保存常用 EXIF 选项')
                } catch { AntMessage.error('保存失败') }
              }}
              onCancel={() => setIsPresetModalOpen(false)}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div className="text-xs text-gray-600 mb-1">相机机型（逗号分隔）</div>
                  <AntInput value={editingPresetsText.cameraModels} onChange={(e)=>setEditingPresetsText({...editingPresetsText, cameraModels: e.target.value})} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">常用快门（逗号分隔）</div>
                  <AntInput value={editingPresetsText.shutterSpeeds} onChange={(e)=>setEditingPresetsText({...editingPresetsText, shutterSpeeds: e.target.value})} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">常用 ISO（逗号分隔）</div>
                  <AntInput value={editingPresetsText.isos} onChange={(e)=>setEditingPresetsText({...editingPresetsText, isos: e.target.value})} />
                </div>
                <div>
                  <div className="text-xs text-gray-600 mb-1">常用光圈（逗号分隔）</div>
                  <AntInput value={editingPresetsText.apertures} onChange={(e)=>setEditingPresetsText({...editingPresetsText, apertures: e.target.value})} />
                </div>
              </div>
            </AntModal>

            <div>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.detail')}</div>
              <AntInput value={detail} onChange={(e)=>setDetail(e.target.value)} placeholder={t('Upload.inputDetail')} />
            </div>

            <div>
              <div className="text-sm font-medium mb-1">预设标签（点击加入 / 再次点击移除）</div>
              <div className="flex flex-wrap gap-2">
                {presetTags.map((tag) => (
                  <AntTag
                    key={tag}
                    color={imageLabels && imageLabels.includes(tag) ? 'blue' : 'default'}
                    style={{ cursor: 'pointer' }}
                    onClick={() => togglePresetTag(tag)}
                  >
                    {tag}
                  </AntTag>
                ))}
              </div>
            </div>

              {/* EXIF quick-fill */}
              <div>
                <div className="text-sm font-medium mb-1">EXIF 信息（若缺失可选择下拉或手动输入）</div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <AntForm.Item label="相机品牌 / 型号" extra={<a onClick={()=>{ setEditingPresetsText({ cameraModels: exifPresets.cameraModels.join(', '), shutterSpeeds: exifPresets.shutterSpeeds.join(', '), isos: exifPresets.isos.join(', '), apertures: exifPresets.apertures.join(', ') }); setIsPresetModalOpen(true) }}>管理常用选项</a>}>
                    <Select value={exif?.model || undefined} onValueChange={(v)=>setExif({...exif, model: v})}>
                      <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="常用机型" /></SelectTrigger>
                      <SelectContent>
                        {exifPresets.cameraModels.map((m: string)=> (<SelectItem key={m} value={m}>{m}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </AntForm.Item>
                  <AntForm.Item label="快门 (exposure time)">
                    <div style={{ display:'flex', gap:8 }}>
                      <Select value={exif?.exposure_time || undefined} onValueChange={(v)=>setExif({...exif, exposure_time: v})}>
                        <SelectTrigger className="min-w-[140px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="常用快门" /></SelectTrigger>
                        <SelectContent>
                          {exifPresets.shutterSpeeds.map((s: string)=> (<SelectItem key={s} value={s}>{s}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <AntInput value={exif?.exposure_time || ''} onChange={(e)=>setExif({...exif, exposure_time: e.target.value})} placeholder="或者手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="ISO">
                    <div style={{ display:'flex', gap:8 }}>
                      <Select value={exif?.iso_speed_rating || undefined} onValueChange={(v)=>setExif({...exif, iso_speed_rating: v})}>
                        <SelectTrigger className="min-w-[140px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="常用 ISO" /></SelectTrigger>
                        <SelectContent>
                          {exifPresets.isos.map((i: string)=> (<SelectItem key={i} value={i}>{i}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <AntInput value={exif?.iso_speed_rating || ''} onChange={(e)=>setExif({...exif, iso_speed_rating: e.target.value})} placeholder="或者手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="光圈 (f/)">
                    <div style={{ display:'flex', gap:8 }}>
                      <Select value={exif?.f_number || undefined} onValueChange={(v)=>setExif({...exif, f_number: v})}>
                        <SelectTrigger className="min-w-[140px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder="常用光圈" /></SelectTrigger>
                        <SelectContent>
                          {exifPresets.apertures.map((a: string)=> (<SelectItem key={a} value={a}>{a}</SelectItem>))}
                        </SelectContent>
                      </Select>
                      <AntInput value={exif?.f_number || ''} onChange={(e)=>setExif({...exif, f_number: e.target.value})} placeholder="或者手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="焦距 (mm)">
                    <AntInput value={exif?.focal_length || ''} onChange={(e)=>setExif({...exif, focal_length: e.target.value})} />
                  </AntForm.Item>
                  <AntForm.Item label="拍摄日期">
                    <AntDatePicker
                      style={{ width: '100%' }}
                      placeholder="选择拍摄日期"
                      value={exif?.data_time ? dayjs(exif.data_time) : undefined}
                      onChange={(date) => setExif({ ...exif, data_time: date ? date.format('YYYY-MM-DD') : '' })}
                      disabledDate={(current) => {
                        return current && (current < dayjs('2020-01-01') || current > dayjs().endOf('day'))
                      }}
                      allowClear
                    />
                  </AntForm.Item>
                </div>
              </div>

            <div>
              <MultipleSelector
                value={(imageLabels || []).map((s: string) => ({ value: s, label: s }))}
                options={(presetTags || []).map((s: string) => ({ value: s, label: s }))}
                creatable
                placeholder={t('Upload.indexTag')}
                onChange={(opts?: MSOption[]) => setImageLabels((opts || []).map(o => o.value))}
              />
            </div>

            </AntSpace>
          </AntCard>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <AntButton type="default" onClick={() => referenceInputRef.current?.click()}>
          选择参考图提取 EXIF（仅本地解析，不上传）
        </AntButton>
        <input
          ref={referenceInputRef}
          type="file"
          className="hidden"
          accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) applyReferenceExif(file)
            e.target.value = ''
          }}
        />
      </div>

      {(!exif || Object.keys(exif).length === 0) && (
        <div className="mt-3 p-3 border rounded">
          <div className="text-sm font-medium mb-2">手动填写 EXIF（未检测到）</div>
          <AntForm layout="vertical">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <AntForm.Item label="相机品牌 / 型号" extra={<a onClick={()=>{ setEditingPresetsText({ cameraModels: exifPresets.cameraModels.join(', '), shutterSpeeds: exifPresets.shutterSpeeds.join(', '), isos: exifPresets.isos.join(', '), apertures: exifPresets.apertures.join(', ') }); setIsPresetModalOpen(true) }}>管理常用选项</a>}>
                <div>
                  <MultipleSelector
                    value={exif?.model ? [{ value: String(exif.model), label: String(exif.model) }] : []}
                    options={exifPresets.cameraModels.map((m: string) => ({ value: m, label: m }))}
                    placeholder="可从建议中选择或直接输入相机型号"
                    creatable
                    maxSelected={1}
                    onChange={(opts?: any) => {
                      const v = (opts && opts[0] && opts[0].value) || ''
                      setExif({ ...(exif || {}), model: v })
                    }}
                  />
                </div>
              </AntForm.Item>
              <AntForm.Item label="光圈 (f/)">
                <AntInput value={exif?.f_number || ''} onChange={(e)=>setExif({...exif, f_number: e.target.value})} />
              </AntForm.Item>
              <AntForm.Item label="快门 (exposure time)">
                <AntInput value={exif?.exposure_time || ''} onChange={(e)=>setExif({...exif, exposure_time: e.target.value})} />
              </AntForm.Item>
              <AntForm.Item label="ISO">
                <AntInput value={exif?.iso_speed_rating || ''} onChange={(e)=>setExif({...exif, iso_speed_rating: e.target.value})} />
              </AntForm.Item>
              <AntForm.Item label="焦距 (mm)">
                <AntInput value={exif?.focal_length || ''} onChange={(e)=>setExif({...exif, focal_length: e.target.value})} />
              </AntForm.Item>
              <AntForm.Item label="拍摄日期">
                <AntDatePicker
                  style={{ width: '100%' }}
                  locale={zhCN}
                  placeholder="选择拍摄日期"
                  value={exif?.data_time ? dayjs(exif.data_time) : undefined}
                  onChange={(date) => setExif({ ...(exif || {}), data_time: date ? date.format('YYYY-MM-DD') : '' })}
                  disabledDate={(current) => {
                    return current && (current < dayjs('2020-01-01') || current > dayjs().endOf('day'))
                  }}
                  allowClear
                />
              </AntForm.Item>
            </div>
          </AntForm>
        </div>
      )}

    </div>
  )
}
