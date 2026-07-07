'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { message, theme } from 'antd'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType } from '~/types'
import { Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, Tag as AntTag, Card as AntCard, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, Select } from 'antd'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined, CheckCircleOutlined, ExclamationCircleOutlined, LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'
import { exifReader } from '~/lib/utils/file'

import { useStorageConfig } from '~/hooks/useStorageConfig'
import { useTagManagement } from '~/hooks/useTagManagement'
import { useExifData } from '~/hooks/useExifData'
import { useExifPresets } from '~/hooks/useExifPresets'
import { useFileUpload } from '~/hooks/useFileUpload'
import { verifyUrlAccessible, fetchWithTimeout, checkDuplicate } from '~/lib/utils/uploadUtils'
import { UploadOutlined } from '@ant-design/icons'

const { Dragger } = AntUpload

type PostUploadStatus = 'none' | 'verifying' | 'done' | 'error'

interface TagNode {
  category: string
  children: { name: string }[]
}

export default function SimpleFileUpload() {
  dayjs.locale('zh-cn')
  const { token } = theme.useToken()
  const t = useTranslations()
  const referenceInputRef = useRef<HTMLInputElement>(null)

  const storageConfig = useStorageConfig()
  const tagManagement = useTagManagement()
  const tagManagementRef = useRef(tagManagement)
  tagManagementRef.current = tagManagement
  const exifDataHook = useExifData()
  const exifDataHookRef = useRef(exifDataHook)
  exifDataHookRef.current = exifDataHook
  const exifPresets = useExifPresets()

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
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])
  const [files, setFiles] = useState<File[]>([])

  // 上传后状态
  const [postUploadStatus, setPostUploadStatus] = useState<PostUploadStatus>('none')
  const [originVerified, setOriginVerified] = useState<boolean | null>(null)
  const [previewVerified, setPreviewVerified] = useState<boolean | null>(null)
  const [isDuplicate, setIsDuplicate] = useState(false)

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
    onProgress: () => {},
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
      setPostUploadStatus('error')
    },
  })

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

  const handleApplyReferenceExif = useCallback(async (file: File) => {
    try {
      const { tags, exifObj } = await exifReader(file)
      setExif((prev) => ({ ...(prev || {}), ...exifObj }))
      setLat(tags?.GPSLatitude?.description || '')
      setLon(tags?.GPSLongitude?.description || '')
      message.success(t('Upload.referenceExifToastSuccess'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      message.error(t('Upload.referenceExifToastError'))
    }
  }, [t])

  // 提交成功后重置上传相关状态，保留 album 和存储配置供连续上传使用
  const resetAfterSubmit = useCallback(() => {
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
    setPostUploadStatus('none')
    setOriginVerified(null)
    setPreviewVerified(null)
    setIsDuplicate(false)
    tagManagementRef.current.clearTags()
    setFiles([])
    setAutoUploadedFor(null)
  }, [])

  // 上传 + 验证 + 入库的统一流程
  const handleUploadThenSubmit = useCallback(async (forceSubmit = false) => {
    if (fileUploadHook.isUploading || isSubmitting) return
    setIsSubmitting(true)
    try {
      // ① 上传（如果还没上传）
      let finalUrl = url
      let finalPreviewUrl = previewUrl
      let finalImageId = imageId
      let finalImageName = imageName

      if (files.length > 0 && !finalUrl) {
        const result = await fileUploadHook.upload(files[0], imageId || undefined)
        finalUrl = result.url
        finalPreviewUrl = result.previewUrl
        finalImageId = result.imageId
        finalImageName = result.fileName
      }

      // ② 基本校验
      if (!finalUrl) {
        message.error(t('Upload.uploadError'))
        setPostUploadStatus('error')
        return
      }
      if (!album) {
        message.warning(t('Tips.selectAlbumFirst'))
        return
      }
      if (!height || height <= 0) {
        message.warning(t('Tips.imageHeightRequired'))
        return
      }
      if (!width || width <= 0) {
        message.warning(t('Tips.imageWidthRequired'))
        return
      }

      // ③ 验证存储可访问性
      setPostUploadStatus('verifying')
      const [originOk, previewOk] = await Promise.all([
        verifyUrlAccessible(finalUrl),
        finalPreviewUrl ? verifyUrlAccessible(finalPreviewUrl) : Promise.resolve(true),
      ])
      setOriginVerified(originOk)
      setPreviewVerified(previewOk)
      setPostUploadStatus('done')

      // ④ 重复检测（非强制提交时）
      if (!forceSubmit) {
        const dup = await checkDuplicate(hash, finalUrl)
        if (dup) {
          setIsDuplicate(true)
          return
        }
      }

      // ⑤ 写库
      const labels = [...tagManagementRef.current.labels]
      const data: Record<string, unknown> = {
        album,
        url: finalUrl,
        client_image_id: finalImageId,
        image_name: finalImageName,
        title,
        preview_url: finalPreviewUrl,
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
      }

      if (tagManagementRef.current.primarySelect && tagManagementRef.current.secondarySelect && tagManagementRef.current.secondarySelect.length > 0) {
        const tagCategoryMap: Record<string, string> = {}
        tagManagementRef.current.secondarySelect.forEach(s => { tagCategoryMap[s] = tagManagementRef.current.primarySelect! })
        data.tagCategoryMap = tagCategoryMap
      }

      // 作为新图片上传（重复图片确认后），跳过幂等检查
      if (forceSubmit && isDuplicate) {
        data.force_new = true
      }

      const res = await fetchWithTimeout('/api/v1/images/add', {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify(data),
      }, 15000).then(r => r.json())

      if (res?.code === 200) {
        message.success(t('Tips.saveSuccess'))
        resetAfterSubmit()
      } else {
        message.error(t('Tips.saveFailed'))
      }
    } catch {
      setPostUploadStatus('error')
      message.error(t('Upload.uploadError'))
    } finally {
      setIsSubmitting(false)
    }
  }, [
    url, previewUrl, imageId, imageName, album, height, width,
    title, videoUrl, hash, exif, lat, lon, detail,
    files, fileUploadHook, isSubmitting, isDuplicate, resetAfterSubmit, t,
  ])

  const onRemoveFile = useCallback(() => {
    if (originalKey && storageConfig.storage) {
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: storageConfig.storage, key: originalKey }),
      }).catch(() => {})
    }
    if (previewKey && storageConfig.storage) {
      fetch('/api/v1/file/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ storage: storageConfig.storage, key: previewKey }),
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
    setPostUploadStatus('none')
    setOriginVerified(null)
    setPreviewVerified(null)
    setIsDuplicate(false)
    tagManagementRef.current.clearTags()
    setFiles([])
  }, [originalKey, previewKey, storageConfig.storage])

  const onBeforeUpload = useCallback(() => {
    setUrl('')
    setTitle('')
    setImageId('')
    setImageName('')
    setPreviewUrl('')
    setVideoUrl('')
    setHash('')
    setWidth(0)
    setHeight(0)
    setLat('')
    setLon('')
    setDetail('')
    setOriginalKey('')
    setPreviewKey('')
    setPostUploadStatus('none')
    setOriginVerified(null)
    setPreviewVerified(null)
    setIsDuplicate(false)
    tagManagementRef.current.clearTags()
  }, [])

  const handleFileSelection = useCallback(async (file: File) => {
    onBeforeUpload()
    try {
      const { exif: exifInfo, lat: exifLat, lon: exifLon, width: imgWidth, height: imgHeight } = await exifDataHookRef.current.loadExifData(file)
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
    } catch (error) {
      console.error(error)
      message.error(t('Upload.uploadError'))
    }
  }, [onBeforeUpload, t])

  React.useEffect(() => {
    if (!files || files.length === 0) return
    const file = files[0]
    if (!file) return
    const fileKey = (file as any).__key || file.name
    if (autoUploadedFor === fileKey) return

    let cancelled = false
    ;(async () => {
      try {
        if (!cancelled) {
          await handleFileSelection(file)
          setAutoUploadedFor(fileKey)
        }
      } catch (e) {
        console.error(e)
      }
    })()

    return () => { cancelled = true }
  }, [files, handleFileSelection, autoUploadedFor])

  const isUploading = fileUploadHook.isUploading
  const isBusy = isUploading || isSubmitting

  const btnText = isUploading
    ? t('Upload.uploading')
    : isSubmitting
      ? t('Upload.submitting')
      : isDuplicate
        ? t('Upload.duplicateImageAsNew')
        : t('Button.submit')

  // 文件行内联状态
  const renderFileStatus = () => {
    if (isUploading) {
      return (
        <div style={{ marginTop: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: token.colorTextSecondary, marginBottom: 4 }}>
            <LoadingOutlined style={{ color: token.colorPrimary }} />
            <span>{fileUploadHook.uploadStage || t('Upload.uploading')}</span>
          </div>
          <AntProgress
            percent={Math.round(fileUploadHook.uploadProgress)}
            status="active"
            strokeColor={token.colorPrimary}
            size={4}
            showInfo={false}
          />
          <div style={{ fontSize: 12, color: token.colorTextSecondary, marginTop: 2 }}>{Math.round(fileUploadHook.uploadProgress)}%</div>
        </div>
      )
    }

    if (postUploadStatus === 'verifying') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: token.colorTextSecondary, marginTop: 8 }}>
          <LoadingOutlined />
          <span>{t('Upload.verifyingStorage')}</span>
        </div>
      )
    }

    if (postUploadStatus === 'done') {
      const allOk = originVerified !== false && previewVerified !== false
      return (
        <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 500, color: allOk ? token.colorSuccess : token.colorWarning }}>
            {allOk
              ? <><CheckCircleOutlined /><span>{t('Upload.uploadedAndVerified')}</span></>
              : <><ExclamationCircleOutlined /><span>{t('Upload.uploadedWithPartialUnavailable')}</span></>
            }
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 12, color: token.colorTextSecondary }}>
            <span>{t('Upload.originalImage')} {originVerified === false ? <span style={{ color: token.colorError }}>✗</span> : <span style={{ color: token.colorSuccess }}>✓</span>}</span>
            <span>{t('Upload.previewImage')} {previewVerified === false ? <span style={{ color: token.colorError }}>✗</span> : <span style={{ color: token.colorSuccess }}>✓</span>}</span>
          </div>
          {isDuplicate && (
            <AntTag color="warning" icon={<ExclamationCircleOutlined />} style={{ marginTop: 4 }}>
              {t('Upload.duplicateImageContent')}
            </AntTag>
          )}
        </div>
      )
    }

    if (postUploadStatus === 'error') {
      return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: token.colorError, marginTop: 8 }}>
          <CloseCircleOutlined />
          <span>{t('Upload.uploadOrVerifyFailed')}</span>
        </div>
      )
    }

    return null
  }

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

          <div className="w-full sm:w-auto sm:ml-auto flex items-end">
            <AntButton
              className="h-10 px-6 flex items-center justify-center w-full sm:w-auto"
              size="middle"
              type="primary"
              loading={isBusy}
              onClick={() => handleUploadThenSubmit(isDuplicate)}
              disabled={
                (files.length === 0 && (!url || url === '')) ||
                album === '' ||
                storageConfig.storage === '' ||
                (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '') ||
                isBusy
              }
              style={{
                backgroundColor: isDuplicate ? token.colorWarning : token.colorPrimary,
                borderColor: isDuplicate ? token.colorWarning : token.colorPrimary,
                borderRadius: '8px',
                fontWeight: '500',
              }}
            >
              {btnText}
            </AntButton>
          </div>
        </div>
      </div>

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
                border: `2px dashed ${token.colorBorder}`,
                borderRadius: '12px',
                backgroundColor: token.colorBgContainer,
              }}
              onChange={(info) => {
                const fileList = info.fileList || []
                const last = fileList.length > 0 ? (fileList[fileList.length - 1].originFileObj as File) : undefined
                if (last) {
                  if (!(last as any).__key) {
                    (last as any).__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
                  }
                  setFiles([last])
                } else {
                  setFiles([])
                }
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 16 }}>
                <div style={{ width: 64, height: 64, borderRadius: '50%', backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <UploadOutlined style={{ fontSize: 32, color: token.colorPrimary }} />
                </div>
                <p style={{ fontWeight: 600, color: token.colorText }}>{t('Upload.dragOrClick')}</p>
                <p className="text-text-secondary text-sm">{t('Upload.uploadTipsSingle')}</p>
                {(storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')) && (
                  <p className="text-text-muted text-sm">
                    {t(storageConfig.storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                  </p>
                )}
              </div>
            </Dragger>

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
                      <Select
                        mode="tags"
                        value={exif?.model ? [String(exif.model)] : []}
                        options={exifPresets.presets.cameraModels.map((m: string) => ({ label: m, value: m }))}
                        placeholder={t('Upload.exifCameraModelManualPlaceholder')}
                        onChange={(vals: string[] | string | undefined) => {
                          const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                          const v = arrVals[arrVals.length - 1] || ''
                          setExif({ ...(exif || {}), model: v })
                        }}
                        style={{ width: '100%' }}
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
                        onChange={(e) => setExif({ ...(exif || {}), f_number: parseFloat(e.target.value) || null })}
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

                  <AntForm.Item label={t('Upload.exifIsoLabel')}>
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
                        onChange={(e) => setExif({ ...(exif || {}), iso_speed_rating: parseInt(e.target.value) || null })}
                        placeholder={t('Upload.orManualInputPlaceholder')}
                      />
                    </div>
                  </AntForm.Item>

                  <AntForm.Item label={t('Upload.exifFocalLengthLabel')}>
                    <AntInput
                      value={exif?.focal_length || ''}
                      onChange={(e) => setExif({ ...(exif || {}), focal_length: parseFloat(e.target.value) || null })}
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
                      style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.url')}</label>
                    <AntInput disabled value={url} style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }} />
                    {!url && files.length > 0 && <p className="mt-2 text-xs text-text-secondary">{t('Upload.originNotUploadedHint')}</p>}
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.previewUrl')}</label>
                    <AntInput disabled value={previewUrl.startsWith('data:') ? t('Upload.localPreview') : previewUrl} style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.width')}</label>
                      <AntInputNumber
                        disabled
                        value={width}
                        onChange={(val) => setWidth(Number(val) || 0)}
                        style={{ width: '100%', borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-text-secondary mb-2">{t('Upload.height')}</label>
                      <AntInputNumber
                        disabled
                        value={height}
                        onChange={(val) => setHeight(Number(val) || 0)}
                        style={{ width: '100%', borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }}
                      />
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
                    <AntInput disabled value={lon} onChange={(e) => setLon(e.target.value)} style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }} />
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.lat')}</label>
                    <AntInput disabled value={lat} onChange={(e) => setLat(e.target.value)} style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder, backgroundColor: token.colorBgContainer }} />
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
                    style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder }}
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
                        const isSelected = tagManagementRef.current.labels.includes(tag)
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
                              borderColor: isSelected ? token.colorPrimary : undefined,
                            }}
                            onClick={() => tagManagementRef.current.togglePresetTag(tag)}
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
                        value={tagManagementRef.current.primarySelect || undefined}
                        onChange={(v: string) => {
                          tagManagementRef.current.handleCascaderChange([v, ...tagManagementRef.current.secondarySelect])
                        }}
                        placeholder={t('Upload.tagCategoryPlaceholder')}
                        className="w-full"
                        options={tagTree.filter((n) => n && n.category != null).map((n) => ({ label: n.category ?? t('Upload.tagUncategorized'), value: n.category }))}
                        style={{ borderRadius: token.borderRadius, borderColor: token.colorBorder }}
                      />
                      <Select
                        mode="multiple"
                        value={(tagManagementRef.current.secondarySelect || []) as string[]}
                        options={(tagTree.find((t) => String(t.category) === String(tagManagementRef.current.primarySelect))?.children || []).filter((c: any) => c.name != null).map((c: any) => ({ label: c.name, value: c.name }))}
                        placeholder={t('Upload.tagChildrenPlaceholderMultiple')}
                        onChange={(vals: string[] | string | undefined) => {
                          const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                          tagManagementRef.current.handleCascaderChange([tagManagementRef.current.primarySelect || '', ...arrVals])
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.customTagsHeading')}</label>
                    <Select
                      mode="tags"
                      value={(tagManagementRef.current.labels.filter(Boolean) || []) as string[]}
                      options={(presetTags || []).filter(Boolean).map((s: string) => ({ label: s, value: s }))}
                      placeholder={t('Upload.indexTag')}
                      onChange={(vals: string[] | string | undefined) => {
                        const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                        tagManagementRef.current.handleLabelsChange(arrVals)
                      }}
                      style={{ width: '100%' }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 文件列表（含内联状态） */}
      {files.length > 0 && (
        <div className="w-full">
          <div className="rounded-lg border border-border bg-background-alt">
            <div className="p-4 border-b border-border">
              <h3 className="font-semibold text-text-primary">{t('Upload.selectedFiles')}</h3>
            </div>
            <div className="p-4">
              {files.map((file, index) => (
                <div key={((file as any).__key || file.name || index)} className="p-3 border border-border rounded-lg mb-3 bg-background">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <UploadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: token.colorText }}>{file.name}</div>
                        <div style={{ fontSize: 14, color: token.colorTextSecondary }}>{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                      </div>
                    </div>
                    <AntButton
                      type="text"
                      danger
                      icon={<CloseOutlined />}
                      disabled={isBusy}
                      onClick={() => {
                        const k = (file && (file as any).__key) || file.name
                        if (k) onRemoveFile()
                      }}
                      className="hover:bg-error/10 rounded-full p-2 flex-shrink-0"
                    />
                  </div>
                  {renderFileStatus()}
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
          </AntButton>,
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
            <label className="block text-sm font-medium text-text-secondary mb-2">{t('Upload.exifIsoLabel')}</label>
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
