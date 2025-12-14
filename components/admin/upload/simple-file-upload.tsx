'use client'

import React, { useState, useEffect } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import Compressor from 'compressorjs'
import { Select as AntSelect, Cascader as AntCascader, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, message as AntMessage, AutoComplete as AntAutoComplete, Tag as AntTag, Card as AntCard, Space as AntSpace, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, theme } from 'antd'
import dayjs from 'dayjs'
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
  const [alistStorage, setAlistStorage] = useState<AlistStorage[]>([])
  const [storageSelect, setStorageSelect] = useState(false)
  const [storage, setStorage] = useState('r2')
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
  const [uploadProgress, setUploadProgress] = useState(0)
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

  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [primarySelect, setPrimarySelect] = useState<string | null>(null)
  const [secondarySelect, setSecondarySelect] = useState<string[]>([])
  const [cascaderValue, setCascaderValue] = useState<string[]>([])
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

      // 提交前进行重复检测（优先 blurhash，其次 url）
      const dupRes = await fetchWithTimeout('/api/v1/images/check-duplicate', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify({ blurhash: hash || undefined, url: url || undefined }),
      }, 10000).then(r => r.json()).catch(() => ({ code: 200, data: { duplicate: false } }))

      if (dupRes?.code === 200 && dupRes?.data?.duplicate) {
        const ok = await new Promise<boolean>((resolve) => {
          AntModal.confirm({
            title: '检测到重复图片',
            content: '该图片已存在，是否仍然继续保存（可能会复用已有记录）？',
            okText: '继续保存',
            cancelText: '取消',
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
      label: 'AList API',
      value: 'alist',
    }
  ]

  const uploadPreviewImage = React.useCallback(async (file: File, type: string) => {
    new Compressor(file, {
      quality: previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: previewImageMaxWidthLimitSwitchOn && previewImageMaxWidthLimit > 0 ? previewImageMaxWidthLimit : undefined,
      async success(compressedFile) {
        const res = await uploadFile(compressedFile, type, storage, alistMountPath, { onProgress: (p:number) => setUploadProgress(p) })
        if (res?.code === 200) {
          setPreviewUrl(res?.data?.url)
          if (res?.data?.key) setPreviewKey(res.data.key)
        } else {
          throw new Error('Upload failed')
        }
      },
      error() {
        throw new Error('Upload failed')
      },
    })
  }, [previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, storage, alistMountPath])

  const resHandle = React.useCallback(async (res: UploadResponse, file: File) => {
    try {
      if (album === '/') {
        await uploadPreviewImage(file, '/preview')
      } else {
        await uploadPreviewImage(file, album + '/preview')
      }
    } catch (e) {
      console.error('Failed to upload preview image:', e)
    }
    await loadExif(file)
    setHash(await encodeBrowserThumbHash(file))
    setUrl(res?.data?.url)
    setImageId(res?.data?.imageId)
    setImageName(res?.data?.fileName)
    if (res?.data?.key) setOriginalKey(res.data.key)
  }, [album, loadExif, uploadPreviewImage])

  const onRequestUpload = React.useCallback(async (file: File) => {
    // 获取文件名但是去掉扩展名部分
    const fileName = file.name.split('.').slice(0, -1).join('.')
    if (await isHeic(file)) {
      // 把 HEIC 转成 JPEG
      const outputBuffer: Blob | Blob[] = await heicTo({
        blob: file,
        type: 'image/jpeg',
      })
      const outputFile = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
      await uploadFile(outputFile, album, storage, alistMountPath, { onProgress: (p:number) => setUploadProgress(p) }).then(async (res) => {
        if (res.code === 200) {
          await resHandle(res, outputFile)
        } else {
          throw new Error('Upload failed')
        }
      })
    } else {
      // ensure __key exists
      // @ts-expect-error - preview dataURL typing
      if (!file.__key) file.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
      await uploadFile(file, album, storage, alistMountPath, { onProgress: (p:number) => setUploadProgress(p) }).then(async (res) => {
        if (res.code === 200) {
          await resHandle(res, file)
        } else {
          throw new Error('Upload failed')
        }
      })
    }
  }, [album, storage, alistMountPath, resHandle])

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
      <AntForm layout="horizontal" style={{ marginBottom: 16 }}>
        <div className="flex items-center" style={{ gap: 16 }}>
          <AntForm.Item 
            label={t('Upload.selectStorage')} 
            required
            validateStatus={storage === '' ? 'error' : ''}
            help={storage === '' ? '请选择存储' : ''}
            style={{ minWidth: 160, marginBottom: 0 }}
          >
            <AntSelect
              size="middle"
              value={storage}
              placeholder={t('Upload.selectStorage')}
              onChange={async (value: string) => {
                setStorage(value)
                if (value === 'alist') {
                  await getAlistStorage()
                } else {
                  setStorageSelect(false)
                }
                if (value === 's3') {
                  try { toast.info('已切换到 Amazon S3：无需选择目录，请先选择相册再上传') } catch {}
                }
              }}
              style={{ width: 160 }}
            >
              {storages?.map((s) => (
                <AntSelect.Option key={s.value} value={s.value}>{s.label}</AntSelect.Option>
              ))}
            </AntSelect>
          </AntForm.Item>

          <AntForm.Item 
            label={t('Upload.selectAlbum')} 
            required
            validateStatus={album === '' ? 'error' : ''}
            help={album === '' ? '请选择相册' : ''}
            style={{ minWidth: 280, flex: 1, marginBottom: 0 }}
          >
            <AntSelect
              size="middle"
              disabled={isLoading}
              value={album}
              placeholder={t('Upload.selectAlbum')}
              onChange={(value: string) => setAlbum(value)}
              style={{ minWidth: 240 }}
            >
              {data?.map((a: AlbumType) => (
                <AntSelect.Option key={a.album_value} value={a.album_value}>{a.name}</AntSelect.Option>
              ))}
            </AntSelect>
          </AntForm.Item>

          {storage === 'alist' && storageSelect && alistStorage?.length > 0 && (
            <AntForm.Item
              label={t('Upload.selectAlistDirectory')}
              required
              validateStatus={alistMountPath === '' ? 'error' : ''}
              help={alistMountPath === '' ? '请选择 AList 目录' : ''}
              style={{ minWidth: 240, marginBottom: 0 }}
            >
              <AntSelect
                size="middle"
                disabled={isLoading}
                value={alistMountPath}
                placeholder={t('Upload.selectAlistDirectory')}
                onChange={(value: string) => setAlistMountPath(value)}
                style={{ width: 200 }}
              >
                {alistStorage?.map((s) => (
                  <AntSelect.Option key={s?.mount_path} value={s?.mount_path}>{s?.mount_path}</AntSelect.Option>
                ))}
              </AntSelect>
            </AntForm.Item>
          )}

          <div style={{ marginLeft: 'auto' }}>
            <AntButton
              size="middle"
              type="primary"
              loading={isSubmitting}
              onClick={async () => {
                try {
                    if (files.length > 0 && (!url || url === '')) {
                      await onRequestUpload(files[0])
                    }
                    await handleSubmit()
                } catch {}
              }}
              disabled={(files.length === 0 && (!url || url === '')) || album === '' || storage === '' || (storage === 'alist' && alistMountPath === '')}
            >
              {t('Button.submit')}
            </AntButton>
          </div>
        </div>
      </AntForm>
      <AntModal
        title="文件未上传"
        open={showMissingModal}
        onCancel={() => setShowMissingModal(false)}
        footer={[
          <AntButton key="cancel" onClick={() => setShowMissingModal(false)}>{'取消'}</AntButton>,
          <AntButton key="upload" type="primary" onClick={async () => {
            setShowMissingModal(false)
            if (files.length === 0) return
            const f = files[0]
            try {
              setIsSubmitting(true)
              await onRequestUpload(f)
              // after upload, try submit again
              await handleSubmit()
            } catch (e) {
              console.error(e)
              toast.error('上传失败')
            } finally {
              setIsSubmitting(false)
            }
          }}>{'上传并提交'}</AntButton>
        ]}
      >
        <div>当前文件尚未上传。点击“上传并提交”将先上传文件然后保存元数据。</div>
      </AntModal>

      {/* AList mount path selector is rendered inline in the top row when applicable */}
      {/* Main area: left - uploader, right - metadata form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="h-full">
          <AntCard className="h-full" title="上传文件">
              <Dragger
              multiple={false}
              disabled={storage === '' || album === '' || (storage === 'alist' && alistMountPath === '')}
              beforeUpload={() => false}
              showUploadList={false}
              style={{ padding: 12, minHeight: 120, height: '100%' }}
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
            {/* Progress bar for upload */}
            {uploadProgress > 0 && (
              <div className="mt-3">
                <AntProgress percent={uploadProgress} status="active" />
              </div>
            )}
            {/* Inline EXIF form moved up from bottom to occupy blank space */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm font-medium mb-3">EXIF 信息（若部分缺失，可在此补充）</div>
              <AntForm layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <AntForm.Item label="相机品牌 / 型号" extra={<a onClick={() => { setEditingPresetsText({ cameraModels: exifPresets.cameraModels.join(', '), shutterSpeeds: exifPresets.shutterSpeeds.join(', '), isos: exifPresets.isos.join(', '), apertures: exifPresets.apertures.join(', ') }); setIsPresetModalOpen(true) }}>管理常用选项</a>}>
                    <AntAutoComplete
                      options={exifPresets.cameraModels.map((m: string) => ({ value: m }))}
                      style={{ width: '100%' }}
                      placeholder="可从建议中选择或直接输入相机型号"
                      value={exif?.model || undefined}
                      onChange={(val) => setExif({ ...(exif || {}), model: val })}
                      allowClear
                    />
                  </AntForm.Item>
                  <AntForm.Item label="光圈 (f/)">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <AntSelect style={{ minWidth: 120 }} placeholder="常用光圈" value={exif?.f_number || undefined} onChange={(v) => setExif({ ...(exif || {}), f_number: v })} allowClear options={exifPresets.apertures.map((a: string) => ({ label: a, value: a }))} />
                      <AntInput value={exif?.f_number || ''} onChange={(e) => setExif({ ...(exif || {}), f_number: e.target.value })} placeholder="或手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="快门 (exposure time)">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <AntSelect style={{ minWidth: 120 }} placeholder="常用快门" value={exif?.exposure_time || undefined} onChange={(v) => setExif({ ...(exif || {}), exposure_time: v })} allowClear options={exifPresets.shutterSpeeds.map((s: string) => ({ label: s, value: s }))} />
                      <AntInput value={exif?.exposure_time || ''} onChange={(e) => setExif({ ...(exif || {}), exposure_time: e.target.value })} placeholder="或手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="ISO">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <AntSelect style={{ minWidth: 120 }} placeholder="常用 ISO" value={exif?.iso_speed_rating || undefined} onChange={(v) => setExif({ ...(exif || {}), iso_speed_rating: v })} allowClear options={exifPresets.isos.map((i: string) => ({ label: i, value: i }))} />
                      <AntInput value={exif?.iso_speed_rating || ''} onChange={(e) => setExif({ ...(exif || {}), iso_speed_rating: e.target.value })} placeholder="或手动输入" />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label="焦距 (mm)">
                    <AntInput value={exif?.focal_length || ''} onChange={(e) => setExif({ ...(exif || {}), focal_length: e.target.value })} />
                  </AntForm.Item>
                  <AntForm.Item label="拍摄日期">
                    <AntDatePicker
                      style={{ width: '100%' }}
                      showTime
                      placeholder="选择拍摄日期和时间"
                      value={exif?.date_time ? dayjs(exif.date_time) : undefined}
                      onChange={(date) => setExif({ ...(exif || {}), date_time: date ? date.format('YYYY-MM-DD HH:mm:ss') : '' })}
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
          <AntCard className="h-full" title="元数据" styles={{ header: { borderBottom: '1px solid #f0f0f0' } }}>
            <AntSpace vertical size={16} style={{ width: '100%' }}>
              <div>
                <div className="text-sm font-medium" style={{ marginBottom: 12, color: '#262626' }}>地址与尺寸</div>
                <AntSpace vertical size={12} style={{ width: '100%' }}>
                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.title')}</div>
                    <AntInput
                      value={title}
                      placeholder={t('Upload.inputTitle')}
                      onChange={(e) => setTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.url')}</div>
                    <AntInput disabled value={url} />
                    {!url && (
                      <div className="text-xs" style={{ marginTop: 8, color: '#cf1322' }}>未上传原图，提交前将提示上传或自动上传。</div>
                    )}
                  </div>

                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.previewUrl')}</div>
                    <AntInput disabled value={previewUrl} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div>
                      <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.width')}</div>
                      <AntInputNumber disabled value={width} onChange={(val) => setWidth(Number(val) || 0)} style={{ width: '100%' }} />
                      {!width && (
                        <div className="text-xs" style={{ marginTop: 8, color: '#cf1322' }}>缺少宽度信息</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.height')}</div>
                      <AntInputNumber disabled value={height} onChange={(val) => setHeight(Number(val) || 0)} style={{ width: '100%' }} />
                      {!height && (
                        <div className="text-xs" style={{ marginTop: 8, color: '#cf1322' }}>缺少高度信息</div>
                      )}
                    </div>
                  </div>
                </AntSpace>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ marginBottom: 12, color: '#262626' }}>地理位置</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.lon')}</div>
                    <AntInput disabled value={lon} onChange={(e) => setLon(e.target.value)} />
                  </div>
                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.lat')}</div>
                    <AntInput disabled value={lat} onChange={(e) => setLat(e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ marginBottom: 12, color: '#262626' }}>描述</div>
                <div>
                  <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>{t('Upload.detail')}</div>
                  <AntInput value={detail} onChange={(e) => setDetail(e.target.value)} placeholder={t('Upload.inputDetail')} />
                </div>
              </div>

              <div>
                <div className="text-sm font-medium" style={{ marginBottom: 12, color: '#262626' }}>标签</div>
                <AntSpace vertical size={12} style={{ width: '100%' }}>
                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>预设标签（点击加入 / 再次点击移除）</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {presetTags.filter(Boolean).map((tag, i) => (
                        <AntTag
                          key={`${tag}-${i}`}
                          color={imageLabels && imageLabels.includes(tag) ? 'blue' : 'default'}
                          style={{ cursor: 'pointer' }}
                          onClick={() => togglePresetTag(tag)}
                        >
                          {tag}
                        </AntTag>
                      ))}
                    </div>
                  </div>

                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>标签分类（级联选择）</div>
                    <AntCascader
                      placeholder="选择标签分类"
                      style={{ width: '100%' }}
                      multiple
                      maxTagCount="responsive"
                      value={cascaderValue}
                      onChange={(val) => setCascaderValue(val as string[])}
                      options={tagTree.filter(Boolean).map((n) => ({
                        value: n.category,
                        label: n.category ?? '未分类',
                        children: (n.children || []).filter((c) => c && c.name).map((c) => ({ value: c.name, label: c.name }))
                      }))}
                    />
                  </div>

                  <div>
                    <div className="text-xs" style={{ marginBottom: 8, color: '#595959' }}>自定义标签（多个以逗号分隔）</div>
                    <AntSelect mode="tags" size="middle" style={{ width: '100%' }} placeholder={t('Upload.indexTag')} value={imageLabels.filter(Boolean)} onChange={handleImageLabelsChange} tokenSeparators={[',']} />
                  </div>
                </AntSpace>
              </div>
            </AntSpace>
          </AntCard>
        </div>
      </div>

      {/* File list - full width (hidden when no files) */}
      {files.length > 0 && (
        <div className="w-full">
          <AntCard>
            {files.map((file, index) => (
              <div key={((file as any).__key || file.name || index)} className="flex items-center justify-between p-2 border rounded mb-2">
                <div className="flex items-center gap-3">
                  <div className="font-medium">{file.name}</div>
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
                  />
                </div>
              </div>
            ))}
          </AntCard>
        </div>
      )}

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
    </div>
  )
}