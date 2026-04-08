 'use client'

import * as React from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { App as AntApp, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, message as AntMessage, Tag as AntTag, Card as AntCard, Progress as AntProgress, DatePicker as AntDatePicker } from 'antd'
import { Checkbox } from '~/components/ui/checkbox'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '~/components/ui/select'
import MultipleSelector, { Option as MSOption } from '~/components/ui/origin/multiselect'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
const { Dragger } = AntUpload
import { UploadIcon } from '~/components/icons/upload'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

interface TagNode {
  category: string
  id?: string
  name?: string
  children: { name: string }[]
}

interface AlistStorage {
  mount_path: string
}

interface UploadFile extends File {
  __key?: string
  id?: string
  labels?: string[]
  exif?: Record<string, unknown>
}

interface UploadMeta {
  url?: string
  clientImageId?: string
  fileName?: string
  exifObj?: Record<string, unknown>
  width?: number
  height?: number
  blurhash?: string
  previewUrl?: string
  file?: UploadFile
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

interface MultipleFileUploadProps {
  idPrefix?: string
}

export default function MultipleFileUpload({ idPrefix: propIdPrefix }: MultipleFileUploadProps) {
  dayjs.locale('zh-cn')
  const { modal } = AntApp.useApp()
  const [alistStorage, setAlistStorage] = React.useState<AlistStorage[]>([])
  const [storageSelect, setStorageSelect] = React.useState(false)
  const [storage, setStorage] = React.useState('s3')
  const [album, setAlbum] = React.useState('')
  const [alistMountPath, setAlistMountPath] = React.useState('')
  // 改为 UploadFile[]，因为后面会扩展文件项的元数据（labels/exif 等）
  const [files, setFiles] = React.useState<UploadFile[]>([])
  const [fileKeyMap, setFileKeyMap] = React.useState<Record<string, string>>({})
  const [primarySelect, setPrimarySelect] = React.useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = React.useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [uploadingKeys, setUploadingKeys] = React.useState<Set<string>>(new Set())
  const t = useTranslations()
  const generatedIdPrefix = React.useId()
  const idPrefix = propIdPrefix ?? generatedIdPrefix

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '5')
  const [presetTags, setPresetTags] = React.useState<string[]>([])
  const [tagTree, setTagTree] = React.useState<TagNode[]>([])
  // EXIF presets (editable via modal persisted in localStorage)
  const presetsStorageKey = 'picimpact_exif_presets'
  const defaultPresets = {
    cameraModels: ['Canon EOS R5','Sony A7 III','Nikon Z7 II','Fujifilm X-T4','iPhone 13 Pro'],
    shutterSpeeds: ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1'],
    isos: ['50','100','200','400','800','1600','3200','6400'],
    apertures: ['1.4','1.8','2.0','2.8','3.5','4.0','5.6','8.0','11','16'],
  }
  const [exifPresets, setExifPresets] = React.useState(() => {
    try { const raw = localStorage.getItem(presetsStorageKey); if (raw) return JSON.parse(raw) } catch {}
    return defaultPresets
  })
  const [isPresetModalOpen, setIsPresetModalOpen] = React.useState(false)
  const [editingPresetsText, setEditingPresetsText] = React.useState({ cameraModels: '', shutterSpeeds: '', isos: '', apertures: '' })
  const [uploadProgressMap, setUploadProgressMap] = React.useState<Record<string, number>>({})
  const [uploadedMeta, setUploadedMeta] = React.useState<Record<string, UploadMeta>>({})
  // Modal state for missing (not-yet-uploaded) files before submit
  const [showMissingModal, setShowMissingModal] = React.useState(false)
  const [missingFiles, setMissingFiles] = React.useState<UploadFile[]>([])
  const [missingSelection, setMissingSelection] = React.useState<Record<string, boolean>>({})
  React.useEffect(() => {
    fetcher('/api/v1/settings/tags/get').then((res: { data: { name: string }[] })=>{ if (res?.data) setPresetTags(res.data.map((t)=>t.name)) }).catch(()=>{})
    // 拉取树形标签（category -> children）用于一级/二级联动
    fetcher('/api/v1/settings/tags/get?tree=true').then((res: { data: TagNode[] }) => { if (res?.data) setTagTree(res.data) }).catch(()=>{})
  }, [])

  // When primary/secondary selection changes, merge them into each file's labels if not present
  React.useEffect(() => {
    if (!primarySelect && (!secondarySelect || secondarySelect.length === 0)) return
    setFiles(prev => prev.map(item => {
      const labels = Array.isArray(item.labels) ? [...item.labels] : []
      if (primarySelect && !labels.includes(primarySelect)) labels.push(primarySelect)
      secondarySelect?.forEach(s => { if (!labels.includes(s)) labels.push(s) })
      return { ...item, labels }
    }))
  }, [primarySelect, secondarySelect])

