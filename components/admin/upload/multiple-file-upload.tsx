'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { App as AntApp, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, message as AntMessage, Tag as AntTag, Card as AntCard, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, Select, Checkbox, Collapse } from 'antd'
import MultipleSelector from '~/components/ui/origin/multiselect'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
import { UploadIcon } from '~/components/icons/upload'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

const { Dragger } = AntUpload
const { Panel } = Collapse

interface UploadResponse {
  code: number
  data?: {
    url: string
    imageId: string
    fileName: string
    key?: string
  }
}

interface TagNode {
  category: string
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
  width?: number
  height?: number
  lat?: string
  lon?: string
  blurhash?: string
  url?: string
  previewUrl?: string
  imageId?: string
  originalKey?: string
  previewKey?: string
  uploadProgress?: number
  uploadStage?: string
  isUploading?: boolean
  isUploaded?: boolean
}

export default function MultipleFileUpload() {
  dayjs.locale('zh-cn')
  const { modal } = AntApp.useApp()
  const [alistStorage, setAlistStorage] = useState<AlistStorage[]>([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('s3')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isGlobalUploading, setIsGlobalUploading] = useState(false)
  const [totalProgress, setTotalProgress] = useState(0)
  const [globalUploadStage, setGlobalUploadStage] = useState('')
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [missingFiles, setMissingFiles] = useState<UploadFile[]>([])
  const [missingSelection, setMissingSelection] = useState<Record<string, boolean>>({})
  const [expandedFileKeys, setExpandedFileKeys] = useState<Set<string>>(new Set())
  const [batchExif, setBatchExif] = useState<Partial<ExifType>>({})
  const [batchLabels, setBatchLabels] = useState<string[]>([])
  const [showBatchEdit, setShowBatchEdit] = useState(false)

  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const defaultStorage = configs?.find(config => config.config_key === 'default_storage')?.config_value || 's3'
  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '20')
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [primarySelect, setPrimarySelect] = useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = useState<string[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])

  useEffect(() => {
    if (defaultStorage) {
      setStorage(defaultStorage)
    }
  }, [defaultStorage])

  // EXIF presets (editable via modal; persisted in localStorage)
  const presetsStorageKey = 'picimpact_exif_presets'
  const defaultPresets = {
    cameraModels: ['Canon EOS R5','Sony A7 III','Nikon Z7 II','Fujifilm X-T4','iPhone 13 Pro'],
    shutterSpeeds: ['1/8000','1/4000','1/2000','1/1000','1/500','1/250','1/125','1/60','1/30','1/15','1/8','1/4','1/2','1'],
    isos: ['50','100','200','400','800','1600','3200','6400'],
    apertures: ['1.4','1.8','2.0','2.8','3.5','4.0','5.6','8.0','11','16'],
  }
  const [exifPresets, setExifPresets] = useState(() => {
    try {
      const raw = localStorage.getItem(presetsStorageKey)
      if (raw) return JSON.parse(raw)
    } catch {}
    return defaultPresets
  })
  const [isPresetModalOpen, setIsPresetModalOpen] = useState(false)
  const [editingPresetsText, setEditingPresetsText] = useState({ cameraModels: '', shutterSpeeds: '', isos: '', apertures: '' })

  // 拉取后端预设标签 + 树形结构
  useEffect(() => {
    fetcher('/api/v1/settings/tags/get')
      .then((res: { data: { name: string }[] }) => {
        if (res?.data) setPresetTags(res.data.map((t) => t.name))
      })
      .catch(() => {})

    fetcher('/api/v1/settings/tags/get?tree=true')
      .then((res: { data: TagNode[] }) => {
        if (res?.data) setTagTree(res.data)
      })
      .catch(() => {})
  }, [])

  // 当选择级联标签时，自动将所选标签加入到批量标签中
  useEffect(() => {
    if (!cascaderValue || cascaderValue.length === 0) {
      return
    }
    const [p, ...children] = cascaderValue
    const toAdd: string[] = [p, ...children].filter((v) => v && typeof v === 'string' && v.trim() !== '')
    if (toAdd.length === 0) return
    setPrimarySelect(p || null)
    setSecondarySelect(children.filter((v) => v && typeof v === 'string'))
    setBatchLabels((prev) => {
      const base = Array.isArray(prev) ? [...prev] : []
      const set = new Set(base.map(v => v.trim()))
      toAdd.forEach(v => {
        if (v && v.trim() !== '') {
          set.add(v.trim())
        }
      })
      return Array.from(set).filter(Boolean)
    })
  }, [cascaderValue])

  function togglePresetTag(tag: string, fileKey?: string) {
    if (!tag || typeof tag !== 'string' || tag.trim() === '') return
    const trimmedTag = tag.trim()

    if (fileKey) {
      // Toggle tag for specific file
      setFiles(prev => prev.map(f => {
        if (f.__key === fileKey) {
          const labels = Array.isArray(f.labels) ? [...f.labels] : []
          const existingIndex = labels.findIndex(t => t.trim().toLowerCase() === trimmedTag.toLowerCase())
          if (existingIndex >= 0) {
            return { ...f, labels: labels.filter((_, i) => i !== existingIndex) }
          } else {
            return { ...f, labels: [...labels, trimmedTag] }
          }
        }
        return f
      }))
    } else {
      // Toggle tag for batch
      const existingIndex = batchLabels.findIndex(t => t.trim().toLowerCase() === trimmedTag.toLowerCase())
      if (existingIndex >= 0) {
        setBatchLabels(batchLabels.filter((_, i) => i !== existingIndex))
      } else {
        setBatchLabels([...batchLabels, trimmedTag])
      }
    }
  }

  const handleBatchLabelsChange = (vals: string[]) => {
    const cleanedVals = Array.isArray(vals)
      ? vals.filter((v) => v && typeof v === 'string' && v.trim() !== '')
      : []
    const uniqueVals = Array.from(new Set(cleanedVals.map(v => v.trim()))).filter(Boolean)
    setBatchLabels(uniqueVals)
  }

  const loadExif = useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      let lat = ''
      let lon = ''
      if (tags?.GPSLatitude?.description) {
        lat = tags.GPSLatitude.description
      }
      if (tags?.GPSLongitude?.description) {
        lon = tags.GPSLongitude.description
      }
      return { exifObj, lat, lon }
    } catch (e) {
      console.error(e)
      return { exifObj: {} as ExifType, lat: '', lon: '' }
    }
  }, [])

  const getImageDimensions = useCallback((file: File): Promise<{ width: number; height: number }> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          resolve({ width: img.width, height: img.height })
        }
        img.onerror = () => resolve({ width: 0, height: 0 })
        if (typeof e.target?.result === 'string') {
          img.src = e.target.result
        } else {
          resolve({ width: 0, height: 0 })
        }
      }
      reader.onerror = () => resolve({ width: 0, height: 0 })
      reader.readAsDataURL(file)
    })
  }, [])

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (album === '') {
        toast.warning(t('Tips.selectAlbumFirst'))
        setIsSubmitting(false)
        return
      }

      if (files.length === 0) {
        toast.warning(t('Upload.noFilesSelected'))
        setIsSubmitting(false)
        return
      }

      // Check for files that haven't been uploaded
      const notUploaded = files.filter(f => !f.isUploaded)
      if (notUploaded.length > 0) {
        const sel: Record<string, boolean> = {}
        notUploaded.forEach(f => { if (f.__key) sel[f.__key] = true })
        setMissingSelection(sel)
        setMissingFiles(notUploaded)
        setIsSubmitting(false)
        setShowMissingModal(true)
        return
      }

      // Submit all files
      let successCount = 0
      let failCount = 0

      for (const file of files) {
        if (!file.isUploaded || !file.url) continue

        try {
          const result = await submitSingleFile(file)
          if (result) {
            successCount++
          } else {
            failCount++
          }
        } catch (e) {
          console.error('Submit file error:', e)
          failCount++
        }
      }

      if (successCount > 0) {
        toast.success(t('Upload.batchSubmitSuccess', { success: successCount, fail: failCount }))
        // Clear files after successful submission
        setFiles([])
        setBatchLabels([])
        setBatchExif({})
        setPrimarySelect(null)
        setSecondarySelect([])
        setCascaderValue([])
      } else {
        toast.error(t('Upload.batchSubmitFailed'))
      }
    } catch (e) {
      console.error(e)
      toast.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }

  async function submitSingleFile(file: UploadFile): Promise<boolean> {
    if (!file.width || !file.height || file.width <= 0 || file.height <= 0) {
      toast.error(t('Tips.imageSizeMissing', { name: file.name }))
      return false
    }

    // Verify URL accessibility
    const originOk = await verifyUrlAccessible(file.url)
    let previewOk = true
    if (file.previewUrl) {
      previewOk = await verifyUrlAccessible(file.previewUrl)
    }

    if (!originOk || !previewOk) {
      toast.error(t('Tips.remoteOriginOrPreviewMissing', { name: file.name }))
      return false
    }

    const labels = Array.isArray(file.labels) ? [...file.labels] : []
    // Add batch labels
    batchLabels.forEach(tag => {
      if (!labels.includes(tag)) labels.push(tag)
    })
    // Add cascader labels
    if (primarySelect && !labels.includes(primarySelect)) labels.push(primarySelect)
    secondarySelect?.forEach(s => {
      if (!labels.includes(s)) labels.push(s)
    })

    const tagCategoryMap: Record<string, string> = {}
    if (primarySelect && secondarySelect && secondarySelect.length > 0) {
      secondarySelect.forEach(s => { tagCategoryMap[s] = primarySelect })
    }

    const data = {
      album,
      url: file.url,
      client_image_id: file.imageId,
      image_name: file.name,
      title: '',
      preview_url: file.previewUrl,
      video_url: '',
      blurhash: file.blurhash,
      exif: { ...(file.exif || {}), ...batchExif },
      labels,
      detail: '',
      width: file.width,
      height: file.height,
      type: 1,
      lat: file.lat || '',
      lon: file.lon || '',
      tagCategoryMap: Object.keys(tagCategoryMap).length ? tagCategoryMap : undefined,
    } as ImageType & { tagCategoryMap?: Record<string, string> }

    // Check for duplicates
    const dupRes = await fetchWithTimeout('/api/v1/images/check-duplicate', {
      headers: { 'Content-Type': 'application/json' },
      method: 'post',
      body: JSON.stringify({ blurhash: file.blurhash || undefined, url: file.url || undefined }),
    }, 10000).then(r => r.json()).catch(() => ({ code: 200, data: { duplicate: false } }))

    if (dupRes?.code === 200 && dupRes?.data?.duplicate) {
      const ok = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: t('Upload.duplicateImageTitle'),
          content: t('Upload.duplicateImageContentWithName', { name: file.name }),
          okText: t('Upload.duplicateImageContinue'),
          cancelText: t('Button.canal'),
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      })
      if (!ok) return false
    }

    const res = await fetchWithTimeout('/api/v1/images/add', {
      headers: { 'Content-Type': 'application/json' },
      method: 'post',
      body: JSON.stringify(data),
    }, 15000).then(r => r.json())

    return res?.code === 200
  }

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

  function fetchWithTimeout(resource: RequestInfo, options: RequestInit = {}, timeout = 15000) {
    return new Promise<Response>((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('请求超时')), timeout)
      fetch(resource, options).then((res) => {
        clearTimeout(timer)
        resolve(res)
      }).catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
    })
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
    { label: 'Cloudflare R2', value: 'r2' },
    { label: 'Amazon S3', value: 's3' },
    { label: 'Tencent COS', value: 'cos' },
    { label: 'AList API', value: 'alist' },
  ]

  const uploadPreviewImage = useCallback((file: UploadFile, type: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      new Compressor(file, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/webp',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          try {
            updateFileProgress(file.__key!, 60, '压缩预览图中')
            const res = await uploadFile(compressedFile as File, type, storage, alistMountPath, {
              existingImageId: file.imageId,
              onProgress: (p: number) => {
                updateFileProgress(file.__key!, 60 + (p * 0.3), '上传预览图中')
              },
            })
            if (res?.code === 200) {
              updateFileField(file.__key!, 'previewUrl', res.data?.url)
              updateFileField(file.__key!, 'previewKey', res.data?.key)
              resolve()
            } else {
              reject(new Error('Preview upload failed'))
            }
          } catch (e) {
            reject(e instanceof Error ? e : new Error('Preview upload failed'))
          }
        },
        error(err) {
          reject(err instanceof Error ? err : new Error('Preview compression failed'))
        },
      })
    })
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, alistMountPath])

  const processFile = useCallback(async (file: UploadFile) => {
    if (!file.__key) return
    const key = file.__key

    try {
      updateFileField(key, 'isUploading', true)
      updateFileProgress(key, 5, '读取元数据中')

      // Get EXIF and dimensions
      const [{ exifObj, lat, lon }, { width, height }] = await Promise.all([
        loadExif(file),
        getImageDimensions(file),
      ])

      updateFileField(key, 'exif', exifObj)
      updateFileField(key, 'lat', lat)
      updateFileField(key, 'lon', lon)
      updateFileField(key, 'width', width)
      updateFileField(key, 'height', height)
      updateFileProgress(key, 10, '生成模糊哈希')

      // Generate blurhash
      const hash = await encodeBrowserThumbHash(file)
      updateFileField(key, 'blurhash', hash)
      updateFileProgress(key, 15, '准备上传')

      // Upload original image
      const fileName = file.name.split('.').slice(0, -1).join('.')
      let uploadFileObj: File = file

      if (await isHeic(file)) {
        updateFileProgress(key, 15, '转换 HEIC 格式中')
        const outputBuffer: Blob | Blob[] = await heicTo({
          blob: file,
          type: 'image/jpeg',
        })
        uploadFileObj = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
      }

      updateFileProgress(key, 20, '上传原图中')
      const res = await uploadFile(uploadFileObj, album, storage, alistMountPath, {
        existingImageId: file.imageId,
        onProgress: (p: number) => {
          updateFileProgress(key, 20 + (p * 0.3), '上传原图中')
        },
      })

      if (res.code === 200) {
        updateFileField(key, 'url', res.data?.url)
        updateFileField(key, 'imageId', res.data?.imageId)
        updateFileField(key, 'originalKey', res.data?.key)
        updateFileProgress(key, 50, '原图上传完成')

        // Upload preview
        const previewType = album === '/' ? '/preview' : album + '/preview'
        await uploadPreviewImage(file, previewType)

        updateFileProgress(key, 100, '完成')
        updateFileField(key, 'isUploaded', true)
      } else {
        throw new Error('Upload failed')
      }
    } catch (e) {
      console.error('Process file error:', e)
      updateFileProgress(key, 0, '上传失败')
      toast.error(t('Upload.fileUploadFailed', { name: file.name }))
    } finally {
      updateFileField(key, 'isUploading', false)
    }
  }, [album, storage, alistMountPath, loadExif, getImageDimensions, uploadPreviewImage, t])

  const updateFileProgress = (key: string, progress: number, stage: string) => {
    setFiles(prev => prev.map(f =>
      f.__key === key ? { ...f, uploadProgress: progress, uploadStage: stage } : f
    ))
  }

  const updateFileField = (key: string, field: keyof UploadFile, value: any) => {
    setFiles(prev => prev.map(f =>
      f.__key === key ? { ...f, [field]: value } : f
    ))
  }

  const handleFilesChange = async (newFiles: UploadFile[]) => {
    if (newFiles.length > maxUploadFiles) {
      toast.warning(t('Upload.maxFilesExceeded', { max: maxUploadFiles }))
      newFiles = newFiles.slice(0, maxUploadFiles)
    }

    // Ensure each file has a stable key
    const processedFiles = newFiles.map(f => {
      if (!f.__key) {
        f.__key = (typeof crypto !== 'undefined' && crypto.randomUUID)
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      }
      return f
    })

    setFiles(processedFiles)

    // Auto-expand first file
    if (processedFiles.length > 0 && processedFiles[0].__key) {
      setExpandedFileKeys(new Set([processedFiles[0].__key]))
    }

    // Auto upload if album is selected
    if (album && storage) {
      for (const file of processedFiles) {
        if (!file.isUploaded && !file.isUploading) {
          processFile(file)
        }
      }
    }
  }

  const removeFile = (key: string) => {
    const file = files.find(f => f.__key === key)
    if (file?.originalKey && storage) {
      // Delete from storage
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage, key: file.originalKey })
      }).catch(() => {})
    }
    if (file?.previewKey && storage) {
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage, key: file.previewKey })
      }).catch(() => {})
    }
    setFiles(prev => prev.filter(f => f.__key !== key))
  }

  const removeAllFiles = () => {
    // Delete all uploaded files from storage
    files.forEach(file => {
      if (file.originalKey && storage) {
        fetch('/api/v1/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage, key: file.originalKey })
        }).catch(() => {})
      }
      if (file.previewKey && storage) {
        fetch('/api/v1/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage, key: file.previewKey })
        }).catch(() => {})
      }
    })
    setFiles([])
    setBatchLabels([])
    setBatchExif({})
  }

  const toggleFileExpanded = (key: string) => {
    setExpandedFileKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }

  const applyBatchExif = () => {
    setFiles(prev => prev.map(f => ({
      ...f,
      exif: { ...(f.exif || {}), ...batchExif }
    })))
    toast.success(t('Upload.batchExifApplied'))
  }

  const applyBatchLabels = () => {
    setFiles(prev => prev.map(f => {
      const currentLabels = Array.isArray(f.labels) ? f.labels : []
      const newLabels = [...currentLabels]
      batchLabels.forEach(tag => {
        if (!newLabels.includes(tag)) newLabels.push(tag)
      })
      return { ...f, labels: newLabels }
    }))
    toast.success(t('Upload.batchLabelsApplied'))
  }

  const handleUploadSelectedAndSubmit = async () => {
    setShowMissingModal(false)
    const toUpload = missingFiles.filter(f => f.__key && missingSelection[f.__key])

    for (const file of toUpload) {
      await processFile(file)
    }

    // Then submit all
    await handleSubmit()
  }

  const handleSkipAndSubmit = async () => {
    setShowMissingModal(false)
    await handleSubmit()
  }

  const applyReferenceExifToFile = async (refFile: File, targetKey: string) => {
    try {
      const { tags, exifObj } = await exifReader(refFile)
      setFiles(prev => prev.map(f => {
        if (f.__key === targetKey) {
          return {
            ...f,
            exif: { ...(f.exif || {}), ...exifObj },
            lat: tags?.GPSLatitude?.description || f.lat,
            lon: tags?.GPSLongitude?.description || f.lon,
          }
        }
        return f
      }))
      toast.success(t('Upload.referenceExifToastSuccess'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      toast.error(t('Upload.referenceExifToastError'))
    }
  }

  // Calculate total progress
  useEffect(() => {
    if (files.length === 0) {
      setTotalProgress(0)
      return
    }
    const total = files.reduce((sum, f) => sum + (f.uploadProgress || 0), 0)
    setTotalProgress(Math.round(total / files.length))
  }, [files])

  return (
    <div className="admin-upload flex flex-col space-y-4 h-full flex-1 font-sans text-sm">
      {/* Top controls */}
      <div className="rounded-lg border border-border bg-background-alt p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectStorage')} *
            </label>
            <Select
              value={storage || undefined}
              onChange={(value: string) => {
                setStorage(value)
                if (value === 'alist') { getAlistStorage() }
                else { setStorageSelect(false) }
                if (value === 's3') { toast.info(t('Tips.switchToS3Info')) }
              }}
              placeholder={t('Upload.selectStorage')}
              className="w-full"
              options={storages}
            />
          </div>

          <div className="w-full sm:flex-1">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectAlbum')} *
            </label>
            <Select
              value={album || undefined}
              onChange={(value: string) => setAlbum(value)}
              placeholder={t('Upload.selectAlbum')}
              className="w-full"
              options={data?.map((a: AlbumType) => ({ label: a.name, value: a.album_value }))}
            />
          </div>

          {storage === 'alist' && storageSelect && alistStorage?.length > 0 && (
            <div className="w-full sm:flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('Upload.selectAlistDirectory')} *
              </label>
              <Select
                value={alistMountPath || undefined}
                onChange={(value: string) => setAlistMountPath(value)}
                placeholder={t('Upload.selectAlistDirectory')}
                className="w-full"
                options={alistStorage?.map((s) => ({ label: s?.mount_path, value: s?.mount_path }))}
              />
            </div>
          )}

          <div className="w-full sm:w-auto sm:ml-auto flex items-end gap-2">
            {files.length > 0 && (
              <AntButton
                className="h-10 px-4"
                size="middle"
                onClick={() => setShowBatchEdit(!showBatchEdit)}
              >
                {t('Upload.batchEdit')}
              </AntButton>
            )}
            <AntButton
              className="h-10 px-6"
              size="middle"
              type="primary"
              loading={isSubmitting}
              onClick={handleSubmit}
              disabled={files.length === 0 || album === '' || storage === '' || (storage === 'alist' && alistMountPath === '')}
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              {isSubmitting ? t('Upload.submitting') : t('Button.submit')}
            </AntButton>
          </div>
        </div>

        {/* Global progress */}
        {files.length > 0 && (
          <div className="mt-4 pt-4 border-t">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-text-primary">
                {t('Upload.totalProgress', { current: files.filter(f => f.isUploaded).length, total: files.length })}
              </span>
              <span className="text-sm text-text-secondary">{totalProgress}%</span>
            </div>
            <AntProgress
              percent={totalProgress}
              status={totalProgress === 100 ? 'success' : 'active'}
              strokeColor="var(--primary)"
              strokeWidth={8}
              showInfo={false}
            />
          </div>
        )}
      </div>

      {/* Batch Edit Panel */}
      {showBatchEdit && files.length > 0 && (
        <div className="rounded-lg border border-border bg-background-alt p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">{t('Upload.batchEditTitle')}</h3>
            <AntButton type="text" icon={<CloseOutlined />} onClick={() => setShowBatchEdit(false)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Batch EXIF */}
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">{t('Upload.batchExifTitle')}</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifCameraModelLabel')}</label>
                  <Select
                    value={batchExif.model || undefined}
                    onChange={(v) => setBatchExif({ ...batchExif, model: v })}
                    placeholder={t('Upload.select')}
                    className="w-full"
                    options={exifPresets.cameraModels.map((m: string) => ({ label: m, value: m }))}
                    allowClear
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifApertureLabel')}</label>
                  <AntInput
                    value={batchExif.f_number || ''}
                    onChange={(e) => setBatchExif({ ...batchExif, f_number: e.target.value })}
                    placeholder={t('Upload.input')}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifShutterLabel')}</label>
                  <AntInput
                    value={batchExif.exposure_time || ''}
                    onChange={(e) => setBatchExif({ ...batchExif, exposure_time: e.target.value })}
                    placeholder={t('Upload.input')}
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">ISO</label>
                  <AntInput
                    value={batchExif.iso_speed_rating || ''}
                    onChange={(e) => setBatchExif({ ...batchExif, iso_speed_rating: e.target.value })}
                    placeholder={t('Upload.input')}
                  />
                </div>
              </div>
              <AntButton className="mt-3" size="small" onClick={applyBatchExif}>
                {t('Upload.applyToAll')}
              </AntButton>
            </div>

            {/* Batch Labels */}
            <div>
              <h4 className="text-sm font-medium text-text-secondary mb-3">{t('Upload.batchLabelsTitle')}</h4>
              <div className="flex flex-wrap gap-2 mb-3">
                {presetTags.filter(Boolean).map((tag, i) => {
                  const isSelected = batchLabels.includes(tag)
                  return (
                    <AntTag
                      key={`${tag}-${i}`}
                      color={isSelected ? 'blue' : 'default'}
                      style={{
                        cursor: 'pointer',
                        borderRadius: '16px',
                        padding: '4px 12px',
                        fontSize: '12px',
                        backgroundColor: isSelected ? 'var(--primary)' : undefined,
                        color: isSelected ? '#FFFFFF' : undefined,
                      }}
                      onClick={() => togglePresetTag(tag)}
                    >
                      {tag}
                    </AntTag>
                  )
                })}
              </div>
              <MultipleSelector
                value={batchLabels.map((s: string) => ({ value: s, label: s }))}
                options={presetTags.map((s: string) => ({ value: s, label: s }))}
                creatable
                placeholder={t('Upload.addCustomTags')}
                onChange={(opts?: any) => handleBatchLabelsChange((opts || []).map((o: any) => o.value))}
              />
              <AntButton className="mt-3" size="small" onClick={applyBatchLabels}>
                {t('Upload.applyToAll')}
              </AntButton>
            </div>
          </div>
        </div>
      )}

      {/* Missing files modal */}
      <AntModal
        title={t('Upload.missingFilesTitle', { count: missingFiles.length })}
        open={showMissingModal}
        onCancel={() => setShowMissingModal(false)}
        footer={[
          <AntButton key="cancel" onClick={() => setShowMissingModal(false)}>{t('Button.canal')}</AntButton>,
          <AntButton key="skip" onClick={handleSkipAndSubmit}>{t('Upload.skipMissingAndSubmit')}</AntButton>,
          <AntButton key="upload" type="primary" onClick={handleUploadSelectedAndSubmit}>
            {t('Upload.uploadSelectedAndSubmit')}
          </AntButton>,
        ]}
      >
        <div style={{ maxHeight: 320, overflowY: 'auto' }}>
          {missingFiles.map((f: UploadFile) => (
            <div key={f.__key || f.name} className="flex items-center p-3 border-b border-border">
              <Checkbox
                checked={!!(f.__key && missingSelection[f.__key])}
                onChange={(e) => {
                  if (f.__key) {
                    setMissingSelection(prev => ({ ...prev, [f.__key!]: e.target.checked }))
                  }
                }}
              />
              <div className="ml-3">
                <div className="font-medium">{f.name}</div>
                <div className="text-sm text-text-secondary">{(f.size / 1024 / 1024).toFixed(2)} MB</div>
              </div>
            </div>
          ))}
        </div>
      </AntModal>

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left: Upload area */}
        <div className="lg:col-span-1">
          <AntCard className="h-full" title={t('Upload.uploadFilesCardTitle')}>
            <Dragger
              multiple={true}
              disabled={storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')}
              beforeUpload={() => false}
              showUploadList={false}
              style={{
                padding: 24,
                minHeight: 200,
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                backgroundColor: 'var(--background)',
                transition: 'all 0.2s ease-in-out'
              }}
              onChange={(info) => {
                const fileList = info.fileList || []
                const selected = fileList
                  .map(f => f.originFileObj)
                  .filter(Boolean)
                  .map((orig: UploadFile) => {
                    if (!orig.__key) {
                      orig.__key = (typeof crypto !== 'undefined' && crypto.randomUUID)
                        ? crypto.randomUUID()
                        : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                    }
                    return orig
                  })
                handleFilesChange(selected)
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-text-primary">{t('Upload.dragOrClickMultiple')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTipsMultiple')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.maxFilesLimit', { count: maxUploadFiles })}</p>
                {(storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')) && (
                  <p className="text-text-muted text-sm">
                    {t(storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                  </p>
                )}
              </div>
            </Dragger>

            {files.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <div className="flex items-center justify-between mb-3">
                  <span className="font-medium text-text-primary">
                    {t('Upload.selectedFilesCount', { count: files.length })}
                  </span>
                  <AntButton type="text" danger size="small" onClick={removeAllFiles}>
                    {t('Upload.clearAll')}
                  </AntButton>
                </div>

                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {files.map((file) => (
                    <div
                      key={file.__key}
                      className="p-3 border border-border rounded-lg bg-background cursor-pointer hover:border-primary transition-colors"
                      onClick={() => file.__key && toggleFileExpanded(file.__key)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded bg-primary/10 flex items-center justify-center">
                            <UploadIcon className="w-4 h-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-medium text-text-primary truncate" style={{ maxWidth: 150 }}>
                              {file.name}
                            </div>
                            <div className="text-xs text-text-secondary">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {file.isUploaded ? (
                            <span className="text-xs text-success">{t('Upload.statusUploaded')}</span>
                          ) : file.isUploading ? (
                            <span className="text-xs text-primary">{file.uploadProgress}%</span>
                          ) : (
                            <span className="text-xs text-text-muted">{t('Upload.statusPending')}</span>
                          )}
                          <AntButton
                            type="text"
                            danger
                            size="small"
                            icon={<CloseOutlined />}
                            onClick={(e) => {
                              e.stopPropagation()
                              if (file.__key) removeFile(file.__key)
                            }}
                          />
                        </div>
                      </div>
                      {file.isUploading && (
                        <AntProgress
                          percent={file.uploadProgress}
                          size="small"
                          strokeColor="var(--primary)"
                          showInfo={false}
                          className="mt-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </AntCard>
        </div>

        {/* Right: File details */}
        <div className="lg:col-span-2">
          <AntCard className="h-full" title={t('Upload.fileDetailsCardTitle')}>
            {files.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-text-muted">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="text-sm">{t('Upload.noFiles')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.__key}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* File header */}
                    <div
                      className="p-4 bg-background-alt flex items-center justify-between cursor-pointer"
                      onClick={() => file.__key && toggleFileExpanded(file.__key)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedFileKeys.has(file.__key!) ? <UpOutlined /> : <DownOutlined />}
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <UploadIcon className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-text-primary">{file.name}</div>
                          <div className="text-sm text-text-secondary">
                            {file.width && file.height ? `${file.width} x ${file.height}` : t('Upload.dimensionsPending')}
                            {file.isUploaded && <span className="ml-2 text-success">{t('Upload.statusUploaded')}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {file.isUploading && (
                          <span className="text-sm text-primary">{file.uploadStage}</span>
                        )}
                        <AntButton
                          type="text"
                          danger
                          icon={<CloseOutlined />}
                          onClick={(e) => {
                            e.stopPropagation()
                            if (file.__key) removeFile(file.__key)
                          }}
                        />
                      </div>
                    </div>

                    {/* Expanded content */}
                    {expandedFileKeys.has(file.__key!) && (
                      <div className="p-4 border-t border-border">
                        {/* URLs */}
                        <div className="grid grid-cols-1 gap-3 mb-4">
                          <div>
                            <label className="block text-xs text-text-secondary mb-1">{t('Upload.url')}</label>
                            <AntInput disabled value={file.url || ''} size="small" />
                          </div>
                          <div>
                            <label className="block text-xs text-text-secondary mb-1">{t('Upload.previewUrl')}</label>
                            <AntInput disabled value={file.previewUrl || ''} size="small" />
                          </div>
                        </div>

                        {/* EXIF */}
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="text-sm font-medium text-text-secondary">{t('Upload.exifInfo')}</h5>
                            <AntButton
                              size="small"
                              onClick={() => {
                                const input = document.createElement('input')
                                input.type = 'file'
                                input.accept = 'image/*,.cr2,.arw,.nef,.tif,.tiff,.dng'
                                input.onchange = (e) => {
                                  const refFile = (e.target as HTMLInputElement).files?.[0]
                                  if (refFile && file.__key) {
                                    applyReferenceExifToFile(refFile, file.__key)
                                  }
                                }
                                input.click()
                              }}
                            >
                              {t('Upload.referenceExif')}
                            </AntButton>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifCameraModelLabel')}</label>
                              <Select
                                value={file.exif?.model || undefined}
                                onChange={(v) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), model: v })
                                  }
                                }}
                                placeholder={t('Upload.select')}
                                className="w-full"
                                options={exifPresets.cameraModels.map((m: string) => ({ label: m, value: m }))}
                                allowClear
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifApertureLabel')}</label>
                              <AntInput
                                value={file.exif?.f_number || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), f_number: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifShutterLabel')}</label>
                              <AntInput
                                value={file.exif?.exposure_time || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), exposure_time: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">ISO</label>
                              <AntInput
                                value={file.exif?.iso_speed_rating || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), iso_speed_rating: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifFocalLengthLabel')}</label>
                              <AntInput
                                value={file.exif?.focal_length || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), focal_length: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifShootDateLabel')}</label>
                              <AntDatePicker
                                style={{ width: '100%' }}
                                showTime
                                locale={zhCN}
                                value={file.exif?.data_time ? dayjs(file.exif.data_time) : undefined}
                                onChange={(date) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', {
                                      ...(file.exif || {}),
                                      data_time: date ? date.format('YYYY-MM-DD HH:mm:ss') : ''
                                    })
                                  }
                                }}
                                format="YYYY-MM-DD HH:mm:ss"
                                allowClear
                              />
                            </div>
                          </div>
                        </div>

                        {/* Labels */}
                        <div>
                          <h5 className="text-sm font-medium text-text-secondary mb-2">{t('Upload.tagsHeading')}</h5>
                          <div className="flex flex-wrap gap-2 mb-3">
                            {presetTags.filter(Boolean).map((tag, i) => {
                              const isSelected = file.labels?.includes(tag)
                              return (
                                <AntTag
                                  key={`${tag}-${i}`}
                                  color={isSelected ? 'blue' : 'default'}
                                  style={{
                                    cursor: 'pointer',
                                    borderRadius: '16px',
                                    padding: '4px 12px',
                                    fontSize: '12px',
                                    backgroundColor: isSelected ? 'var(--primary)' : undefined,
                                    color: isSelected ? '#FFFFFF' : undefined,
                                  }}
                                  onClick={() => file.__key && togglePresetTag(tag, file.__key)}
                                >
                                  {tag}
                                </AntTag>
                              )
                            })}
                          </div>
                          <MultipleSelector
                            value={(file.labels || []).map((s: string) => ({ value: s, label: s }))}
                            options={presetTags.map((s: string) => ({ value: s, label: s }))}
                            creatable
                            placeholder={t('Upload.addCustomTags')}
                            onChange={(opts?: any) => {
                              if (file.__key) {
                                const vals = (opts || []).map((o: any) => o.value)
                                updateFileField(file.__key, 'labels', vals)
                              }
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </AntCard>
        </div>
      </div>

      {/* EXIF Preset Modal */}
      <AntModal
        title={t('Upload.exifPresetManagerTitle')}
        open={isPresetModalOpen}
        onOk={() => {
          try {
            const next = {
              cameraModels: editingPresetsText.cameraModels.split(',').map(s => s.trim()).filter(Boolean),
              shutterSpeeds: editingPresetsText.shutterSpeeds.split(',').map(s => s.trim()).filter(Boolean),
              isos: editingPresetsText.isos.split(',').map(s => s.trim()).filter(Boolean),
              apertures: editingPresetsText.apertures.split(',').map(s => s.trim()).filter(Boolean),
            }
            localStorage.setItem(presetsStorageKey, JSON.stringify(next))
            setExifPresets(next)
            setIsPresetModalOpen(false)
            AntMessage.success(t('Tips.saveSuccess'))
          } catch { AntMessage.error(t('Tips.saveFailed')) }
        }}
        onCancel={() => setIsPresetModalOpen(false)}
      >
        <div className="space-y-3">
          <div>
            <div className="text-xs text-gray-600 mb-1">{t('Upload.exifCameraModelsCommaSeparatedLabel')}</div>
            <AntInput value={editingPresetsText.cameraModels} onChange={(e) => setEditingPresetsText({ ...editingPresetsText, cameraModels: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">{t('Upload.exifShutterSpeedsCommaSeparatedLabel')}</div>
            <AntInput value={editingPresetsText.shutterSpeeds} onChange={(e) => setEditingPresetsText({ ...editingPresetsText, shutterSpeeds: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">{t('Upload.exifIsosCommaSeparatedLabel')}</div>
            <AntInput value={editingPresetsText.isos} onChange={(e) => setEditingPresetsText({ ...editingPresetsText, isos: e.target.value })} />
          </div>
          <div>
            <div className="text-xs text-gray-600 mb-1">{t('Upload.exifAperturesCommaSeparatedLabel')}</div>
            <AntInput value={editingPresetsText.apertures} onChange={(e) => setEditingPresetsText({ ...editingPresetsText, apertures: e.target.value })} />
          </div>
        </div>
      </AntModal>
    </div>
  )
}
