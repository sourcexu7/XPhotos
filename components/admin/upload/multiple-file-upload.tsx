'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { message, theme } from 'antd'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import { App as AntApp, Upload as AntUpload, Button as AntButton, Input as AntInput, Modal as AntModal, Tag as AntTag, Card as AntCard, Progress as AntProgress, DatePicker as AntDatePicker, Select, Checkbox } from 'antd'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined, DownOutlined, UpOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

// 导入我们新创建的自定义 Hooks 和工具函数
import { useStorageConfig } from '~/hooks/useStorageConfig'
import { useTagManagement } from '~/hooks/useTagManagement'
import { useExifData } from '~/hooks/useExifData'
import { useExifPresets } from '~/hooks/useExifPresets'
import { verifyUrlAccessible, fetchWithTimeout, checkDuplicate, uploadPreviewImage } from '~/lib/utils/uploadUtils'
import { uploadFile } from '~/lib/utils/file'
import { heicTo, isHeic } from 'heic-to'
import { UploadOutlined } from '@ant-design/icons'

const { Dragger } = AntUpload

interface UploadFile extends File {
  __key?: string
  id?: string
  labels?: string[]
  exif?: Partial<ExifType>
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
  [key: string]: any
}

export default function MultipleFileUpload() {
  dayjs.locale('zh-cn')
  const { token } = theme.useToken()
  const { modal } = AntApp.useApp()
  const t = useTranslations()

  // 使用自定义 Hooks
  const storageConfig = useStorageConfig()
  const tagManagement = useTagManagement()
  const tagManagementRef = useRef(tagManagement)
  tagManagementRef.current = tagManagement
  const exifDataHook = useExifData()
  const exifDataHookRef = useRef(exifDataHook)
  exifDataHookRef.current = exifDataHook
  const exifPresets = useExifPresets()

  // 相册和配置数据
  const { data: albums } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const [album, setAlbum] = useState('')
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [totalProgress, setTotalProgress] = useState(0)
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [missingFiles, setMissingFiles] = useState<UploadFile[]>([])
  const [missingSelection, setMissingSelection] = useState<Record<string, boolean>>({})
  const [expandedFileKeys, setExpandedFileKeys] = useState<Set<string>>(new Set())
  const [batchExif, setBatchExif] = useState<Partial<ExifType>>({})
  const [batchLabels, setBatchLabels] = useState<string[]>([])
  const [showBatchEdit, setShowBatchEdit] = useState(false)
  const [presetTags, setPresetTags] = useState<string[]>([])

  // 获取配置值
  const maxUploadFiles = parseInt(configs?.find(config => config.config_key === 'max_upload_files')?.config_value || '20')
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')

  // 拉取后端预设标签
  useEffect(() => {
    fetcher('/api/v1/settings/tags/get')
      .then((res: { data: { name: string }[] }) => {
        if (res?.data) setPresetTags(res.data.map((t) => t.name))
      })
      .catch(() => {})
  }, [])

  // 更新文件进度
  const updateFileProgress = useCallback((key: string, progress: number, stage: string) => {
    setFiles(prev => prev.map(f =>
      f.__key === key ? { ...f, uploadProgress: progress, uploadStage: stage } : f
    ))
  }, [])

  // 更新文件字段
  const updateFileField = useCallback((key: string, field: keyof UploadFile, value: any) => {
    setFiles(prev => prev.map(f =>
      f.__key === key ? { ...f, [field]: value } : f
    ))
  }, [])

  // 处理文件变化
  const handleFilesChange = useCallback(async (newFiles: UploadFile[]) => {
    if (newFiles.length > maxUploadFiles) {
      message.warning(t('Upload.maxFilesExceeded', { max: maxUploadFiles }))
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
    if (album && storageConfig.storage) {
      for (const file of processedFiles) {
        if (!file.isUploaded && !file.isUploading) {
          await processFileRef.current?.(file)
        }
      }
    }
  }, [album, storageConfig.storage, maxUploadFiles, t])

  // 使用 ref 保存 processFile，避免 handleFilesChange 与 processFile 之间的循环依赖
  const processFileRef = useRef<(file: UploadFile) => Promise<void>>(() => Promise.resolve())
  // 处理单个文件
  const processFile = useCallback(async (file: UploadFile) => {
    if (!file.__key) return
    const key = file.__key

    try {
      updateFileField(key, 'isUploading', true)
      updateFileProgress(key, 5, '读取元数据中')

      // Get EXIF and dimensions
      const { exif: exifInfo, lat, lon, width, height } = await exifDataHookRef.current.loadExifData(file)
      updateFileField(key, 'exif', exifInfo)
      updateFileField(key, 'lat', lat)
      updateFileField(key, 'lon', lon)
      updateFileField(key, 'width', width)
      updateFileField(key, 'height', height)
      updateFileProgress(key, 10, '生成模糊哈希')

      // Generate blurhash
      const blurhash = await encodeBrowserThumbHash(file)
      updateFileField(key, 'blurhash', blurhash)

      // HEIC 格式转换
      updateFileProgress(key, 15, '准备上传中')
      let uploadFileObj: File = file
      const fileName = file.name.split('.').slice(0, -1).join('.')
      if (await isHeic(file)) {
        updateFileProgress(key, 18, '转换 HEIC 格式中')
        const outputBuffer: Blob | Blob[] = await heicTo({
          blob: file,
          type: 'image/jpeg',
        })
        uploadFileObj = new File([outputBuffer], fileName + '.jpg', { type: 'image/jpeg' })
      }

      // 上传原图
      updateFileProgress(key, 20, '上传原图中')
      const originRes = await uploadFile(
        uploadFileObj,
        album,
        storageConfig.storage,
        storageConfig.alistMountPath,
        {
          onProgress: (p: number) => {
            updateFileProgress(key, 20 + (p * 0.35), '上传原图中')
          },
          onStageChange: (stage: string) => {
            updateFileProgress(key, file.uploadProgress || 20, stage)
          },
        }
      )

      if (originRes?.code === 200) {
        updateFileField(key, 'url', originRes.data?.url)
        updateFileField(key, 'imageId', originRes.data?.imageId)
        if (originRes.data?.key) updateFileField(key, 'originalKey', originRes.data.key)
      } else {
        throw new Error('Original image upload failed')
      }

      // 压缩并上传预览图
      updateFileProgress(key, 60, '压缩预览图中')
      const previewType = album === '/' ? '/preview' : album + '/preview'
      const previewRes = await uploadPreviewImage(
        file,
        previewType,
        {
          storage: storageConfig.storage,
          alistMountPath: storageConfig.alistMountPath,
          previewCompressQuality,
          previewImageMaxWidthLimitSwitchOn,
          previewImageMaxWidthLimit,
          configs,
          onProgress: (p: number) => {
            updateFileProgress(key, 60 + (p * 0.35), '上传预览图中')
          },
          onStageChange: (stage: string) => {
            updateFileProgress(key, file.uploadProgress || 60, stage)
          },
        }
      )

      updateFileField(key, 'previewUrl', previewRes.url)
      if (previewRes.key) updateFileField(key, 'previewKey', previewRes.key)

      updateFileProgress(key, 100, '完成')
      updateFileField(key, 'isUploaded', true)
    } catch (e) {
      console.error('Process file error:', e)
      updateFileProgress(key, 0, '处理失败')
      message.error(t('Upload.fileUploadFailed', { name: file.name }))
    } finally {
      updateFileField(key, 'isUploading', false)
    }
  }, [album, storageConfig.storage, storageConfig.alistMountPath, previewCompressQuality, previewImageMaxWidthLimitSwitchOn, previewImageMaxWidthLimit, configs, updateFileField, updateFileProgress, t])

  // 保持 ref 与最新 processFile 同步
  processFileRef.current = processFile

  // 计算总进度
  useEffect(() => {
    if (files.length === 0) {
      setTotalProgress(0)
      return
    }
    const total = files.reduce((sum, f) => sum + (f.uploadProgress || 0), 0)
    setTotalProgress(Math.round(total / files.length))
  }, [files])

  // 删除文件
  const removeFile = useCallback((key: string) => {
    const file = files.find(f => f.__key === key)
    if (file?.originalKey && storageConfig.storage) {
      // Delete from storage
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: storageConfig.storage, key: file.originalKey })
      }).catch(() => {})
    }
    if (file?.previewKey && storageConfig.storage) {
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: storageConfig.storage, key: file.previewKey })
      }).catch(() => {})
    }
    setFiles(prev => prev.filter(f => f.__key !== key))
  }, [files, storageConfig.storage])

  // 删除所有文件
  const removeAllFiles = useCallback(() => {
    // Delete all uploaded files from storage
    files.forEach(file => {
      if (file.originalKey && storageConfig.storage) {
        fetch('/api/v1/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage: storageConfig.storage, key: file.originalKey })
        }).catch(() => {})
      }
      if (file.previewKey && storageConfig.storage) {
        fetch('/api/v1/file/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ storage: storageConfig.storage, key: file.previewKey })
        }).catch(() => {})
      }
    })
    setFiles([])
    setBatchLabels([])
    setBatchExif({})
  }, [files, storageConfig.storage])

  // 切换文件展开
  const toggleFileExpanded = useCallback((key: string) => {
    setExpandedFileKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(key)) {
        newSet.delete(key)
      } else {
        newSet.add(key)
      }
      return newSet
    })
  }, [])

  // 应用批量 EXIF
  const applyBatchExif = useCallback(() => {
    setFiles(prev => prev.map(f => {
      const newFile = Object.create(f) as UploadFile
      Object.assign(newFile, f)
      newFile.exif = { ...(f.exif || {}), ...batchExif }
      return newFile
    }))
    message.success(t('Upload.batchExifApplied'))
  }, [batchExif, t])

  // 应用批量标签
  const applyBatchLabels = useCallback(() => {
    setFiles(prev => prev.map(f => {
      const currentLabels = Array.isArray(f.labels) ? f.labels : []
      const newLabels = [...currentLabels]
      batchLabels.forEach(tag => {
        if (!newLabels.includes(tag)) newLabels.push(tag)
      })
      return { ...f, labels: newLabels }
    }))
    message.success(t('Upload.batchLabelsApplied'))
  }, [batchLabels, t])

  // 应用参考 EXIF 到文件
  const applyReferenceExifToFile = useCallback(async (refFile: File, targetKey: string) => {
    try {
      const { tags, exif: exifInfo } = await exifDataHookRef.current.loadExifData(refFile)
      setFiles(prev => prev.map(f => {
        if (f.__key === targetKey) {
          return {
            ...f,
            exif: { ...(f.exif || {}), ...exifInfo },
            lat: tags?.GPSLatitude?.description || f.lat,
            lon: tags?.GPSLongitude?.description || f.lon,
          }
        }
        return f
      }))
      message.success(t('Upload.referenceExifToastSuccess'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      message.error(t('Upload.referenceExifToastError'))
    }
  }, [t])

  // 提交单个文件
  const submitSingleFile = useCallback(async (file: UploadFile): Promise<boolean> => {
    if (!file.width || !file.height || file.width <= 0 || file.height <= 0) {
      message.error(t('Tips.imageSizeMissing', { name: file.name }))
      return false
    }

    // Verify URL accessibility
    const originOk = file.url ? await verifyUrlAccessible(file.url) : false
    let previewOk = true
    if (file.previewUrl) {
      previewOk = await verifyUrlAccessible(file.previewUrl)
    }

    if (!originOk || !previewOk) {
      message.error(t('Tips.remoteOriginOrPreviewMissing', { name: file.name }))
      return false
    }

    const labels = Array.isArray(file.labels) ? [...file.labels] : []
    // Add batch labels
    batchLabels.forEach(tag => {
      if (!labels.includes(tag)) labels.push(tag)
    })
    // Add cascader labels
    if (tagManagementRef.current.primarySelect && !labels.includes(tagManagementRef.current.primarySelect)) labels.push(tagManagementRef.current.primarySelect)
    tagManagementRef.current.secondarySelect?.forEach(s => {
      if (!labels.includes(s)) labels.push(s)
    })

    const tagCategoryMap: Record<string, string> = {}
    if (tagManagementRef.current.primarySelect && tagManagementRef.current.secondarySelect && tagManagementRef.current.secondarySelect.length > 0) {
      tagManagementRef.current.secondarySelect.forEach(s => { tagCategoryMap[s] = tagManagementRef.current.primarySelect! })
    }

    const data: Partial<ImageType> & { tagCategoryMap?: Record<string, string>; client_image_id?: string } = {
      album,
      url: file.url || '',
      client_image_id: file.imageId,
      image_name: file.name,
      title: '',
      preview_url: file.previewUrl,
      video_url: '',
      blurhash: file.blurhash,
      exif: { ...(file.exif || {}), ...batchExif } as any,
      labels,
      detail: '',
      width: file.width || 0,
      height: file.height || 0,
      type: 1,
      lat: Number(file.lat) || 0,
      lon: Number(file.lon) || 0,
      tagCategoryMap: Object.keys(tagCategoryMap).length ? tagCategoryMap : undefined,
    }

    // Check for duplicates
    const dupRes = await checkDuplicate(file.blurhash, file.url)
    if (dupRes) {
      const ok = await new Promise<boolean>((resolve) => {
        modal.confirm({
          title: t('Upload.duplicateImageTitle'),
          content: t('Upload.duplicateImageContentWithName', { name: file.name }),
          okText: t('Upload.duplicateImageAsNew'),
          cancelText: t('Button.canal'),
          onOk: () => resolve(true),
          onCancel: () => resolve(false),
        })
      })
      if (!ok) return false
      // 作为新图片上传，跳过幂等检查
      ;(data as any).force_new = true
    }

    const res = await fetchWithTimeout('/api/v1/images/add', {
      headers: { 'Content-Type': 'application/json' },
      method: 'post',
      body: JSON.stringify(data),
    }, 15000).then(r => r.json())

    return res?.code === 200
  }, [album, batchExif, batchLabels, modal, t])

  // 处理提交
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      if (album === '') {
        message.warning(t('Tips.selectAlbumFirst'))
        setIsSubmitting(false)
        return
      }

      if (files.length === 0) {
        message.warning(t('Upload.noFilesSelected'))
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
        message.success(t('Upload.batchSubmitSuccess', { success: successCount, fail: failCount }))
        // Clear files after successful submission
        setFiles([])
        setBatchLabels([])
        setBatchExif({})
        tagManagementRef.current.clearTags()
      } else {
        message.error(t('Upload.batchSubmitFailed'))
      }
    } catch (e) {
      console.error(e)
      message.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }, [album, files, submitSingleFile, t])

  // 处理上传选中文件并提交
  const handleUploadSelectedAndSubmit = useCallback(async () => {
    setShowMissingModal(false)
    const toUpload = missingFiles.filter(f => f.__key && missingSelection[f.__key])

    for (const file of toUpload) {
      await processFile(file)
    }

    // Then submit all
    await handleSubmit()
  }, [missingFiles, missingSelection, processFile, handleSubmit])

  // 处理跳过并提交
  const handleSkipAndSubmit = useCallback(async () => {
    setShowMissingModal(false)
    await handleSubmit()
  }, [handleSubmit])

  return (
    <div className="admin-upload flex flex-col space-y-4 h-full flex-1 font-sans text-sm">
      {/* 顶部控制 */}
      <div className="rounded-lg border border-border bg-background-alt p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectStorage')} *
            </label>
            <Select
              value={storageConfig.storage || undefined}
              onChange={(value: string) => storageConfig.handleStorageChange(value)}
              placeholder={t('Upload.selectStorage')}
              className="w-full"
              options={storageConfig.storages}
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
              options={albums?.filter((a: AlbumType) => a.album_value != null).map((a: AlbumType) => ({ label: a.name, value: a.album_value }))}
            />
          </div>

          {storageConfig.storage === 'alist' && storageConfig.isStorageSelect && storageConfig.alistStorage?.length > 0 && (
            <div className="w-full sm:flex-1">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                {t('Upload.selectAlistDirectory')} *
              </label>
              <Select
                value={storageConfig.alistMountPath || undefined}
                onChange={storageConfig.handleAlistMountPathChange}
                placeholder={t('Upload.selectAlistDirectory')}
                className="w-full"
                options={storageConfig.alistStorage?.filter((s) => s?.mount_path != null).map((s) => ({ label: s?.mount_path, value: s?.mount_path }))}
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
              disabled={files.length === 0 || album === '' || storageConfig.storage === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')}
              style={{
                backgroundColor: token.colorPrimary,
                borderColor: token.colorPrimary,
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              {isSubmitting ? t('Upload.submitting') : t('Button.submit')}
            </AntButton>
          </div>
        </div>

        {/* 全局进度 */}
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
              strokeColor={token.colorPrimary}
              size={8}
              showInfo={false}
            />
          </div>
        )}
      </div>

      {/* 批量编辑面板 */}
      {showBatchEdit && files.length > 0 && (
        <div className="rounded-lg border border-border bg-background-alt p-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-text-primary">{t('Upload.batchEditTitle')}</h3>
            <AntButton type="text" icon={<CloseOutlined />} onClick={() => setShowBatchEdit(false)} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* 批量 EXIF */}
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
                    options={exifPresets.presets.cameraModels.map((m: string) => ({ label: m, value: m }))}
                    allowClear
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifApertureLabel')}</label>
                  <AntInput
                    value={batchExif.f_number?.toString() || ''}
                    onChange={(e) => setBatchExif({ ...batchExif, f_number: parseFloat(e.target.value) || null })}
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
                  <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifIsoLabel')}</label>
                  <AntInput
                    value={batchExif.iso_speed_rating?.toString() || ''}
                    onChange={(e) => setBatchExif({ ...batchExif, iso_speed_rating: parseInt(e.target.value) || null })}
                    placeholder={t('Upload.input')}
                  />
                </div>
              </div>
              <AntButton className="mt-3" size="small" onClick={applyBatchExif}>
                {t('Upload.applyToAll')}
              </AntButton>
            </div>

            {/* 批量标签 */}
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
                        backgroundColor: isSelected ? token.colorPrimary : undefined,
                        color: isSelected ? token.colorBgBase : undefined,
                      }}
                      onClick={() => {
                        const existingIndex = batchLabels.findIndex(t => t.trim().toLowerCase() === tag.trim().toLowerCase())
                        if (existingIndex >= 0) {
                          setBatchLabels(batchLabels.filter((_, i) => i !== existingIndex))
                        } else {
                          const newLabels = [...batchLabels, tag.trim()]
                          const uniqueLabels = Array.from(new Set(newLabels.map(v => v.trim()))).filter(Boolean)
                          setBatchLabels(uniqueLabels)
                        }
                      }}
                    >
                      {tag}
                    </AntTag>
                  )
                })}
              </div>
              <Select
                mode="tags"
                value={batchLabels}
                options={presetTags.filter(Boolean).map((s: string) => ({ label: s, value: s }))}
                placeholder={t('Upload.addCustomTags')}
                onChange={(vals: string[] | string | undefined) => {
                  const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                  const cleanedVals = arrVals.filter((v) => v && typeof v === 'string' && v.trim() !== '')
                  const uniqueVals = Array.from(new Set(cleanedVals.map(v => v.trim()))).filter(Boolean)
                  setBatchLabels(uniqueVals)
                }}
                style={{ width: '100%' }}
              />
              <AntButton className="mt-3" size="small" onClick={applyBatchLabels}>
                {t('Upload.applyToAll')}
              </AntButton>
            </div>
          </div>
        </div>
      )}

      {/* 缺失文件弹窗 */}
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

      {/* 主内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 左侧：上传区域 */}
        <div className="lg:col-span-1">
          <AntCard className="h-full" title={t('Upload.uploadFilesCardTitle')}>
            <Dragger
              multiple={true}
              disabled={storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')}
              beforeUpload={() => false}
              showUploadList={false}
              style={{
                padding: 24,
                minHeight: 200,
                border: `2px dashed ${token.colorBorder}`,
                borderRadius: '12px',
                backgroundColor: token.colorBgContainer,
              }}
              onChange={(info) => {
                const fileList = info.fileList || []
                const selected = fileList
                  .map(f => f.originFileObj as UploadFile | undefined)
                  .filter((f): f is UploadFile => Boolean(f))
                  .map((orig) => {
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
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                </div>
                <p style={{ fontWeight: 600, color: token.colorText }}>{t('Upload.dragOrClickMultiple')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTipsMultiple')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.maxFilesLimit', { count: maxUploadFiles })}</p>
                {(storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')) && (
                  <p className="text-text-muted text-sm">
                    {t(storageConfig.storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
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
                          <div style={{ width: 32, height: 32, borderRadius: 4, backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <UploadOutlined style={{ fontSize: 16, color: token.colorPrimary }} />
                          </div>
                          <div className="min-w-0">
                            <div style={{ fontWeight: 500, color: token.colorText, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 150 }}>
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
                          strokeColor={token.colorPrimary}
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

        {/* 右侧：文件详情 */}
        <div className="lg:col-span-2">
          <AntCard className="h-full" title={t('Upload.fileDetailsCardTitle')}>
            {files.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 256, color: token.colorTextTertiary }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                  <UploadOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                </div>
                <p style={{ fontSize: 14 }}>{t('Upload.noFiles')}</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {files.map((file) => (
                  <div
                    key={file.__key}
                    className="border border-border rounded-lg overflow-hidden"
                  >
                    {/* 文件头部 */}
                    <div
                      className="p-4 bg-background-alt flex items-center justify-between cursor-pointer"
                      onClick={() => file.__key && toggleFileExpanded(file.__key)}
                    >
                      <div className="flex items-center gap-3">
                        {expandedFileKeys.has(file.__key!) ? <UpOutlined /> : <DownOutlined />}
                        <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <UploadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 500, color: token.colorText }}>{file.name}</div>
                          <div style={{ fontSize: 14, color: token.colorTextSecondary }}>
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

                    {/* 展开内容 */}
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
                                options={exifPresets.presets.cameraModels.map((m: string) => ({ label: m, value: m }))}
                                allowClear
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifApertureLabel')}</label>
                              <AntInput
                                value={file.exif?.f_number?.toString() || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), f_number: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                                size="small"
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
                                size="small"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifIsoLabel')}</label>
                              <AntInput
                                value={file.exif?.iso_speed_rating?.toString() || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), iso_speed_rating: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                                size="small"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifFocalLengthLabel')}</label>
                              <AntInput
                                value={file.exif?.focal_length?.toString() || ''}
                                onChange={(e) => {
                                  if (file.__key) {
                                    updateFileField(file.__key, 'exif', { ...(file.exif || {}), focal_length: e.target.value })
                                  }
                                }}
                                placeholder={t('Upload.input')}
                                size="small"
                              />
                            </div>
                            <div>
                              <label className="block text-xs text-text-secondary mb-1">{t('Upload.exifShootDateLabel')}</label>
                              <AntDatePicker
                                style={{ width: '100%' }}
                                showTime
                                locale={zhCN}
                                value={file.exif?.data_time && typeof file.exif.data_time === 'string' ? dayjs(file.exif.data_time) : undefined}
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

                        {/* 标签 */}
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
                                    backgroundColor: isSelected ? token.colorPrimary : undefined,
                                    color: isSelected ? token.colorBgBase : undefined,
                                  }}
                                  onClick={() => {
                                    if (!file.__key) return
                                    const currentLabels = Array.isArray(file.labels) ? [...file.labels] : []
                                    const existingIndex = currentLabels.findIndex(t => t.trim().toLowerCase() === tag.trim().toLowerCase())
                                    let newLabels: string[]
                                    if (existingIndex >= 0) {
                                      newLabels = currentLabels.filter((_, i) => i !== existingIndex)
                                    } else {
                                      newLabels = Array.from(new Set([...currentLabels, tag.trim()])).filter(Boolean)
                                    }
                                    updateFileField(file.__key, 'labels', newLabels)
                                  }}
                                >
                                  {tag}
                                </AntTag>
                              )
                            })}
                          </div>
                          <Select
                            mode="tags"
                            value={(file.labels || []) as string[]}
                            options={presetTags.filter(Boolean).map((s: string) => ({ label: s, value: s }))}
                            placeholder={t('Upload.addCustomTags')}
                            onChange={(vals: string[] | string | undefined) => {
                              if (!file.__key) return
                              const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                              const cleanedVals = arrVals.filter((v) => v && typeof v === 'string' && v.trim() !== '')
                              const uniqueVals = Array.from(new Set(cleanedVals.map(v => v.trim()))).filter(Boolean)
                              updateFileField(file.__key, 'labels', uniqueVals)
                            }}
                            style={{ width: '100%' }}
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
    </div>
  )
}
