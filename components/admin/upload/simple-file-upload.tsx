'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { toast } from 'sonner'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType, ImageType } from '~/types'
import { App as AntApp, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, AutoComplete as AntAutoComplete, Tag as AntTag, Card as AntCard, Space as AntSpace, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, Select } from 'antd'
import MultipleSelector from '~/components/ui/origin/multiselect'
import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'

// 导入我们新创建的自定义 Hooks 和工具函数
import { useStorageConfig } from '~/hooks/useStorageConfig'
import { useTagManagement } from '~/hooks/useTagManagement'
import { useExifData } from '~/hooks/useExifData'
import { useExifPresets } from '~/hooks/useExifPresets'
import { useFileUpload } from '~/hooks/useFileUpload'
import { verifyUrlAccessible, fetchWithTimeout, checkDuplicate } from '~/lib/utils/uploadUtils'
import { getImageDimensions, applyReferenceExif } from '~/lib/utils/exifUtils'
import { UploadIcon } from '~/components/icons/upload'

const { Dragger } = AntUpload

interface TagNode {
  category: string
  children: { name: string }[]
}

export default function SimpleFileUpload() {
  dayjs.locale('zh-cn')
  const { modal } = AntApp.useApp()
  const t = useTranslations()
  const referenceInputRef = useRef<HTMLInputElement>(null)

  // 使用自定义 Hooks
  const storageConfig = useStorageConfig()
  const tagManagement = useTagManagement()
  const exifDataHook = useExifData()
  const exifPresets = useExifPresets()

  // 相册和配置数据
  const { data: albums } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const [album, setAlbum] = useState('')
  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [imageId, setImageId] = useState('')
  const [imageName, setImageName] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [originalKey, setOriginalKey] = useState<string>('')
  const [previewKey, setPreviewKey] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hash, setHash] = useState('')
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detail, setDetail] = useState('')
  const [autoUploadedFor, setAutoUploadedFor] = useState<string | null>(null)
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [files, setFiles] = useState<File[]>([])

  // 初始化上传 Hook
  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const previewImageMaxWidthLimitSwitchOn = configs?.find(config => config.config_key === 'preview_max_width_limit_switch')?.config_value === '1'
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')
  
  const fileUploadHook = useFileUpload({
    album,
    storage: storageConfig.storage,
    alistMountPath: storageConfig.alistMountPath,
    previewCompressQuality,
    previewImageMaxWidthLimitSwitchOn,
    previewImageMaxWidthLimit,
    onProgress: (progress, stage) => {
    },
    onSuccess: (result) => {
      setUrl(result.url)
      setPreviewUrl(result.previewUrl)
      setImageId(result.imageId)
      setImageName(result.fileName)
      setOriginalKey(result.originalKey || '')
      setPreviewKey(result.previewKey || '')
    },
    onError: (error) => {
      console.error(error)
      toast.error(t('Upload.uploadError'))
    }
  })

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

  // 应用参考 EXIF
  const handleApplyReferenceExif = useCallback(async (file: File) => {
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
  }, [])

  // 处理提交
  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true)
    try {
      if (!url || url === '') {
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

      const labels = [...tagManagement.labels]

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

      if (tagManagement.primarySelect && tagManagement.secondarySelect && tagManagement.secondarySelect.length > 0) {
        const tagCategoryMap: Record<string, string> = {}
        tagManagement.secondarySelect.forEach(s => { tagCategoryMap[s] = tagManagement.primarySelect! })
        data.tagCategoryMap = tagCategoryMap
      }

      // 检查 URL 可访问性
      if (url) {
        const originOk = await verifyUrlAccessible(url)
        let previewUrlOk = true
        if (previewUrl) {
          previewUrlOk = await verifyUrlAccessible(previewUrl)
        }

        if (!originOk || !previewUrlOk) {
          if (files && files.length > 0) {
            try {
              await uploadFileWithRetry(files[0], imageId || undefined)
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

      // 检查重复
      const isDuplicate = await checkDuplicate(hash, url)
      if (isDuplicate) {
        const shouldContinue = await new Promise<boolean>((resolve) => {
          modal.confirm({
            title: t('Upload.duplicateImageTitle'),
            content: t('Upload.duplicateImageContent'),
            okText: t('Upload.duplicateImageContinue'),
            cancelText: t('Button.canal'),
            onOk: () => resolve(true),
            onCancel: () => resolve(false),
          })
        })
        if (!shouldContinue) {
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
    }
  }, [url, album, height, width, title, previewUrl, videoUrl, hash, exif, lat, lon, detail, imageId, imageName, originalKey, previewKey, tagManagement, files])

  // 辅助函数
  const uploadFileWithRetry = async (file: File, existingImageId?: string) => {
    try {
      const result = await fileUploadHook.upload(file, existingImageId)
      return result
    } catch (e) {
      console.error(e)
      throw e
    }
  }

  const onRemoveFile = useCallback(() => {
    // 清理文件相关状态
    if (originalKey && storageConfig.storage) {
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: storageConfig.storage, key: originalKey })
      }).catch(() => {})
    }
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
    tagManagement.clearTags()
    setFiles([])
  }, [originalKey, storageConfig.storage, tagManagement])

  const onBeforeUpload = useCallback(() => {
    setTitle('')
    setImageId('')
    setImageName('')
    setPreviewUrl('')
    setVideoUrl('')
    tagManagement.clearTags()
  }, [tagManagement])

  // 文件选择处理
  const handleFileSelection = useCallback(async (file: File) => {
    onBeforeUpload()
    try {
      const { exif: exifInfo, lat: exifLat, lon: exifLon, width: imgWidth, height: imgHeight } = await exifDataHook.loadExifData(file)
      setExif(exifInfo)
      setLat(exifLat)
      setLon(exifLon)
      setWidth(imgWidth)
      setHeight(imgHeight)
      
      const blurhash = await encodeBrowserThumbHash(file)
      setHash(blurhash)
      
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreviewUrl(typeof e.target?.result === 'string' ? e.target.result : '')
      }
      reader.readAsDataURL(file)
      
      if (album && storageConfig.storage) {
        await uploadFileWithRetry(file)
      }
    } catch (error) {
      console.error(error)
      toast.error(t('Upload.uploadError'))
    }
  }, [album, storageConfig.storage, exifDataHook, onBeforeUpload])

  // 当文件选择变化时
  React.useEffect(() => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    
    if (autoUploadedFor === file.name) return

    let cancelled = false
    ;(async () => {
      try {
        if (!cancelled) {
          await handleFileSelection(file)
          setAutoUploadedFor(file.name)
        }
      } catch (e) {
        console.error(e)
      }
    })()

    return () => { cancelled = true }
  }, [files, handleFileSelection, autoUploadedFor])

  return (
    <div className="admin-upload flex flex-col space-y-4 h-full flex-1 font-sans text-sm">
      {/* 顶部控制区域 */}
      <div className="rounded-lg border border-border bg-background-alt p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectStorage')} *
            </label>
            <Select
              value={storageConfig.storage || undefined}
              onChange={(value: string) => {
                storageConfig.handleStorageChange(value)
              }}
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
              options={albums?.map((a: AlbumType) => ({ label: a.name, value: a.album_value }))}
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
                options={storageConfig.alistStorage?.map((s) => ({ label: s?.mount_path, value: s?.mount_path }))}
              />
            </div>
          )}

          <div className="w-full sm:w-auto sm:ml-auto flex items-end">
            <AntButton
              className="h-10 px-6 flex items-center justify-center w-full sm:w-auto"
              size="middle"
              type="primary"
              loading={isSubmitting || fileUploadHook.isUploading}
              onClick={async () => {
                if (fileUploadHook.isUploading) return
                try {
                  if (files.length > 0 && (!url || url === '')) {
                    await uploadFileWithRetry(files[0], imageId || undefined)
                  }
                  await handleSubmit()
                } catch (e) {
                  console.error(e)
                }
              }}
              disabled={(files.length === 0 && (!url || url === '')) || album === '' || storageConfig.storage === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '') || fileUploadHook.isUploading}
              style={{
                backgroundColor: 'var(--primary)',
                borderColor: 'var(--primary)',
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              {fileUploadHook.isUploading ? t('Upload.uploading') : t('Button.submit')}
            </AntButton>
          </div>
        </div>
      </div>

      {/* 未上传文件提示弹窗 */}
      <AntModal
        title={t('Upload.fileNotUploadedTitle')}
        open={showMissingModal}
        onCancel={() => setShowMissingModal(false)}
        footer={[
          <AntButton key="cancel" onClick={() => setShowMissingModal(false)}>{t('Button.canal')}</AntButton>,
          <AntButton key="upload" type="primary" onClick={async () => {
            setShowMissingModal(false)
            if (files.length === 0) return
            try {
              setIsSubmitting(true)
              await uploadFileWithRetry(files[0], imageId || undefined)
              await handleSubmit()
            } catch (e) {
              console.error(e)
              toast.error(t('Upload.uploadError'))
            } finally {
              setIsSubmitting(false)
            }
          }}>{t('Upload.uploadAndSubmit')}</AntButton>,
        ]}
      >
        <div>{t('Upload.singleFileNotUploadedBody')}</div>
      </AntModal>

      {/* 主内容区域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        {/* 左侧：上传区域 */}
        <div className="h-full">
          <AntCard className="h-full" title={t('Upload.uploadFilesCardTitle')}>
            <Dragger
              multiple={false}
              disabled={storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')}
              beforeUpload={() => false}
              showUploadList={false}
              style={{
                padding: 24,
                minHeight: 200,
                height: '100%',
                border: '2px dashed var(--border)',
                borderRadius: '12px',
                backgroundColor: 'var(--background)',
              }}
              onChange={(info) => {
                const fileList = info.fileList || []
                const last = fileList.length > 0 ? (fileList[fileList.length - 1].originFileObj as File) : undefined
                if (last) {
                  if (!last.__key) {
                    (last as any).__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                  }
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
                {(storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')) && (
                  <p className="text-text-muted text-sm">
                    {t(storageConfig.storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                  </p>
                )}
              </div>
            </Dragger>

            {/* 上传进度 */}
            {fileUploadHook.uploadProgress > 0 && (
              <div className="mt-4 pt-4 border-t">
                {fileUploadHook.uploadStage && (
                  <div className="text-sm text-text-secondary mb-3 font-medium">{fileUploadHook.uploadStage}</div>
                )}
                <AntProgress
                  percent={Math.round(fileUploadHook.uploadProgress)}
                  status="active"
                  strokeColor="var(--primary)"
                  strokeWidth={8}
                  showInfo={false}
                  className="mb-2"
                />
                <div className="text-sm text-text-secondary">
                  {Math.round(fileUploadHook.uploadProgress)}%
                </div>
              </div>
            )}

            {/* EXIF 编辑区域 */}
            <div className="mt-6 pt-4 border-t">
              <div className="text-sm font-medium mb-3">{t('Upload.exifInfoPartiallyMissingHint')}</div>
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <AntButton type="default" onClick={() => referenceInputRef.current?.click()}>
                  {t('Upload.referenceExifExtractButton')}
                </AntButton>
                <input
                  ref={referenceInputRef}
                  type="file"
                  accept="image/*,.cr2,.arw,.nef,.tif,.tiff,.dng"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      handleApplyReferenceExif(file)
                    }
                    e.target.value = ''
                  }}
                />
              </div>

              <AntForm layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <AntForm.Item
                    label={t('Upload.exifCameraModelLabel')}
                    extra={<a onClick={() => {
                      exifPresets.setEditingText({
                        cameraModels: exifPresets.presets.cameraModels.join(', '),
                        shutterSpeeds: exifPresets.presets.shutterSpeeds.join(', '),
                        isos: exifPresets.presets.isos.join(', '),
                        apertures: exifPresets.presets.apertures.join(', '),
                      })
                      exifPresets.openModal()
                    }}>{t('Upload.manageCommonExifOptionsLink')}</a>}
                  >
                    <div>
                      <MultipleSelector
                        value={exif?.model ? [{ value: String(exif.model), label: String(exif.model) }] : []}
                        options={exifPresets.presets.cameraModels.map((m: string) => ({ value: m, label: m }))}
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
                        options={exifPresets.presets.apertures.map((a: string) => ({ label: a, value: a }))}
                      />
                      <AntInput
                        value={exif?.f_number || ''}
                        onChange={(e) => setExif({ ...(exif || {}), f_number: e.target.value })}
                        placeholder={t('Upload.orManualInputPlaceholder')}
                      />
                    </div>
                  </AntForm.Item>

                  <AntForm.Item label={t('Upload.exifShutterLabel')}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Select
                        value={exif?.exposure_time || undefined}
                        onChange={(v) => setExif({ ...(exif || {}), exposure_time: v })}
                        placeholder={t('Upload.exifCommonShutterPlaceholder')}
                        className="min-w-[120px]"
                        options={exifPresets.presets.shutterSpeeds.map((s: string) => ({ label: s, value: s }))}
                      />
                      <AntInput
                        value={exif?.exposure_time || ''}
                        onChange={(e) => setExif({ ...(exif || {}), exposure_time: e.target.value })}
                        placeholder={t('Upload.orManualInputPlaceholder')}
                      />
                    </div>
                  </AntForm.Item>

                  <AntForm.Item label="ISO">
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Select
                        value={exif?.iso_speed_rating || undefined}
                        onChange={(v) => setExif({ ...(exif || {}), iso_speed_rating: v })}
                        placeholder={t('Upload.exifCommonIsoPlaceholder')}
                        className="min-w-[120px]"
                        options={exifPresets.presets.isos.map((i: string) => ({ label: i, value: i }))}
                      />
                      <AntInput
                        value={exif?.iso_speed_rating || ''}
                        onChange={(e) => setExif({ ...(exif || {}), iso_speed_rating: e.target.value })}
                        placeholder={t('Upload.orManualInputPlaceholder')}
                      />
                    </div>
                  </AntForm.Item>

                  <AntForm.Item label={t('Upload.exifFocalLengthLabel')}>
                    <AntInput
                      value={exif?.focal_length || ''}
                      onChange={(e) => setExif({ ...(exif || {}), focal_length: e.target.value })}
                    />
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

        {/* 右侧：元数据表单 */}
        <div className="h-full">
          <div className="rounded-lg border border-border bg-background-alt h-full">
            <div className="p-4 border-t border-border">
              <h3 className="font-semibold text-text-primary">{t('Upload.metadataCardTitle')}</h3>
            </div>
            <div className="p-4 space-y-4">
              {/* 地址和尺寸 */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.addressAndSizeHeading')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.title')}</label>
                    <AntInput
                      value={title}
                      placeholder={t('Upload.inputTitle')}
                      onChange={(e) => setTitle(e.target.value)}
                      style={{ borderRadius: '8px', borderColor: 'var(--border)' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.url')}</label>
                    <AntInput disabled value={url} style={{ borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }} />
                    {!url && <p className="mt-2 text-xs text-error">{t('Upload.originNotUploadedHint')}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.previewUrl')}</label>
                    <AntInput disabled value={previewUrl} style={{ borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.width')}</label>
                      <AntInputNumber
                        disabled
                        value={width}
                        onChange={(val) => setWidth(Number(val) || 0)}
                        style={{ width: '100%', borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                      />
                      {!width && <p className="mt-2 text-xs text-error">{t('Tips.imageWidthRequired')}</p>}
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.height')}</label>
                      <AntInputNumber
                        disabled
                        value={height}
                        onChange={(val) => setHeight(Number(val) || 0)}
                        style={{ width: '100%', borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }}
                      />
                      {!height && <p className="mt-2 text-xs text-error">{t('Tips.imageHeightRequired')}</p>}
                    </div>
                  </div>
                </div>
              </div>

              {/* 位置 */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.locationHeading')}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.lon')}</label>
                    <AntInput disabled value={lon} onChange={(e) => setLon(e.target.value)} style={{ borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }} />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.lat')}</label>
                    <AntInput disabled value={lat} onChange={(e) => setLat(e.target.value)} style={{ borderRadius: '8px', borderColor: 'var(--border)', backgroundColor: 'var(--background)' }} />
                  </div>
                </div>
              </div>

              {/* 详情 */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.detail')}</h4>
                <div>
                  <label className="block text-sm text-text-secondary mb-2">{t('Upload.detail')}</label>
                  <AntInput
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    placeholder={t('Upload.inputDetail')}
                    style={{ borderRadius: '8px', borderColor: 'var(--border)' }}
                  />
                </div>
              </div>

              {/* 标签 */}
              <div>
                <h4 className="text-sm font-medium text-text-secondary mb-4">{t('Upload.tagsHeading')}</h4>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.presetTagsClickAddRemoveHint')}</label>
                    <div className="flex flex-wrap gap-2">
                      {presetTags.filter(Boolean).map((tag, i) => {
                        const isSelected = tagManagement.labels.includes(tag)
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
                            onClick={() => tagManagement.togglePresetTag(tag)}
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
                        value={tagManagement.primarySelect || undefined}
                        onChange={(v: string) => {
                          tagManagement.handleCascaderChange([v, ...tagManagement.secondarySelect])
                        }}
                        placeholder={t('Upload.tagCategoryPlaceholder')}
                        className="w-full"
                        options={tagTree.filter(Boolean).map((n) => ({ label: n.category ?? t('Upload.tagUncategorized'), value: n.category }))}
                        style={{ borderRadius: '8px', borderColor: 'var(--border)' }}
                      />
                      <MultipleSelector
                        value={(tagManagement.secondarySelect || []).map((s: string) => ({ value: s, label: s }))}
                        options={(tagTree.find((t) => String(t.category) === String(tagManagement.primarySelect))?.children || []).map((c: any) => ({ value: c.name, label: c.name }))}
                        placeholder={t('Upload.tagChildrenPlaceholderMultiple')}
                        onChange={(opts?: any) => {
                          const vals = (opts || []).map((o: any) => o.value)
                          tagManagement.handleCascaderChange([tagManagement.primarySelect || '', ...vals])
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.customTagsHeading')}</label>
                    <MultipleSelector
                      value={(tagManagement.labels.filter(Boolean) || []).map((s: string) => ({ value: s, label: s }))}
                      options={(presetTags || []).map((s: string) => ({ value: s, label: s }))}
                      creatable
                      placeholder={t('Upload.indexTag')}
                      onChange={(opts?: any) => tagManagement.handleLabelsChange((opts || []).map((o: any) => o.value))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文件列表 */}
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
                      <div className="text-sm text-text-secondary">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                  </div>
                  <div>
                    <AntButton
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      onClick={() => {
                        const k = (file && (file as any).__key) || file.name
                        if (k) {
                          onRemoveFile()
                        }
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

      {/* EXIF 预设管理弹窗 */}
      <AntModal
        title={t('Upload.exifPresetManagerTitle')}
        open={exifPresets.isModalOpen}
        onOk={() => {
          exifPresets.savePresets()
        }}
        onCancel={() => exifPresets.closeModal()}
        footer={[
          <AntButton key="cancel" onClick={() => exifPresets.closeModal()}>
            {t('Button.canal')}
          </AntButton>,
          <AntButton key="reset" onClick={() => exifPresets.resetPresets()}>
            {t('Button.reset')}
          </AntButton>,
          <AntButton key="save" type="primary" onClick={() => exifPresets.savePresets()}>
            {t('Button.save')}
          </AntButton>
        ]}
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('Upload.cameraModels')}</label>
            <AntInput.TextArea
              value={exifPresets.editingText.cameraModels}
              onChange={(e) => exifPresets.setEditingText({ ...exifPresets.editingText, cameraModels: e.target.value })}
              placeholder={t('Upload.cameraModelsPlaceholder')}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('Upload.shutterSpeeds')}</label>
            <AntInput.TextArea
              value={exifPresets.editingText.shutterSpeeds}
              onChange={(e) => exifPresets.setEditingText({ ...exifPresets.editingText, shutterSpeeds: e.target.value })}
              placeholder={t('Upload.shutterSpeedsPlaceholder')}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">ISO</label>
            <AntInput.TextArea
              value={exifPresets.editingText.isos}
              onChange={(e) => exifPresets.setEditingText({ ...exifPresets.editingText, isos: e.target.value })}
              placeholder={t('Upload.isosPlaceholder')}
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('Upload.apertures')}</label>
            <AntInput.TextArea
              value={exifPresets.editingText.apertures}
              onChange={(e) => exifPresets.setEditingText({ ...exifPresets.editingText, apertures: e.target.value })}
              placeholder={t('Upload.aperturesPlaceholder')}
              rows={3}
            />
          </div>
        </div>
      </AntModal>
    </div>
  )
}