  function togglePresetTagForItem(tag: string, itemIndex: number) {
    const items = [...files] // 假设 files 是文件项数组并包含 labels 字段
    const labels = items[itemIndex].labels || []
    if (labels.includes(tag)) {
      items[itemIndex].labels = labels.filter((t:string)=>t!==tag)
    } else {
      items[itemIndex].labels = [...labels, tag]
    }
    setFiles(items)
  }

  async function getAlistStorage() {
    if (alistStorage.length > 0) {
      setStorageSelect(true)
      return
    }
    try {
      toast.info(t('Tips.gettingAlistDirs'))
      const res = await fetch('/api/v1/storage/alist/storages', {
        method: 'GET',
      }).then(res => res.json())
      if (res?.code === 200) {
        setAlistStorage(res.data?.content)
        setStorageSelect(true)
      } else {
        toast.error(t('Tips.getFailed'))
      }
    } catch {
      toast.error(t('Tips.getFailed'))
    }
  }

  const storages = [
    {
      label: 'Cloudflare R2',
      value: 'r2',
    },
    {
      label: 'Amazon S3',
      value: 's3',
    },
    {
      label: 'AList API',
      value: 'alist',
    }
  ]

  // 现在 autoSubmit 接受已经准备好的元数据对象并提交到后端（仅保存元数据，不再做文件上传）
  async function autoSubmit(meta: { file: UploadFile, url: string, previewUrl?: string, clientImageId?: string, exifObj?: Record<string, unknown>, width?: number, height?: number, blurhash?: string, labels?: string[] }) {
    try {
      if (album === '') {
        toast.warning(t('Tips.selectAlbumFirst'))
        return
      }

      // Ensure width/height are present. If missing, try to read from the file.
      // This avoids server-side validation errors like "Image height cannot be empty..."
      const key = meta.file?.__key
      if ((!meta.width || !meta.height || meta.width <= 0 || meta.height <= 0) && meta.file) {
        try {
          const dims: { width: number, height: number } = await new Promise((resolve, reject) => {
            try {
              const reader = new FileReader()
              reader.onload = () => {
                try {
                  const img = new Image()
                  img.onload = () => resolve({ width: img.width, height: img.height })
                  img.onerror = (err) => reject(err)
                  if (typeof reader.result === 'string') {
                    img.src = reader.result
                  }
                } catch (err) {
                  reject(err)
                }
              }
              reader.onerror = (err) => reject(err)
              reader.readAsDataURL(meta.file)
            } catch (err) {
              reject(err)
            }
          })
          meta.width = dims.width
          meta.height = dims.height
          if (key) setUploadedMeta(prev => ({ ...prev, [key]: { ...(prev[key] || {}), width: dims.width, height: dims.height } }))
        } catch (e) {
          console.warn('Failed to compute image dimensions for submission', e)
        }
      }

      // final validation for width/height
      if (!meta.width || !meta.height || meta.width <= 0 || meta.height <= 0) {
        console.error('Missing image dimensions, aborting submit for file', meta.file?.name)
        toast.error(t('Tips.imageSizeMissing'))
        return
      }

      // 提交前对原图 / 预览图 URL 做一次远端可访问性校验；若失败且仍有本地文件，则尝试自动重传
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

      if (meta.url) {
        const originOk = await verifyUrlAccessible(meta.url)
        let previewOk = true
        if (meta.previewUrl) {
          previewOk = await verifyUrlAccessible(meta.previewUrl)
        }

        if (!originOk || !previewOk) {
          const file = meta.file
          if (file) {
            try {
              await onRequestUpload(file)
              // 若重传后生成了新的 URL/预览 URL，优先使用最新的 uploadedMeta 中数据
              const latestKey = file.__key
              if (latestKey) {
                const latestMeta = uploadedMeta[latestKey]
                if (latestMeta?.url) meta.url = latestMeta.url
                if (latestMeta?.previewUrl) meta.previewUrl = latestMeta.previewUrl
              }
            } catch (e) {
              console.error('Re-upload after failed remote verification error (multi)', e)
              toast.error(t('Tips.cloudRemoteFileAnomalyRetryFailed'))
              return
            }
          } else {
            toast.error(t('Tips.remoteOriginOrPreviewMissing'))
            return
          }
        }
      }

      const labels = Array.isArray(meta.labels) ? meta.labels : (Array.isArray(meta.file.labels) ? meta.file.labels : [])
      const tagCategoryMap: Record<string, string> = {}
      if (primarySelect && secondarySelect && secondarySelect.length > 0) {
        secondarySelect.forEach(s => { if (primarySelect) tagCategoryMap[s] = primarySelect })
      }

      const data = {
        album: album,
        url: meta.url,
        client_image_id: meta.clientImageId,
        title: '',
        preview_url: meta.previewUrl,
        blurhash: meta.blurhash,
        exif: meta.exifObj,
        labels: labels,
        detail: '',
        width: meta.width,
        height: meta.height,
        lat: '',
        lon: '',
        tagCategoryMap: Object.keys(tagCategoryMap).length ? tagCategoryMap : undefined,
      } as ImageType & { tagCategoryMap?: Record<string,string> }

      // 提交前进行重复检测（优先 blurhash，其次 url），若重复则弹窗确认
      const dupRes = await fetch('/api/v1/images/check-duplicate', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify({ blurhash: meta.blurhash || undefined, url: meta.url || undefined }),
      }).then(r => r.json()).catch(() => ({ code: 200, data: { duplicate: false } }))

      if (dupRes?.code === 200 && dupRes?.data?.duplicate) {
        const ok = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: t('Upload.duplicateImageTitle'),
            content: t('Upload.duplicateImageContent'),
            okText: t('Upload.duplicateImageContinue'),
            cancelText: t('Button.canal'),
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          })
        })
        if (!ok) {
          return { code: 499 }
        }
      }

      const resp = await fetch('/api/v1/images/add', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify(data),
      })

      const contentType = resp.headers.get('content-type') || ''
      let json: UploadResponse | null = null
      if (contentType.includes('application/json')) {
        try {
          json = await resp.json()
        } catch (e) {
          const text = await resp.text().catch(() => '')
          console.error('Failed to parse JSON response for /api/v1/images/add:', e, text)
          toast.error(text || t('Tips.saveFailed'))
          return
        }
      } else {
        // 非 JSON 响应，读取文本并显示，以便更好地排查服务器端错误信息
        const text = await resp.text().catch(() => '')
        console.error('Non-JSON response from /api/v1/images/add:', text)
        toast.error(text || t('Tips.saveFailed'))
        return
      }

      if (json?.code === 200) {
        toast.success(t('Tips.saveSuccess'))
      } else {
        const msg = json?.message || t('Tips.saveFailed')
        toast.error(msg)
      }
    } catch (e) {
      console.error(e)
      throw new Error('Upload failed')
    }
  }

  function uploadPreviewImage(file: File, type: string) {
    return new Promise<void>((resolve, reject) => {
      new Compressor(file, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/webp',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          try {
            // @ts-expect-error - dynamic third-party typing
            const key = file.__key
            const res = await uploadFile(compressedFile as File, type, storage, alistMountPath, { onProgress: (p: number) => setUploadProgressMap(prev => ({ ...prev, [key]: p })) })
            if (res?.code === 200) {
              setUploadedMeta(prev => ({ ...prev, [key]: { ...(prev[key] || {}), previewUrl: res.data?.url } }))
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
        },
      })
    })
  }

  async function resHandle(res: UploadResponse, file: UploadFile) {
    try {
      const { exifObj } = await exifReader(file)
      const key = file.__key
      if (key) setUploadedMeta(prev => ({ ...prev, [key]: { ...(prev[key] || {}), url: res?.data?.url, clientImageId: res?.data?.imageId, fileName: res?.data?.fileName, exifObj } }))
      // 上传预览图并保存 previewUrl
      if (album === '/') {
        await uploadPreviewImage(file, '/preview')
      } else {
        await uploadPreviewImage(file, album + '/preview')
      }
      // 解析 EXIF/尺寸并保存
      try {
        const { exifObj } = await exifReader(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          const img = new Image()
          img.onload = async () => {
            const hash = await encodeBrowserThumbHash(file)
            if (key) setUploadedMeta(prev => ({ ...prev, [key]: { ...(prev[key] || {}), exifObj, width: img.width, height: img.height, blurhash: hash } }))
          }
          if (typeof e.target?.result === 'string') {
            img.src = e.target.result
          }
        }
        reader.readAsDataURL(file)
      } catch (e) {
        console.error('EXIF read failed', e)
      }
    } catch {
      throw new Error('Upload failed')
    }
  }

  const applyReferenceExifToItem = React.useCallback(
    async (file: File, idx: number) => {
      try {
        const { tags, exifObj } = await exifReader(file)
        const items = [...files]
        if (!items[idx]) return
        items[idx].exif = { ...(items[idx].exif || {}), ...exifObj }
        // 附带写入经纬度（如果有），便于后续提交
        // @ts-expect-error dynamic attach
        items[idx].lat = tags?.GPSLatitude?.description || items[idx].lat
        // @ts-expect-error dynamic attach
        items[idx].lon = tags?.GPSLongitude?.description || items[idx].lon
        setFiles(items)
        toast.success(t('Upload.referenceExifToastSuccess'))
      } catch (err) {
        console.error('Reference EXIF parse failed', err)
        toast.error(t('Upload.referenceExifToastError'))
      }
    },
    [files, t]
  )

  async function onRequestUpload(file: UploadFile, existingImageId?: string) {
    const fileKey = file.__key
    if (fileKey && uploadingKeys.has(fileKey)) {
      return
    }
    if (fileKey) {
      setUploadingKeys(prev => new Set(prev).add(fileKey))
    }
    
    try {
      const fileName = file.name.split('.').slice(0, -1).join('.')
      if (await isHeic(file)) {
        const outputBuffer: Blob | Blob[] = await heicTo({
          blob: file,
          type: 'image/jpeg',
        })
        const outputFile = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' }) as UploadFile
        if (!outputFile.__key) outputFile.__key = fileKey || (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
        new Compressor(outputFile, {
          quality: previewCompressQuality,
          checkOrientation: false,
          mimeType: 'image/jpeg',
          maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
          async success(compressedFile) {
            await uploadFile(compressedFile as File, album, storage, alistMountPath, {
              existingImageId,
              onProgress: (p:number) => { if (outputFile.__key) setUploadProgressMap(prev => ({ ...prev, [outputFile.__key!]: p })) }
            }).then(async (res) => {
              if (res.code === 200) {
                await resHandle(res, outputFile)
                if (res?.data?.key && outputFile?.__key) setFileKeyMap(prev => ({ ...prev, [outputFile.__key!]: res.data!.key! }))
              } else {
                throw new Error('Upload failed')
              }
            })
          }
        })
      } else {
        if (!file.__key) file.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
        await uploadFile(file, album, storage, alistMountPath, { 
          existingImageId,
          onProgress: (p:number) => { if (file.__key) setUploadProgressMap(prev => ({ ...prev, [file.__key]: p })) } 
        }).then(async (res) => {
          if (res.code === 200) {
            await resHandle(res, file)
            if (res?.data?.key && file?.__key) setFileKeyMap(prev => ({ ...prev, [file.__key]: res.data!.key! }))
          } else {
            throw new Error('Upload failed')
          }
        })
      }
    } finally {
      if (fileKey) {
        setUploadingKeys(prev => {
          const next = new Set(prev)
          next.delete(fileKey)
          return next
        })
      }
    }
  }

  function removeFileByKey(key: string) {
    try {
      // 删除对应存储对象
      (async () => { try { const k = fileKeyMap[key]; if (k && storage) { await fetch('/api/v1/file/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ storage, key: k }) }) } setFileKeyMap(prev => { const next = { ...prev }; delete next[key]; return next }) } catch {} })()
      setFiles(prev => prev.filter(f => ((f && (f.__key || f.id || f.name)) !== key)))
      setUploadedMeta(prev => {
        const nxt = { ...prev }
        delete nxt[key]
        return nxt
      })
      setUploadProgressMap(prev => {
        const nxt = { ...prev }
        delete nxt[key]
        return nxt
      })
      setMissingSelection(prev => {
        const nxt = { ...prev }
        delete nxt[key]
        return nxt
      })
      setMissingFiles(prev => (prev || []).filter(f => ((f && (f.__key || f.name)) !== key)))
    } catch (e) {
      console.error('removeFileByKey error', e)
    }
  }

  // Handlers for the missing-files modal
  async function handleUploadSelectedAndSubmit() {
    setShowMissingModal(false)
    setIsSubmitting(true)
    try {
      const toUpload = missingFiles.filter(f => {
        return !!(f.__key && missingSelection[f.__key])
      })
      for (const f of toUpload) {
        const key = f.__key
        const existingImageId = key ? uploadedMeta[key]?.clientImageId : undefined
        await onRequestUpload(f, existingImageId)
      }
      // Submit all files that now have urls
      for (const file of files) {
        const key = file.__key
        if (!key) continue
        const meta = uploadedMeta[key]
        if (!meta || !meta.url) continue
        const finalMeta = { ...(uploadedMeta[key] || {}), file }
        await autoSubmit(finalMeta)
      }
    } catch (e) {
      console.error(e)
        toast.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleSkipAndSubmit() {
    setShowMissingModal(false)
    setIsSubmitting(true)
    try {
      // Only submit files that already have uploaded urls
      for (const file of files) {
        const key = file.__key
        if (!key) continue
        const meta = uploadedMeta[key]
        if (!meta || !meta.url) continue
        const finalMeta = { ...(uploadedMeta[key] || {}), file }
        await autoSubmit(finalMeta)
      }
    } catch (e) {
      console.error(e)
      toast.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
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
                {storages?.map((s: { label: string, value: string }) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex-1 flex flex-col min-w-0">
            <div className="text-xs text-gray-600 mb-1">{t('Upload.selectAlbum')}</div>
            <Select value={album ?? undefined} onValueChange={(value: string) => setAlbum(value)}>
              <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectAlbum')} /></SelectTrigger>
              <SelectContent>
                {data?.map((a: AlbumType) => (
                  <SelectItem key={a.album_value} value={a.album_value}>{a.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

            <div className="flex flex-col" style={{ minWidth: 240 }}>
                <div className="text-xs text-gray-600 mb-1">{t('Upload.primaryTagLabel')}</div>
                <Select value={primarySelect ?? undefined} onValueChange={(value: string) => { setPrimarySelect(value); setSecondarySelect([]) }}>
                  <SelectTrigger className="w-full md:w-[240px] h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.primaryTagPlaceholderOptional')} /></SelectTrigger>
                  <SelectContent>
                    {tagTree.filter((n: TagNode) => n && (n.category || n.id || n.name)).map((n: TagNode, i: number) => (
                      <SelectItem key={`${(n.category ?? n.id ?? n.name)}-${i}`} value={n.category}>{n.category ?? t('Upload.tagUncategorized')}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col" style={{ minWidth: 240 }}>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.secondaryTagLabel')}</div>
                <div>
                  <MultipleSelector
                    value={(secondarySelect || []).map(s => ({ value: s, label: s }))}
                    options={(tagTree.find((n: TagNode) => n.category === primarySelect)?.children || []).filter((c: { name: string }) => c && c.name).map((c: { name: string }) => ({ value: c.name, label: c.name }))}
                    placeholder={primarySelect ? t('Upload.secondaryTagPlaceholderMultiple') : t('Upload.secondaryTagPlaceholderSelectPrimary')}
                    onChange={(opts?: MSOption[]) => setSecondarySelect((opts || []).map(o => o.value))}
                  />
                </div>
            </div>

          {storage === 'alist' && storageSelect && alistStorage?.length > 0 && (
            <div className="flex flex-col" style={{ minWidth: 240 }}>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.selectAlistDirectory')}</div>
              <Select value={alistMountPath ?? undefined} onValueChange={(value: string) => setAlistMountPath(value)}>
                <SelectTrigger className="w-full h-9 bg-white text-gray-900 border-gray-200"><SelectValue placeholder={t('Upload.selectAlistDirectory')} /></SelectTrigger>
                <SelectContent>
                  {alistStorage?.map((s: AlistStorage) => (
                    <SelectItem key={s?.mount_path} value={s?.mount_path}>{s?.mount_path}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        <div>
          <AntButton
            className="h-9 flex items-center justify-center"
            size="middle"
            type="primary"
            loading={isSubmitting}
            title={files.length === 0 ? '' : t('Upload.submitButtonHint')}
            onClick={async () => {
              setIsSubmitting(true)
              try {
                const missing = files.filter(f => {
                  const key = f.__key
                  if (!key) return true
                  const m = uploadedMeta[key]
                  return !(m && m.url)
                })
                if (missing.length > 0) {
                  const sel: Record<string, boolean> = {}
                  missing.forEach(f => { if (f.__key) sel[f.__key] = true })
                  setMissingSelection(sel)
                  setMissingFiles(missing)
                  setIsSubmitting(false)
                  setShowMissingModal(true)
                  return
                }

                for (const file of files) {
                  const key = file.__key
                  if (!key) continue
                  const meta = uploadedMeta[key]
                  if (!meta || !meta.url) {
                    const existingImageId = meta?.clientImageId
                    await onRequestUpload(file, existingImageId)
                  }
                  const finalMeta = { ...(uploadedMeta[key] || {}), file }
                  await autoSubmit(finalMeta)
                }
              } catch (e) {
                console.error(e)
                toast.error(t('Tips.saveFailed'))
              } finally {
                setIsSubmitting(false)
              }
            }}
            disabled={files.length === 0 || storage === '' || (storage === 'alist' && alistMountPath === '')}
          >
            {isSubmitting ? t('Upload.submitInProgress') : t('Upload.submitWithAutoUpload')}
          </AntButton>
        </div>
      </div>
      <AntModal
        title={t('Upload.missingFilesTitle', { count: missingFiles.length })}
        open={showMissingModal}
        onCancel={() => { setShowMissingModal(false) }}
        footer={[
          <AntButton key="cancel" onClick={() => { setShowMissingModal(false) }}>{t('Button.canal')}</AntButton>,
          <AntButton key="skip" onClick={async () => { await handleSkipAndSubmit() }}>{t('Upload.skipMissingAndSubmit')}</AntButton>,
          <AntButton key="upload" type="primary" onClick={async () => { await handleUploadSelectedAndSubmit() }}>{t('Upload.uploadSelectedAndSubmit')}</AntButton>
        ]}
      >
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {missingFiles.length === 0 ? (
            <div className="text-sm text-gray-500">{t('Upload.noMissingFiles')}</div>
          ) : (
            missingFiles.map((f: UploadFile) => (
              // use __key as stable identifier for selection
              <div key={f.__key || f.name} style={{ display: 'flex', alignItems: 'center', padding: 8, borderBottom: '1px solid var(--border)' }}>
                <Checkbox checked={!!missingSelection[f.__key || f.name]} onCheckedChange={(v) => setMissingSelection(prev => ({ ...prev, [f.__key || f.name]: !!v }))} />
                <div style={{ marginLeft: 8 }}>{f.name}</div>
              </div>
            ))
          )}
        </div>
      </AntModal>

      {/* 上传总进度（如果有文件在上传） */}
      {Object.keys(uploadProgressMap).length > 0 && (
        (() => {
          const vals = Object.values(uploadProgressMap)
          const avg = Math.round(vals.reduce((a,b)=>a+b,0)/vals.length)
          return (
            <div className="mb-2">
              <AntProgress percent={avg} status="active" />
              <div className="text-xs text-gray-500 mt-1">{t('Upload.totalUploadProgress', { percent: avg, count: vals.length })}</div>
            </div>
          )
        })()
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="h-full">
          <AntCard className="h-full">
            <Dragger
              multiple={true}
              disabled={storage === '' || (storage === 'alist' && alistMountPath === '')}
              beforeUpload={() => false}
              showUploadList={false}
              style={{ 
                padding: 24, 
                minHeight: 200, 
                height: '100%',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                backgroundColor: 'var(--background)',
                transition: 'all 0.2s ease-in-out'
              }}
              onChange={(info) => {
                const fileList = info.fileList || []
                const selected = fileList.map(f => f.originFileObj).filter(Boolean).map((orig: UploadFile) => {
                  // ensure a stable temporary key per file to avoid name collisions
                  if (!orig.__key) orig.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
                  return orig
                })
                setFiles(selected)
                // 自动在选中时上传原图与预览（要求已选择 album）
                if (!album) {
                  toast.warning(t('Tips.selectAlbumFirst'))
                  return
                }
                selected.forEach((file: UploadFile) => {
                  // 避免重复上传（通过 __key 判断）
                  const key = file.__key
                  if (!key) return
                  const meta = uploadedMeta[key]
                  if (!meta || !meta.url) {
                    // fire-and-forget; onRequestUpload 会填充 uploadedMeta
                    onRequestUpload(file).catch(e => console.error('Auto upload failed', e))
                  }
                })
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-text-primary">{t('Upload.uploadTips1')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTips2')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTips4', { count: maxUploadFiles })}</p>
              </div>
            </Dragger>
          </AntCard>
        </div>

        <div className="h-full">
          <AntCard className="h-full">
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm">{t('Upload.noFiles')}</p>
              </div>
            ) : (
                files.map((f: UploadFile, idx: number) => (
                  <div key={f.__key || f.id || idx} className="p-4 border border-border rounded-lg mb-3 bg-background">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-text-primary">{f.name}</div>
                        {/* per-file upload status */}
                        <div className="text-sm text-text-secondary mt-1">
                          {(() => {
                            const key = f.__key
                            if (!key) return t('Upload.statusNotUploaded')
                            const meta = uploadedMeta[key]
                            const p = uploadProgressMap[key]
                            if (meta?.url) return t('Upload.statusUploaded')
                            if (typeof p === 'number') return t('Upload.statusUploading', { progress: p })
                            return t('Upload.statusNotUploaded')
                          })()}
                        </div>
                        {/* per-file small progress bar */}
                        {f.__key && typeof uploadProgressMap[f.__key] === 'number' && (
                          <div className="w-full mt-2">
                            <AntProgress 
                              percent={uploadProgressMap[f.__key]} 
                              size="small"
                              strokeColor="var(--primary)"
                              strokeWidth={6}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <AntButton
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          onClick={() => {
                            // remove file from list
                            const k = f.__key || f.id || f.name
                            if (k) removeFileByKey(k)
                          }}
                          className="hover:bg-error/10 rounded-full p-2"
                        />
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="text-sm text-text-secondary mb-2">{t('Upload.presetTagsLabel')}</div>
                      <div className="flex flex-wrap gap-2">
                        {presetTags.map((tag, i) => (
                          <AntTag
                            key={`${tag}-${i}`}
                            color={f.labels?.includes(tag) ? 'var(--primary)' : 'default'}
                            style={{ 
                              cursor: 'pointer',
                              borderRadius: '16px',
                              padding: '4px 12px',
                              fontSize: '12px'
                            }}
                            onClick={() => togglePresetTagForItem(tag, idx)}
                          >
                            {tag}
                          </AntTag>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 p-4 border border-border rounded-lg bg-background-alt">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <div className="text-sm text-text-secondary">{t('Upload.exifOptionalLabel')}</div>
                        <AntButton
                          size="small"
                          onClick={() => document.getElementById(`${idPrefix}-ref-${idx}`)?.click()}
                          style={{
                            borderRadius: '8px',
                            borderColor: 'var(--border)'
                          }}
                        >
                          {t('Upload.referenceExifExtractButton')}
                        </AntButton>
                        <input
                          id={`${idPrefix}-ref-${idx}`}
                          type="file"
                          className="hidden"
                          accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) applyReferenceExifToItem(file, idx)
                            e.target.value = ''
                          }}
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">{t('Upload.exifCameraModelLabel')}</label>
                          <Select value={f.exif?.model || undefined} onValueChange={(v)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), model: v}; setFiles(items) }}>
                            <SelectTrigger className="w-full"><SelectValue placeholder={t('Upload.exifCommonCameraModelsPlaceholder')} /></SelectTrigger>
                            <SelectContent>
                              {exifPresets.cameraModels.map((m: string)=>(<SelectItem key={m} value={m}>{m}</SelectItem>))}
                            </SelectContent>
                          </Select>
                          <p className="mt-1 text-xs text-text-muted">
                            <a
                              onClick={() => {
                                setEditingPresetsText({
                                  cameraModels: exifPresets.cameraModels.join(', '),
                                  shutterSpeeds: exifPresets.shutterSpeeds.join(', '),
                                  isos: exifPresets.isos.join(', '),
                                  apertures: exifPresets.apertures.join(', '),
                                })
                                setIsPresetModalOpen(true)
                              }}
                            >
                              {t('Upload.manageCommonExifOptionsLink')}
                            </a>
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">{t('Upload.exifShutterLabel')}</label>
                          <div className="flex gap-2">
                            <Select value={f.exif?.exposure_time || undefined} onValueChange={(v)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), exposure_time: v}; setFiles(items) }}>
                              <SelectTrigger className="flex-1"><SelectValue placeholder={t('Upload.exifCommonShutterPlaceholder')} /></SelectTrigger>
                              <SelectContent>
                                {exifPresets.shutterSpeeds.map((s: string)=>(<SelectItem key={s} value={s}>{s}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <AntInput 
                              value={f.exif?.exposure_time || ''} 
                              onChange={(e)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), exposure_time: e.target.value}; setFiles(items) }} 
                              placeholder={t('Upload.orManualInputPlaceholder')}
                              style={{
                                flex: 1,
                                borderRadius: '8px',
                                borderColor: 'var(--border)'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">ISO</label>
                          <div className="flex gap-2">
                            <Select value={f.exif?.iso_speed_rating || undefined} onValueChange={(v)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), iso_speed_rating: v}; setFiles(items) }}>
                              <SelectTrigger className="flex-1"><SelectValue placeholder={t('Upload.exifCommonIsoPlaceholder')} /></SelectTrigger>
                              <SelectContent>
                                {exifPresets.isos.map((i: string)=>(<SelectItem key={i} value={i}>{i}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <AntInput 
                              value={f.exif?.iso_speed_rating || ''} 
                              onChange={(e)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), iso_speed_rating: e.target.value}; setFiles(items) }} 
                              placeholder={t('Upload.orManualInputPlaceholder')}
                              style={{
                                flex: 1,
                                borderRadius: '8px',
                                borderColor: 'var(--border)'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">{t('Upload.exifApertureLabel')}</label>
                          <div className="flex gap-2">
                            <Select value={f.exif?.f_number || undefined} onValueChange={(v)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), f_number: v}; setFiles(items) }}>
                              <SelectTrigger className="flex-1"><SelectValue placeholder={t('Upload.exifCommonAperturePlaceholder')} /></SelectTrigger>
                              <SelectContent>
                                {exifPresets.apertures.map((a: string)=>(<SelectItem key={a} value={a}>{a}</SelectItem>))}
                              </SelectContent>
                            </Select>
                            <AntInput 
                              value={f.exif?.f_number || ''} 
                              onChange={(e)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), f_number: e.target.value}; setFiles(items) }} 
                              placeholder={t('Upload.orManualInputPlaceholder')}
                              style={{
                                flex: 1,
                                borderRadius: '8px',
                                borderColor: 'var(--border)'
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">{t('Upload.exifFocalLengthLabel')}</label>
                          <AntInput 
                            value={f.exif?.focal_length || ''} 
                            onChange={(e)=>{ const items=[...files]; items[idx].exif={...(items[idx].exif||{}), focal_length: e.target.value}; setFiles(items) }} 
                            style={{
                              borderRadius: '8px',
                              borderColor: 'var(--border)'
                            }}
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-text-secondary mb-2">{t('Upload.exifShootDateLabel')}</label>
                          <AntDatePicker
                            style={{ 
                              width: '100%',
                              borderRadius: '8px',
                              borderColor: 'var(--border)'
                            }}
                            locale={zhCN}
                            placeholder={t('Upload.exifShootDatePlaceholder')}
                            value={f.exif?.data_time ? dayjs(f.exif.data_time) : undefined}
                            onChange={(date) => {
                              const items = [...files]
                              items[idx].exif = { ...(items[idx].exif || {}), data_time: date ? date.format('YYYY-MM-DD') : '' }
                              setFiles(items)
                            }}
                            disabledDate={(current) => {
                              return current && (current < dayjs('2020-01-01') || current > dayjs().endOf('day'))
                            }}
                            allowClear
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))
            )}
          </AntCard>
        </div>
      </div>
      <AntModal
        title={t('Upload.exifPresetManagerTitle')}
        open={isPresetModalOpen}
        onCancel={() => setIsPresetModalOpen(false)}
        onOk={() => {
          try {
            const newPresets = {
              cameraModels: editingPresetsText.cameraModels.split(',').map(s=>s.trim()).filter(Boolean),
              shutterSpeeds: editingPresetsText.shutterSpeeds.split(',').map(s=>s.trim()).filter(Boolean),
              isos: editingPresetsText.isos.split(',').map(s=>s.trim()).filter(Boolean),
              apertures: editingPresetsText.apertures.split(',').map(s=>s.trim()).filter(Boolean),
            }
            setExifPresets(newPresets)
            try { localStorage.setItem(presetsStorageKey, JSON.stringify(newPresets)) } catch {}
            AntMessage.success(t('Tips.saveSuccess'))
            setIsPresetModalOpen(false)
          } catch {
            AntMessage.error(t('Tips.saveFailed'))
          }
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div>
            <div className="text-xs text-gray-600">{t('Upload.exifCameraModelsCommaSeparatedLabel')}</div>
            <AntInput.TextArea rows={2} value={editingPresetsText.cameraModels} onChange={(e)=>setEditingPresetsText(prev=>({...prev, cameraModels: e.target.value}))} />
          </div>
          <div>
            <div className="text-xs text-gray-600">{t('Upload.exifShutterSpeedsCommaSeparatedLabel')}</div>
            <AntInput.TextArea rows={2} value={editingPresetsText.shutterSpeeds} onChange={(e)=>setEditingPresetsText(prev=>({...prev, shutterSpeeds: e.target.value}))} />
          </div>
          <div>
            <div className="text-xs text-gray-600">{t('Upload.exifIsosCommaSeparatedLabel')}</div>
            <AntInput.TextArea rows={2} value={editingPresetsText.isos} onChange={(e)=>setEditingPresetsText(prev=>({...prev, isos: e.target.value}))} />
          </div>
          <div>
            <div className="text-xs text-gray-600">{t('Upload.exifAperturesCommaSeparatedLabel')}</div>
            <AntInput.TextArea rows={2} value={editingPresetsText.apertures} onChange={(e)=>setEditingPresetsText(prev=>({...prev, apertures: e.target.value}))} />
          </div>
        </div>
      </AntModal>
    </div>
  )
}
// ...existing code...
