'use client'

import React, { useState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { App as AntApp, Cascader as AntCascader, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, message as AntMessage, AutoComplete as AntAutoComplete, Tag as AntTag, Card as AntCard, Space as AntSpace, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, theme, Select } from 'antd'
import MultipleSelector from '~/components/ui/origin/multiselect'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined } from '@ant-design/icons'
// TagInput replaced by Ant Select tags mode
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
// RocketIcon removed; submit button moved to top
// InboxOutlined not used here
const { Dragger } = AntUpload
import { UploadIcon } from '~/components/icons/upload'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

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

export default function SimpleFileUpload() {
  dayjs.locale('zh-cn')
  const { modal } = AntApp.useApp()
  const referenceInputRef = useRef<HTMLInputElement | null>(null)
  const [alistStorage, setAlistStorage] = useState<AlistStorage[]>([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('s3')
  const [album, setAlbum] = useState('')
  const [alistMountPath, setAlistMountPath] = useState('')
  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [imageId, setImageId] = useState('')
  const [imageName, setImageName] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [originalKey, setOriginalKey] = useState<string>('')
  const [, setPreviewKey] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadStage, setUploadStage] = useState('')
  const [totalUploadProgress, setTotalUploadProgress] = useState(0)
  const [currentUploadStage, setCurrentUploadStage] = useState('')
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detail, setDetail] = useState('')
  const [hash, setHash] = useState('')
  const [imageLabels, setImageLabels] = useState([] as string[])
  const [autoUploadedFor, setAutoUploadedFor] = useState<string | null>(null)
  const [showMissingModal, setShowMissingModal] = useState(false)
  
  const t = useTranslations()

  const { data, isLoading } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const defaultStorage = configs?.find(config => config.config_key === 'default_storage')?.config_value || 's3'
  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [primarySelect, setPrimarySelect] = useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = useState<string[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
  
  useEffect(() => {
    if (defaultStorage && storage === 's3') {
      setStorage(defaultStorage)
    }
  }, [defaultStorage, storage])
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

  // 点击预设标签：已存在则移除，否则加入
  function togglePresetTag(tag: string) {
    if (!tag || typeof tag !== 'string' || tag.trim() === '') return
    
    const trimmedTag = tag.trim()
    
    if (!Array.isArray(imageLabels)) {
      setImageLabels([trimmedTag])
      return
    }
    
    // 检查是否已存在（忽略大小写和首尾空格）
    const existingIndex = imageLabels.findIndex(t => t.trim().toLowerCase() === trimmedTag.toLowerCase())
    
    if (existingIndex >= 0) {
      // 已存在，移除
      setImageLabels(imageLabels.filter((_, i) => i !== existingIndex))
    } else {
      // 不存在，添加（确保去重）
      const newLabels = [...imageLabels, trimmedTag]
      const uniqueLabels = Array.from(new Set(newLabels.map(v => v.trim()))).filter(Boolean)
      setImageLabels(uniqueLabels)
    }
  }

  // 当选择级联标签时，自动将所选标签加入到标签输入框（不移除已有用户标签）
  useEffect(() => {
    if (!cascaderValue || cascaderValue.length === 0) {
      // 如果级联选择器被清空，不删除标签（因为可能是用户自己输入的）
      return
    }
    const [p, ...children] = cascaderValue
    // 过滤掉空值和无效值
    const toAdd: string[] = [p, ...children].filter((v) => v && typeof v === 'string' && v.trim() !== '')
    if (toAdd.length === 0) return
    setPrimarySelect(p || null)
    setSecondarySelect(children.filter((v) => v && typeof v === 'string'))
    setImageLabels((prev) => {
      const base = Array.isArray(prev) ? [...prev] : []
      // 使用 Set 去重，确保不会添加重复的标签
      const set = new Set(base.map(v => v.trim()))
      // 添加新标签到集合
      toAdd.forEach(v => {
        if (v && v.trim() !== '') {
          set.add(v.trim())
        }
      })
      return Array.from(set).filter(Boolean)
    })
  }, [cascaderValue])

  const handleImageLabelsChange = (vals: string[]) => {
    // 过滤掉空字符串和无效值，确保数据一致性
    const cleanedVals = Array.isArray(vals)
      ? vals.filter((v) => v && typeof v === 'string' && v.trim() !== '')
      : []
    
    // 去重处理：使用 Set 确保没有重复标签
    const uniqueVals = Array.from(new Set(cleanedVals.map(v => v.trim()))).filter(Boolean)
    
    setImageLabels(uniqueVals)
    
    // 如果用户删除了来自级联选择器的标签，同步清除级联选择器
    if (cascaderValue && cascaderValue.length > 0) {
      const cascaderTags = cascaderValue.filter((v) => v && typeof v === 'string' && v.trim() !== '')
      const allCascaderTagsRemoved = cascaderTags.every(tag => !uniqueVals.includes(tag.trim()))
      
      if (allCascaderTagsRemoved) {
        // 用户删除了所有来自级联选择器的标签，清空级联选择器
        setCascaderValue([])
        setPrimarySelect(null)
        setSecondarySelect([])
      }
    }
  }

  const loadExif = React.useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setExif(exifObj)
      if (tags?.GPSLatitude?.description) {
        setLat(tags?.GPSLatitude?.description)
      } else {
        setLat('')
      }
      if (tags?.GPSLongitude?.description) {
        setLon(tags?.GPSLongitude?.description)
      } else {
        setLon('')
      }
    } catch (e) {
      console.error(e)
    }
    try {
      const reader = new FileReader()
      reader.onload = (e) => {
        const img = new Image()
        img.onload = () => {
          setWidth(Number(img.width))
          setHeight(Number(img.height))
        }
        // @ts-expect-error - FileReader result typing
        img.src = e.target.result
      }
      reader.readAsDataURL(file)
    } catch (e) {
      console.error(e)
    }
  }, [])
  
  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (!url || url === '') {
        // show modal allowing upload+submit
        setIsSubmitting(false)
        setShowMissingModal(true)
        return
      }
      if (album === '') {
        toast.warning(t('Tips.selectAlbumFirst'))
        return
      }
      if (!height || height <= 0) {
        toast.warning(t('Tips.imageHeightRequired'))
        return
      }
      if (!width || width <= 0) {
        toast.warning(t('Tips.imageWidthRequired'))
        return
      }

      const labels = Array.isArray(imageLabels) ? [...imageLabels] : []
      // If only primary selected, include primary. If secondary(s) selected, include primary + all selected secondaries.
      if (primarySelect) {
        if (!labels.includes(primarySelect)) labels.push(primarySelect)
      }
      if (secondarySelect && Array.isArray(secondarySelect) && secondarySelect.length > 0) {
        secondarySelect.forEach((s) => { if (!labels.includes(s)) labels.push(s) })
      }

      const data = {
        album,
        url,
        client_image_id: imageId,
        image_name: imageName,
        title,
        preview_url: previewUrl,
        video_url: videoUrl,
        blurhash: hash,
        exif,
        labels,
        detail,
        width,
        height,
        type: 1,
        lat,
        lon,
      } as ImageType & { tagCategoryMap?: Record<string, string> }

      if (primarySelect && secondarySelect && Array.isArray(secondarySelect) && secondarySelect.length > 0) {
        // map each secondary -> primary for backend upsert
        const map: Record<string, string> = {}
        secondarySelect.forEach(s => { map[s] = primarySelect })
        // @ts-expect-error - attach stable key on File
        ;(data as { tagCategoryMap?: Record<string, string> }).tagCategoryMap = map
      }

      // 提交前，对现有 URL 做一次远端可访问性校验；若失败且仍有本地文件，则尝试自动重传，尽量避免「数据库有 URL 但 COS/S3 中无对象」的情况
      async function verifyUrlAccessible(targetUrl: string): Promise<boolean> {
        if (!targetUrl || typeof targetUrl !== 'string') return false
        // dataURL 或非 http(s) 地址不做远端校验
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

      if (url) {
        const originOk = await verifyUrlAccessible(url)
        let previewOk = true
        if (previewUrl) {
          previewOk = await verifyUrlAccessible(previewUrl)
        }

        if (!originOk || !previewOk) {
          if (files && files.length > 0) {
            try {
              // 自动重传一次原图 + 预览图，复用已有的 imageId 避免重复上传
              await onRequestUpload(files[0], imageId || undefined)
              // 重传成功后，继续后续重复检测与入库流程
            } catch (e) {
              console.error('Re-upload after failed remote verification error', e)
              toast.error(t('Tips.cloudRemoteFileAnomalyRetryFailed'))
              setIsSubmitting(false)
              return
            }
          } else {
            toast.error(t('Tips.remoteOriginOrPreviewMissing'))
            setIsSubmitting(false)
            return
          }
        }
      }

      // 提交前进行重复检测（优先 blurhash，其次 url）
      const dupRes = await fetchWithTimeout('/api/v1/images/check-duplicate', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify({ blurhash: hash || undefined, url: url || undefined }),
      }, 10000).then(r => r.json()).catch(() => ({ code: 200, data: { duplicate: false } }))

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
          setIsSubmitting(false)
          return
        }
      }

      const res = await fetchWithTimeout('/api/v1/images/add', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify(data),
      }, 15000).then(r => r.json())

      if (res?.code === 200) {
        toast.success(t('Tips.saveSuccess'))
      } else {
        toast.error(t('Tips.saveFailed'))
      }
    } catch {
      toast.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
      setTotalUploadProgress(0)
      setCurrentUploadStage('')
      setUploadStage('')
    }
  }

  // small helper to avoid hanging fetches
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
    {
      label: 'Cloudflare R2',
      value: 'r2',
    },
    {
      label: 'Amazon S3',
      value: 's3',
    },
    {
      label: 'Tencent COS',
      value: 'cos',
    },
    {
      label: 'AList API',
      value: 'alist',
    }
  ]

  const uploadPreviewImage = React.useCallback((file: File, type: string) => {
    return new Promise<void>((resolve, reject) => {
      new Compressor(file, {
        quality: previewCompressQuality,
        checkOrientation: false,
        mimeType: 'image/webp',
        maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
        async success(compressedFile) {
          try {
            setUploadStage('压缩预览图中')
            setCurrentUploadStage('压缩预览图中')
            const res = await uploadFile(compressedFile as File, type, storage, alistMountPath, { 
              onProgress: (p: number) => {
                setUploadProgress(p)
                setTotalUploadProgress(50 + (p * 0.4))
              },
              onStageChange: (stage: string) => {
                setUploadStage(stage)
                setCurrentUploadStage(stage)
              }
            })
            if (res?.code === 200) {
              setPreviewUrl(res?.data?.url)
              if (res?.data?.key) setPreviewKey(res.data.key)
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
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, alistMountPath])

  const resHandle = React.useCallback(async (res: UploadResponse, file: File) => {
    try {
      setCurrentUploadStage('处理元数据中')
      setTotalUploadProgress(90)
      
      if (album === '/') {
        await uploadPreviewImage(file, '/preview')
      } else {
        await uploadPreviewImage(file, album + '/preview')
      }
      
      setTotalUploadProgress(100)
      setCurrentUploadStage('完成')
    } catch (e) {
      console.error('Failed to upload preview image:', e)
      throw e
    }
    await loadExif(file)
    setHash(await encodeBrowserThumbHash(file))
    setUrl(res?.data?.url)
    setImageId(res?.data?.imageId)
    setImageName(res?.data?.fileName)
    if (res?.data?.key) setOriginalKey(res.data.key)
  }, [album, loadExif, uploadPreviewImage])

  const applyReferenceExif = React.useCallback(async (file: File) => {
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

  const onRequestUpload = React.useCallback(async (file: File, existingImageId?: string) => {
    if (isUploading) {
      return
    }
    
    setIsUploading(true)
    setTotalUploadProgress(0)
    setCurrentUploadStage('准备上传中')
    
    try {
      const fileName = file.name.split('.').slice(0, -1).join('.')
      if (await isHeic(file)) {
        setCurrentUploadStage('转换 HEIC 格式中')
        const outputBuffer: Blob | Blob[] = await heicTo({
          blob: file,
          type: 'image/jpeg',
        })
        const outputFile = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
        await uploadFile(outputFile, album, storage, alistMountPath, { 
          existingImageId,
          onProgress: (p:number) => {
            setUploadProgress(p)
            setTotalUploadProgress(10 + (p * 0.4))
          },
          onStageChange: (stage: string) => {
            setUploadStage(stage)
            setCurrentUploadStage(stage)
          }
        }).then(async (res) => {
          if (res.code === 200) {
            await resHandle(res, outputFile)
          } else {
            throw new Error('Upload failed')
          }
        })
      } else {
        setCurrentUploadStage('上传原图中')
        if (!file.__key) file.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
        await uploadFile(file, album, storage, alistMountPath, { 
          existingImageId,
          onProgress: (p:number) => {
            setUploadProgress(p)
            setTotalUploadProgress(10 + (p * 0.4))
          },
          onStageChange: (stage: string) => {
            setUploadStage(stage)
            setCurrentUploadStage(stage)
          }
        }).then(async (res) => {
          if (res.code === 200) {
            await resHandle(res, file)
          } else {
            throw new Error('Upload failed')
          }
        })
      }
    } finally {
      setIsUploading(false)
    }
  }, [album, storage, alistMountPath, resHandle, isUploading])

  function onRemoveFile() {
    // 若已上传原图，尝试删除存储对象
    ;(async () => {
      try {
        if (originalKey && storage) {
          await fetch('/api/v1/file/delete', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storage, key: originalKey })
          })
        }
        // 预览文件删除：若能推断同 imageId 则构造前缀删除。此处先跳过，依赖后台清理或后续增强。
      } catch {}
    })()
    setExif({} as ExifType)
    setUrl('')
    setHash('')
    setTitle('')
    setImageId('')
    setImageName('')
    setDetail('')
    setWidth(0)
    setHeight(0)
    setLat('')
    setLon('')
    setPreviewUrl('')
    setVideoUrl('')
    setOriginalKey('')
    setPreviewKey('')
    setImageLabels([])
    setCascaderValue([])
    setPrimarySelect(null)
    setSecondarySelect([])
    setFiles([])
  }

  function removeFileByKey(key: string) {
    try {
      // If current files contain the key, clear all file-related states
      // @ts-expect-error - file key
      const has = files.some(f => (f.__key || f.name || '').toString() === key)
      if (has) {
        onRemoveFile()
      }
      // ensure files cleared
      // @ts-expect-error - file key
      setFiles(prev => prev.filter(f => (f.__key || f.name || '').toString() !== key))
    } catch (e) {
      console.error('removeFileByKey error', e)
      setFiles([])
      onRemoveFile()
    }
  }

  const onBeforeUpload = React.useCallback(async () => {
    setTitle('')
    setImageId('')
    setImageName('')
    setPreviewUrl('')
    setVideoUrl('')
    setImageLabels([])
    setCascaderValue([])
    setPrimarySelect(null)
    setSecondarySelect([])
  }, [])

  const [files, setFiles] = React.useState<File[]>([])

  const _onUpload = React.useCallback(
    async (
      files: File[],
      {
        onSuccess,
        onError,
      }: {
        onSuccess: (file: File) => void;
        onError: (file: File, error: Error) => void;
      },
    ) => {
      try {
        // Process each file individually
        const uploadPromises = files.map(async (file) => {
          try {
            await onBeforeUpload()
            await onRequestUpload(file)
            onSuccess(file)
          } catch (error) {
            onError(
              file,
              error instanceof Error ? error : new Error('Upload failed'),
            )
            throw new Error('Upload failed')
          }
        })

        toast.promise(() => Promise.all(uploadPromises), {
          loading: t('Upload.uploading'),
          success: () => {
            return t('Upload.uploadSuccess')
          },
          error: t('Upload.uploadError'),
        })
      } catch (error) {
        // This handles any error that might occur outside the individual upload processes
        console.error('Unexpected error during upload:', error)
        toast.error('Upload failed')
      }
    },
    [onRequestUpload, onBeforeUpload, t],
  )

  // When a file is selected, only read EXIF/preview/hash locally and prefill the form.
  // Actual upload to storage will happen when the user clicks Submit (onUpload/onRequestUpload).
  React.useEffect(() => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return

    // prevent re-prefill for the same file
    if (autoUploadedFor === file.name) return

    let cancelled = false
    ;(async () => {
      try {
        // 如果未选择相册则不自动上传
        if (!album) {
          // 保持旧行为：本地解析 EXIF/预览作为回退
          await loadExif(file)
          setHash(await encodeBrowserThumbHash(file))
          const reader = new FileReader()
          reader.onload = (e) => {
            if (cancelled) return
            // @ts-expect-error - conditional preview key reading
            setPreviewUrl(typeof e.target?.result === 'string' ? e.target.result : '')
          }
          reader.readAsDataURL(file)
          setAutoUploadedFor(file.name)
          return
        }

        // 已选择相册 => 自动上传原图与预览到存储
        await onRequestUpload(file)
        // onRequestUpload 会在完成时设置 url/previewUrl/exif/hash 等
        setAutoUploadedFor(file.name)
      } catch (e) {
        console.error('Auto-upload failed', e)
      }
    })()

    return () => { cancelled = true }
  }, [files, album, autoUploadedFor, onRequestUpload, loadExif])

  return (
    <div className="admin-upload flex flex-col space-y-4 h-full flex-1 font-sans text-sm">
      {/* Top controls: storage, album, alist (if any) and submit (Form.Item for colon alignment) */}
      <div className="rounded-lg border border-border bg-background-alt p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectStorage')} *
            </label>
            <Select
              value={storage || undefined}
              onChange={(value: string) => { setStorage(value); if (value === 'alist') { getAlistStorage() } else { setStorageSelect(false) } if (value === 's3') { try { toast.info(t('Tips.switchToS3Info')) } catch {} } }}
              placeholder={t('Upload.selectStorage')}
              className="w-full"
              options={storages}
            />
            {storage === '' && (
              <p className="mt-1 text-xs text-error">{t('Upload.selectStorage')}</p>
            )}
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
              {alistMountPath === '' && (
                <p className="mt-1 text-xs text-error">{t('Upload.selectAlistDirectory')}</p>
              )}
            </div>
          )}

          <div className="w-full sm:w-auto sm:ml-auto flex items-end">
            <AntButton
              className="h-10 px-6 flex items-center justify-center w-full sm:w-auto"
              size="middle"
              type="primary"
              loading={isSubmitting || isUploading}
              onClick={async () => {
                if (isUploading) return
                try {
                    if (files.length > 0 && (!url || url === '')) {
                      await onRequestUpload(files[0], imageId || undefined)
                    }
                    await handleSubmit()
                } catch {}
              }}
              disabled={(files.length === 0 && (!url || url === '')) || album === '' || storage === '' || (storage === 'alist' && alistMountPath === '') || isUploading}
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                borderRadius: '8px',
                fontWeight: '500',
                transition: 'all 0.2s ease-in-out'
              }}
            >
              {isUploading ? t('Upload.uploading') : t('Button.submit')}
            </AntButton>
          </div>
        </div>
      </div>
      <AntModal
        title={t('Upload.fileNotUploadedTitle')}
        open={showMissingModal}
        onCancel={() => setShowMissingModal(false)}
        footer={[
          <AntButton key="cancel" onClick={() => setShowMissingModal(false)}>{t('Button.canal')}</AntButton>,
          <AntButton key="upload" type="primary" onClick={async () => {
            setShowMissingModal(false)
            if (files.length === 0) return
            const f = files[0]
            try {
              setIsSubmitting(true)
              await onRequestUpload(f, imageId || undefined)
              await handleSubmit()
            } catch (e) {
              console.error(e)
              toast.error(t('Upload.uploadError'))
            } finally {
              setIsSubmitting(false)
            }
          }}>{t('Upload.uploadAndSubmit')}</AntButton>
        ]}
      >
        <div>{t('Upload.singleFileNotUploadedBody')}</div>
      </AntModal>

      {/* AList mount path selector is rendered inline in the top row when applicable */}
      {/* Main area: left - uploader, right - metadata form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="h-full">
          <AntCard className="h-full" title={t('Upload.uploadFilesCardTitle')}>
              <Dragger
              multiple={false}
              disabled={storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')}
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
                const last = fileList.length > 0 ? (fileList[fileList.length - 1].originFileObj as File) : undefined
                if (last) {
                  // ensure stable key
                  // @ts-expect-error - attach stable key on File
                  if (!last.__key) last.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
                  setFiles([last])
                } else {
                  setFiles([])
                }
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <UploadIcon className="w-8 h-8 text-primary" />
                </div>
                <p className="font-semibold text-text-primary">{t('Upload.dragOrClick')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTipsSingle')}</p>
                {(storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')) && (
                  <p className="text-text-muted text-sm">
                    {t(storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                  </p>
                )}
              </div>
            </Dragger>
            {/* Progress bar for upload */}
            {totalUploadProgress > 0 && (
              <div className="mt-4 p-4 rounded-lg border border-border bg-background">
                {currentUploadStage && (
                  <div className="text-sm text-text-secondary mb-3 font-medium">{currentUploadStage}</div>
                )}
                <AntProgress 
                  percent={Math.round(totalUploadProgress)} 
                  status="active"
                  strokeColor="var(--primary)"
                  strokeWidth={8}
                  showInfo={false}
                  className="mb-2"
                />
                <div className="text-sm text-text-secondary">
                  {Math.round(totalUploadProgress)}%
                </div>
              </div>
            )}
            {/* Inline EXIF form moved up from bottom to occupy blank space */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm font-medium mb-3">{t('Upload.exifInfoPartiallyMissingHint')}</div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <AntButton
                  type="default"
                  onClick={() => referenceInputRef.current?.click()}
                >
                  {t('Upload.referenceExifExtractButton')}
                </AntButton>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) applyReferenceExif(file)
                    // 允许重复选择同一文件
                    e.target.value = ''
                  }}
                />
              </div>
              <AntForm layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <AntForm.Item
                    label={t('Upload.exifCameraModelLabel')}
                    extra={<a onClick={() => { setEditingPresetsText({ cameraModels: exifPresets.cameraModels.join(', '), shutterSpeeds: exifPresets.shutterSpeeds.join(', '), isos: exifPresets.isos.join(', '), apertures: exifPresets.apertures.join(', ') }); setIsPresetModalOpen(true) }}>{t('Upload.manageCommonExifOptionsLink')}</a>}
                  >
                    <div>
                      <MultipleSelector
                        value={exif?.model ? [{ value: String(exif.model), label: String(exif.model) }] : []}
                        options={exifPresets.cameraModels.map((m: string) => ({ value: m, label: m }))}
                        placeholder={t('Upload.exifCameraModelManualPlaceholder')}
                        creatable
                        maxSelected={1}
                        onChange={(opts?: any) => {
                          const v = (opts && opts[0] && opts[0].value) || ''
                          setExif({ ...(exif || {}), model: v })
                        }}
                      />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label={t('Upload.exifApertureLabel')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Select
                        value={exif?.f_number || undefined}
                        onChange={(v) => setExif({ ...(exif || {}), f_number: v })}
                        placeholder={t('Upload.exifCommonAperturePlaceholder')}
                        className="min-w-[120px]"
                        options={exifPresets.apertures.map((a: string) => ({ label: a, value: a }))}
                      />
                      <AntInput value={exif?.f_number || ''} onChange={(e) => setExif({ ...(exif || {}), f_number: e.target.value })} placeholder={t('Upload.orManualInputPlaceholder')} />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label={t('Upload.exifShutterLabel')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Select
                        value={exif?.exposure_time || undefined}
                        onChange={(v) => setExif({ ...(exif || {}), exposure_time: v })}
                        placeholder={t('Upload.exifCommonShutterPlaceholder')}
                        className="min-w-[120px]"
                        options={exifPresets.shutterSpeeds.map((s: string) => ({ label: s, value: s }))}
                      />
                      <AntInput value={exif?.exposure_time || ''} onChange={(e) => setExif({ ...(exif || {}), exposure_time: e.target.value })} placeholder={t('Upload.orManualInputPlaceholder')} />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="ISO">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Select
                        value={exif?.iso_speed_rating || undefined}
                        onChange={(v) => setExif({ ...(exif || {}), iso_speed_rating: v })}
                        placeholder={t('Upload.exifCommonIsoPlaceholder')}
                        className="min-w-[120px]"
                        options={exifPresets.isos.map((i: string) => ({ label: i, value: i }))}
                      />
                      <AntInput value={exif?.iso_speed_rating || ''} onChange={(e) => setExif({ ...(exif || {}), iso_speed_rating: e.target.value })} placeholder={t('Upload.orManualInputPlaceholder')} />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label={t('Upload.exifFocalLengthLabel')}>
                    <AntInput value={exif?.focal_length || ''} onChange={(e) => setExif({ ...(exif || {}), focal_length: e.target.value })} />
                  </AntForm.Item>
                  <AntForm.Item label={t('Upload.exifShootDateLabel')}>
                    <AntDatePicker
                      style={{ width: '100%' }}
                      showTime
                      placeholder={t('Upload.exifShootDateTimePlaceholder')}
                      locale={zhCN}
                      value={exif?.data_time ? dayjs(exif.data_time) : undefined}
                      onChange={(date) => setExif({ ...(exif || {}), data_time: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
                      format="YYYY-MM-DD HH:mm:ss"
                      allowClear
                    />
                  </AntForm.Item>
                </div>
              </AntForm>
            </div>
          </AntCard>
        </div>

        <div className="h-full">
          <div className="rounded-lg border border-border bg-background-alt h-full">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">{t('Upload.metadataCardTitle')}</h3>
            </div>
            <div className="p-4 space-y-6">
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.addressAndSizeHeading')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.title')}</label>
                    <AntInput
                      value={title}
                      placeholder={t('Upload.inputTitle')}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{
                        borderRadius: '8px',
                        borderColor: 'var(--border)',
                        transition: 'all 0.2s ease-in-out'
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.url')}</label>
                    <AntInput 
                      disabled 
                      value={url} 
                      style={{
                        borderRadius: '8px',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                    {!url && (
                      <p className="mt-2 text-xs text-error">{t('Upload.originNotUploadedHint')}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.previewUrl')}</label>
                    <AntInput 
                      disabled 
                      value={previewUrl} 
                      style={{
                        borderRadius: '8px',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.width')}</label>
                      <AntInputNumber 
                        disabled 
                        value={width} 
                        onChange={(val) => setWidth(Number(val) || 0)} 
                        style={{ 
                          width: '100%',
                          borderRadius: '8px',
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--background)'
                        }} 
                      />
                      {!width && (
                        <p className="mt-2 text-xs text-error">{t('Tips.imageWidthRequired')}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.height')}</label>
                      <AntInputNumber 
                        disabled 
                        value={height} 
                        onChange={(val) => setHeight(Number(val) || 0)} 
                        style={{ 
                          width: '100%',
                          borderRadius: '8px',
                          borderColor: 'var(--border)',
                          backgroundColor: 'var(--background)'
                        }} 
                      />
                      {!height && (
                        <p className="mt-2 text-xs text-error">{t('Tips.imageHeightRequired')}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.locationHeading')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.lon')}</label>
                    <AntInput 
                      disabled 
                      value={lon} 
                      onChange={(e) => setLon(e.target.value)} 
                      style={{
                        borderRadius: '8px',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.lat')}</label>
                    <AntInput 
                      disabled 
                      value={lat} 
                      onChange={(e) => setLat(e.target.value)} 
                      style={{
                        borderRadius: '8px',
                        borderColor: 'var(--border)',
                        backgroundColor: 'var(--background)'
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.detail')}</h4>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">{t('Upload.detail')}</label>
                  <AntInput 
                    value={detail} 
                    onChange={(e) => setDetail(e.target.value)} 
                    placeholder={t('Upload.inputDetail')}
                    style={{
                      borderRadius: '8px',
                      borderColor: 'var(--border)',
                      transition: 'all 0.2s ease-in-out'
                    }}
                  />
                </div>
              </div>

              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.tagsHeading')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.presetTagsClickAddRemoveHint')}</label>
                    <div className="flex flex-wrap gap-2">
                      {presetTags.filter(Boolean).map((tag, i) => {
                        const isSelected = imageLabels && imageLabels.includes(tag)
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
                              borderColor: isSelected ? 'var(--primary)' : undefined
                            }}
                            onClick={() => togglePresetTag(tag)}
                          >
                            {tag}
                          </AntTag>
                        )
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.tagCategoryHeading')}</label>
                    <div className="space-y-3">
                      <Select
                        value={primarySelect || undefined}
                        onChange={(v: string) => {
                          setPrimarySelect(v)
                          setCascaderValue([v, ...(secondarySelect || [])])
                        }}
                        placeholder={t('Upload.tagCategoryPlaceholder')}
                        className="w-full"
                        options={tagTree.filter(Boolean).map((n) => ({ label: n.category ?? t('Upload.tagUncategorized'), value: n.category }))}
                        style={{
                          borderRadius: '8px',
                          borderColor: 'var(--border)'
                        }}
                      />
                      <MultipleSelector
                        value={(secondarySelect || []).map((s: string) => ({ value: s, label: s }))}
                        options={(tagTree.find((t) => String(t.category) === String(primarySelect))?.children || []).map((c: any) => ({ value: c.name, label: c.name }))}
                        placeholder={t('Upload.tagChildrenPlaceholderMultiple')}
                        onChange={(opts?: any) => {
                          const vals = (opts || []).map((o: any) => o.value)
                          setSecondarySelect(vals)
                          setCascaderValue([primarySelect || '', ...vals])
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.customTagsHeading')}</label>
                    <MultipleSelector
                      value={(imageLabels.filter(Boolean) || []).map((s: string) => ({ value: s, label: s }))}
                      options={(presetTags || []).map((s: string) => ({ value: s, label: s }))}
                      creatable
                      placeholder={t('Upload.indexTag')}
                      onChange={(opts?: any) => handleImageLabelsChange((opts || []).map((o:any)=>o.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* File list - full width (hidden when no files) */}
      {files.length > 0 && (
        <div className="w-full">
          <div className="rounded-lg border border-border bg-background-alt">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">{t('Upload.selectedFiles')}</h3>
            </div>
            <div className="p-4">
              {files.map((file, index) => (
                <div key={((file as any).__key || file.name || index)} className="flex items-center justify-between p-3 border border-border rounded-lg mb-3 bg-background">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <UploadIcon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <div className="font-medium text-text-primary">{file.name}</div>
                      <div className="text-sm text-text-secondary">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <div>
                    <AntButton
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => {
                        // @ts-expect-error - read key from possibly-augmented File
                        const k = (file && ((file as any).__key || file.name))
                        if (k) removeFileByKey(String(k))
                        else onRemoveFile()
                      }}
                      className="hover:bg-error/10 rounded-full p-2"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

        <AntModal
          title={t('Upload.exifPresetManagerTitle')}
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
              AntMessage.success(t('Tips.saveSuccess'))
            } catch { AntMessage.error(t('Tips.saveFailed')) }
          }}
          onCancel={() => setIsPresetModalOpen(false)}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.exifCameraModelsCommaSeparatedLabel')}</div>
              <AntInput value={editingPresetsText.cameraModels} onChange={(e)=>setEditingPresetsText({...editingPresetsText, cameraModels: e.target.value})} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.exifShutterSpeedsCommaSeparatedLabel')}</div>
              <AntInput value={editingPresetsText.shutterSpeeds} onChange={(e)=>setEditingPresetsText({...editingPresetsText, shutterSpeeds: e.target.value})} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.exifIsosCommaSeparatedLabel')}</div>
              <AntInput value={editingPresetsText.isos} onChange={(e)=>setEditingPresetsText({...editingPresetsText, isos: e.target.value})} />
            </div>
            <div>
              <div className="text-xs text-gray-600 mb-1">{t('Upload.exifAperturesCommaSeparatedLabel')}</div>
              <AntInput value={editingPresetsText.apertures} onChange={(e)=>setEditingPresetsText({...editingPresetsText, apertures: e.target.value})} />
            </div>
          </div>
        </AntModal>
    </div>
  )
}