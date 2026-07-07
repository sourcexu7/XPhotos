'use client'

import React, { useState, useEffect, useRef } from 'react'
import { message, theme } from 'antd'
import useSWR from 'swr'
import { fetcher } from '~/lib/utils/fetcher'
import type { ExifType, AlbumType } from '~/types'
import { App as AntApp, Upload as AntUpload, Button as AntButton, Input as AntInput, Form as AntForm, Modal as AntModal, Tag as AntTag, Card as AntCard, Progress as AntProgress, InputNumber as AntInputNumber, DatePicker as AntDatePicker, Select } from 'antd'

import dayjs from 'dayjs'
import 'dayjs/locale/zh-cn'
import zhCN from 'antd/es/date-picker/locale/zh_CN'
import { CloseOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { exifReader, uploadFile } from '~/lib/utils/file'
import { UploadOutlined } from '@ant-design/icons'
import { heicTo, isHeic } from 'heic-to'
import { encodeBrowserThumbHash } from '~/lib/utils/blurhash-client'
import { compressImage, getCompressOptionsFromConfigs } from '~/lib/utils/compress'
import { verifyUrlAccessible, fetchWithTimeout, checkDuplicate } from '~/lib/utils/uploadUtils'
import { useStorageConfig } from '~/hooks/useStorageConfig'
import { useTagManagement } from '~/hooks/useTagManagement'
import { useExifData } from '~/hooks/useExifData'
import { useExifPresets } from '~/hooks/useExifPresets'

const { Dragger } = AntUpload

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

interface LivePhotoFile extends File {
  __key?: string
}

export default function LivephotoFileUpload() {
  dayjs.locale('zh-cn')
  const { token } = theme.useToken()
  const { modal } = AntApp.useApp()
  const referenceInputRef = useRef<HTMLInputElement | null>(null)

  // 使用已提取的 hooks
  const storageConfig = useStorageConfig()
  const tagManagement = useTagManagement()
  const exifDataHook = useExifData()
  const exifPresets = useExifPresets()

  const [album, setAlbum] = useState('')
  const [exif, setExif] = useState({} as ExifType)
  const [title, setTitle] = useState('')
  const [imageId, setImageId] = useState('')
  const [imageName, setImageName] = useState('')
  const [url, setUrl] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [originalKey, setOriginalKey] = useState<string>('')
  const [, setPreviewKey] = useState<string>('')
  const [videoKey, setVideoKey] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [totalUploadProgress, setTotalUploadProgress] = useState(0)
  const [currentUploadStage, setCurrentUploadStage] = useState('')
  const [width, setWidth] = useState(0)
  const [height, setHeight] = useState(0)
  const [lat, setLat] = useState('')
  const [lon, setLon] = useState('')
  const [detail, setDetail] = useState('')
  const [hash, setHash] = useState('')
  const [autoUploadedFor, setAutoUploadedFor] = useState<string | null>(null)
  const [showMissingModal, setShowMissingModal] = useState(false)
  const [imageFile, setImageFile] = useState<LivePhotoFile | null>(null)
  const [videoFile, setVideoFile] = useState<LivePhotoFile | null>(null)
  const [videoUploadProgress, setVideoUploadProgress] = useState(0)
  const [videoUploadStage, setVideoUploadStage] = useState('')
  const [presetTags, setPresetTags] = useState<string[]>([])
  const [tagTree, setTagTree] = useState<TagNode[]>([])

  const t = useTranslations()

  const { data } = useSWR('/api/v1/albums/get', fetcher)
  const { data: configs } = useSWR<{ config_key: string, config_value: string }[]>('/api/v1/settings/get-custom-info', fetcher)

  const previewCompressQuality = parseFloat(configs?.find(config => config.config_key === 'preview_quality')?.config_value || '0.2')
  const previewImageMaxWidthLimit = parseInt(configs?.find(config => config.config_key === 'preview_max_width_limit')?.config_value || '0')

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

  // 使用共享压缩函数上传预览图
  const uploadPreviewImage = React.useCallback((file: File, type: string) => {
    return new Promise<void>(async (resolve, reject) => {
      try {
        setCurrentUploadStage('压缩预览图中')

        const compressOptions = getCompressOptionsFromConfigs(configs)
        // 关键修复：maxWidth > 0 时直接生效，不再依赖开关
        if (!compressOptions.maxWidthEnabled && previewImageMaxWidthLimit > 0) {
          compressOptions.maxWidthEnabled = true
          compressOptions.maxWidth = previewImageMaxWidthLimit
        }
        compressOptions.quality = previewCompressQuality

        const compressedBlob = await compressImage(file, compressOptions)
        const compressedFile = new File([compressedBlob], 'preview.webp', { type: 'image/webp' })

        const res = await uploadFile(compressedFile, type, storageConfig.storage, storageConfig.alistMountPath, {
          onProgress: (p: number) => {
            setTotalUploadProgress(50 + (p * 0.4))
          },
          onStageChange: (stage: string) => {
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
    })
  }, [previewCompressQuality, previewImageMaxWidthLimit, configs, storageConfig.storage, storageConfig.alistMountPath])

  // 使用 useExifData hook 加载 EXIF
  const loadExif = React.useCallback(async (file: File) => {
    try {
      const { exif: exifInfo, lat: exifLat, lon: exifLon, width: imgWidth, height: imgHeight } = await exifDataHook.loadExifData(file)
      setExif(exifInfo)
      setLat(exifLat)
      setLon(exifLon)
      setWidth(imgWidth)
      setHeight(imgHeight)
    } catch (e) {
      console.error(e)
    }
  }, [exifDataHook])

  async function handleSubmit() {
    setIsSubmitting(true)
    try {
      if (!url || url === '') {
        setIsSubmitting(false)
        setShowMissingModal(true)
        return
      }
      if (album === '') {
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
      if (!videoUrl || videoUrl === '') {
        message.warning(t('Upload.videoRequired'))
        return
      }

      const labels = [...tagManagement.labels]
      if (tagManagement.primarySelect) {
        if (!labels.includes(tagManagement.primarySelect)) labels.push(tagManagement.primarySelect)
      }
      if (tagManagement.secondarySelect && tagManagement.secondarySelect.length > 0) {
        tagManagement.secondarySelect.forEach((s) => { if (!labels.includes(s)) labels.push(s) })
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
        type: 2,
        lat,
        lon,
      }

      if (tagManagement.primarySelect && tagManagement.secondarySelect && tagManagement.secondarySelect.length > 0) {
        const map: Record<string, string> = {}
        tagManagement.secondarySelect.forEach(s => { map[s] = tagManagement.primarySelect! })
        ;(data as any).tagCategoryMap = map
      }

      // 提交前验证 URL 可访问性
      if (url) {
        const originOk = await verifyUrlAccessible(url)
        let previewOk = true
        if (previewUrl) {
          previewOk = await verifyUrlAccessible(previewUrl)
        }
        let videoOk = true
        if (videoUrl) {
          videoOk = await verifyUrlAccessible(videoUrl)
        }

        if (!originOk || !previewOk) {
          if (imageFile) {
            try {
              await onRequestUploadImage(imageFile, imageId || undefined)
            } catch (e) {
              console.error('Re-upload after failed remote verification error', e)
              message.error(t('Tips.cloudRemoteFileAnomalyRetryFailed'))
              setIsSubmitting(false)
              return
            }
          } else {
            message.error(t('Tips.remoteOriginOrPreviewMissing'))
            setIsSubmitting(false)
            return
          }
        }

        if (!videoOk) {
          if (videoFile) {
            try {
              await onRequestUploadVideo(videoFile)
            } catch (e) {
              console.error('Re-upload video after failed remote verification error', e)
              message.error(t('Tips.cloudRemoteVideoAnomalyRetryFailed'))
              setIsSubmitting(false)
              return
            }
          } else {
            message.error(t('Tips.remoteVideoMissing'))
            setIsSubmitting(false)
            return
          }
        }
      }

      // 重复检测
      const dupRes = await checkDuplicate(hash || undefined, url || undefined)

      if (dupRes) {
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
        message.success(t('Tips.saveSuccess'))
      } else {
        message.error(t('Tips.saveFailed'))
      }
    } catch {
      message.error(t('Tips.saveFailed'))
    } finally {
      setIsSubmitting(false)
      setTotalUploadProgress(0)
      setCurrentUploadStage('')
    }
  }

  // 使用 useExifData hook 的 applyReferenceExif
  const applyReferenceExif = React.useCallback(async (file: File) => {
    try {
      const mergedExif = await exifDataHook.applyReferenceExif(file, exif)
      setExif(mergedExif as ExifType)
      const { tags } = await exifReader(file)
      setLat(tags?.GPSLatitude?.description || '')
      setLon(tags?.GPSLongitude?.description || '')
      message.success(t('Upload.referenceExifToastSuccess'))
    } catch (err) {
      console.error('Reference EXIF parse failed', err)
      message.error(t('Upload.referenceExifToastError'))
    }
  }, [exifDataHook, exif, t])

  const resHandleImage = React.useCallback(async (res: UploadResponse, file: File) => {
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
    setUrl(res?.data?.url ?? '')
    setImageId(res?.data?.imageId ?? '')
    setImageName(res?.data?.fileName ?? '')
    if (res?.data?.key) setOriginalKey(res.data.key)
  }, [album, loadExif, uploadPreviewImage])

  const resHandleVideo = React.useCallback(async (res: UploadResponse) => {
    if (res?.code === 200) {
      setVideoUrl(res?.data?.url ?? '')
      if (res?.data?.key) setVideoKey(res.data.key)
      setVideoUploadStage('完成')
      setVideoUploadProgress(100)
    } else {
      throw new Error('Video upload failed')
    }
  }, [])

  const onRequestUploadImage = React.useCallback(async (file: LivePhotoFile, existingImageId?: string) => {
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
        await uploadFile(outputFile, album, storageConfig.storage, storageConfig.alistMountPath, {
          existingImageId,
          onProgress: (p:number) => {
            setTotalUploadProgress(10 + (p * 0.4))
          },
          onStageChange: (stage: string) => {
            setCurrentUploadStage(stage)
          }
        }).then(async (res) => {
          if (res.code === 200) {
            await resHandleImage(res, outputFile)
          } else {
            throw new Error('Upload failed')
          }
        })
      } else {
        setCurrentUploadStage('上传原图中')
        if (!file.__key) file.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
        await uploadFile(file, album, storageConfig.storage, storageConfig.alistMountPath, {
          existingImageId,
          onProgress: (p:number) => {
            setTotalUploadProgress(10 + (p * 0.4))
          },
          onStageChange: (stage: string) => {
            setCurrentUploadStage(stage)
          }
        }).then(async (res) => {
          if (res.code === 200) {
            await resHandleImage(res, file)
          } else {
            throw new Error('Upload failed')
          }
        })
      }
    } finally {
      setIsUploading(false)
    }
  }, [album, storageConfig.storage, storageConfig.alistMountPath, resHandleImage, isUploading])

  const onRequestUploadVideo = React.useCallback(async (file: LivePhotoFile) => {
    if (!file) return

    setVideoUploadStage('准备上传视频中')
    setVideoUploadProgress(0)

    try {
      if (!file.__key) file.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`

      const videoAlbum = album === '/' ? '/video' : album + '/video'

      await uploadFile(file, videoAlbum, storageConfig.storage, storageConfig.alistMountPath, {
        onProgress: (p:number) => {
          setVideoUploadProgress(p)
        },
        onStageChange: (stage: string) => {
          setVideoUploadStage(stage)
        }
      }).then(async (res) => {
        if (res.code === 200) {
          await resHandleVideo(res)
        } else {
          throw new Error('Video upload failed')
        }
      })
    } catch (e) {
      console.error('Video upload error:', e)
      throw e
    }
  }, [album, storageConfig.storage, storageConfig.alistMountPath, resHandleVideo])

  function onRemoveImage() {
    ;(async () => {
      try {
        if (originalKey && storageConfig.storage) {
          await fetch('/api/v1/file/delete', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storage: storageConfig.storage, key: originalKey })
          })
        }
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
    setOriginalKey('')
    setPreviewKey('')
    setImageFile(null)
  }

  function onRemoveVideo() {
    ;(async () => {
      try {
        if (videoKey && storageConfig.storage) {
          await fetch('/api/v1/file/delete', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ storage: storageConfig.storage, key: videoKey })
          })
        }
      } catch {}
    })()
    setVideoUrl('')
    setVideoKey('')
    setVideoFile(null)
    setVideoUploadProgress(0)
    setVideoUploadStage('')
  }

  // When an image file is selected, only read EXIF/preview/hash locally and prefill the form.
  React.useEffect(() => {
    if (!imageFile) return

    if (autoUploadedFor === imageFile.name) return

    let cancelled = false
    ;(async () => {
      try {
        if (!album) {
          await loadExif(imageFile)
          setHash(await encodeBrowserThumbHash(imageFile))
          const reader = new FileReader()
          reader.onload = (e) => {
            if (cancelled) return
            setPreviewUrl(typeof e.target?.result === 'string' ? e.target.result : '')
          }
          reader.readAsDataURL(imageFile)
          setAutoUploadedFor(imageFile.name)
          return
        }

        await onRequestUploadImage(imageFile)
        setAutoUploadedFor(imageFile.name)
      } catch (e) {
        console.error('Auto-upload failed', e)
      }
    })()

    return () => { cancelled = true }
  }, [imageFile, album, autoUploadedFor, onRequestUploadImage, loadExif])

  // When a video file is selected, auto upload it
  React.useEffect(() => {
    if (!videoFile) return

    let cancelled = false
    ;(async () => {
      try {
        if (!album) {
          return
        }

        await onRequestUploadVideo(videoFile)
        if (cancelled) return
      } catch (e) {
        console.error('Video auto-upload failed', e)
      }
    })()

    return () => { cancelled = true }
  }, [videoFile, album, onRequestUploadVideo])

  return (
    <div className="admin-upload flex flex-col space-y-4 h-full flex-1 font-sans text-sm">
      {/* Top controls: storage, album, alist (if any) and submit */}
      <div className="rounded-lg border border-border bg-background-alt p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="w-full sm:w-auto sm:min-w-[200px]">
            <label className="block text-sm font-medium text-text-secondary mb-2">
              {t('Upload.selectStorage')} *
            </label>
            <Select
              value={storageConfig.storage || undefined}
              onChange={(value: string) => { storageConfig.handleStorageChange(value); if (value === 's3') { try { message.info(t('Tips.switchToS3Info')) } catch {} } }}
              placeholder={t('Upload.selectStorage')}
              className="w-full"
              options={storageConfig.storages}
            />
            {storageConfig.storage === '' && (
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
              {storageConfig.alistMountPath === '' && (
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
                  if (imageFile && (!url || url === '')) {
                    await onRequestUploadImage(imageFile, imageId || undefined)
                  }
                  if (videoFile && (!videoUrl || videoUrl === '')) {
                    await onRequestUploadVideo(videoFile)
                  }
                  await handleSubmit()
                } catch {}
              }}
              disabled={(!imageFile && !videoFile && (!url || url === '')) || album === '' || storageConfig.storage === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '') || isUploading}
              style={{
                backgroundColor: token.colorPrimary,
                borderColor: token.colorPrimary,
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
            try {
              setIsSubmitting(true)
              if (imageFile) await onRequestUploadImage(imageFile, imageId || undefined)
              if (videoFile) await onRequestUploadVideo(videoFile)
              await handleSubmit()
            } catch (e) {
              console.error(e)
              message.error(t('Upload.uploadError'))
            } finally {
              setIsSubmitting(false)
            }
          }}>{t('Upload.uploadAndSubmit')}</AntButton>
        ]}
      >
        <div>{t('Upload.livePhotoNotUploadedBody')}</div>
      </AntModal>

      {/* Main area: left - uploaders, right - metadata form */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-stretch">
        <div className="h-full">
          <AntCard className="h-full" title={t('Upload.uploadFilesCardTitle')}>
            {/* Image Upload Dragger */}
            <div className="mb-4">
              <Dragger
                multiple={false}
                disabled={storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')}
                beforeUpload={() => false}
                showUploadList={false}
                style={{
                  padding: 24,
                  minHeight: 160,
                  border: `2px dashed ${token.colorBorder}`,
                  borderRadius: '12px',
                  backgroundColor: token.colorBgContainer,
                  transition: 'all 0.2s ease-in-out'
                }}
                onChange={(info) => {
                  const fileList = info.fileList || []
                  const last = fileList.length > 0 ? (fileList[fileList.length - 1].originFileObj as LivePhotoFile) : undefined
                  if (last) {
                    if (!last.__key) last.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
                    setImageFile(last)
                  } else {
                    setImageFile(null)
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                  </div>
                  <p style={{ fontWeight: 600, color: token.colorText }}>{t('Upload.dragOrClickImage')}</p>
                  <p className="text-text-secondary text-sm">{t('Upload.uploadTipsLivePhotoImage')}</p>
                  {(storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')) && (
                    <p className="text-text-muted text-sm">
                      {t(storageConfig.storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                    </p>
                  )}
                </div>
              </Dragger>
            </div>

            {/* Video Upload Dragger */}
            <div className="mb-4">
              <Dragger
                multiple={false}
                accept="video/*,.mov,.mp4,.m4v"
                disabled={storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')}
                beforeUpload={() => false}
                showUploadList={false}
                style={{
                  padding: 24,
                  minHeight: 160,
                  border: `2px dashed ${token.colorBorder}`,
                  borderRadius: '12px',
                  backgroundColor: token.colorBgContainer,
                  transition: 'all 0.2s ease-in-out'
                }}
                onChange={(info) => {
                  const fileList = info.fileList || []
                  const last = fileList.length > 0 ? (fileList[fileList.length - 1].originFileObj as LivePhotoFile) : undefined
                  if (last) {
                    if (!last.__key) last.__key = (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2,9)}`
                    setVideoFile(last)
                  } else {
                    setVideoFile(null)
                  }
                }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <UploadOutlined style={{ fontSize: 24, color: token.colorPrimary }} />
                  </div>
                  <p style={{ fontWeight: 600, color: token.colorText }}>{t('Upload.dragOrClickVideo')}</p>
                  <p className="text-text-secondary text-sm">{t('Upload.uploadTipsLivePhotoVideo')}</p>
                  {(storageConfig.storage === '' || album === '' || (storageConfig.storage === 'alist' && storageConfig.alistMountPath === '')) && (
                    <p className="text-text-muted text-sm">
                      {t(storageConfig.storage === 'alist' ? 'Tips.selectStorageAndAlbumWithAListDirectory' : 'Tips.selectStorageAndAlbum')}
                    </p>
                  )}
                </div>
              </Dragger>
            </div>

            {/* Image Progress bar for upload */}
            {imageFile && totalUploadProgress > 0 && (
              <div className="mb-4 p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{t('Upload.imageUploadProgress')}</span>
                  {currentUploadStage && (
                    <span className="text-sm text-text-secondary">{currentUploadStage}</span>
                  )}
                </div>
                <AntProgress
                  percent={Math.round(totalUploadProgress)}
                  status="active"
                  strokeColor={token.colorPrimary}
                  size={8}
                  showInfo={false}
                  className="mb-2"
                />
                <div className="text-sm text-text-secondary">
                  {Math.round(totalUploadProgress)}%
                </div>
              </div>
            )}

            {/* Video Progress bar for upload */}
            {videoFile && videoUploadProgress > 0 && (
              <div className="mb-4 p-4 rounded-lg border border-border bg-background">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-text-primary">{t('Upload.videoUploadProgress')}</span>
                  {videoUploadStage && (
                    <span className="text-sm text-text-secondary">{videoUploadStage}</span>
                  )}
                </div>
                <AntProgress
                  percent={Math.round(videoUploadProgress)}
                  status="active"
                  strokeColor={token.colorPrimary}
                  size={8}
                  showInfo={false}
                  className="mb-2"
                />
                <div className="text-sm text-text-secondary">
                  {Math.round(videoUploadProgress)}%
                </div>
              </div>
            )}

            {/* File list */}
            {(imageFile || videoFile) && (
              <div className="mt-4 pt-4 border-t">
                <div className="text-sm font-medium mb-3">{t('Upload.selectedFiles')}</div>
                {imageFile && (
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg mb-3 bg-background">
                    <div className="flex items-center gap-4">
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UploadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: token.colorText }}>{imageFile.name}</div>
                        <div style={{ fontSize: 14, color: token.colorTextSecondary }}>
                          {(imageFile.size / 1024 / 1024).toFixed(2)} MB
                          {url && <span className="ml-2 text-success">{t('Upload.statusUploaded')}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <AntButton
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={onRemoveImage}
                        className="hover:bg-error/10 rounded-full p-2"
                      />
                    </div>
                  </div>
                )}
                {videoFile && (
                  <div className="flex items-center justify-between p-3 border border-border rounded-lg mb-3 bg-background">
                    <div className="flex items-center gap-4">
                      <div style={{ width: 40, height: 40, borderRadius: 8, backgroundColor: token.colorPrimaryBg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <UploadOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, color: token.colorText }}>{videoFile.name}</div>
                        <div style={{ fontSize: 14, color: token.colorTextSecondary }}>
                          {(videoFile.size / 1024 / 1024).toFixed(2)} MB
                          {videoUrl && <span className="ml-2 text-success">{t('Upload.statusUploaded')}</span>}
                        </div>
                      </div>
                    </div>
                    <div>
                      <AntButton
                        type="text"
                        danger
                        icon={<CloseOutlined />}
                        onClick={onRemoveVideo}
                        className="hover:bg-error/10 rounded-full p-2"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Inline EXIF form */}
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
                    e.target.value = ''
                  }}
                />
              </div>
              <AntForm layout="vertical">
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  <AntForm.Item
                    label={t('Upload.exifCameraModelLabel')}
                    extra={<a onClick={() => { exifPresets.setEditingText({ cameraModels: exifPresets.presets.cameraModels.join(', '), shutterSpeeds: exifPresets.presets.shutterSpeeds.join(', '), isos: exifPresets.presets.isos.join(', '), apertures: exifPresets.presets.apertures.join(', ') }); exifPresets.openModal() }}>{t('Upload.manageCommonExifOptionsLink')}</a>}
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
                      <AntInput value={exif?.f_number || ''} onChange={(e) => setExif({ ...(exif || {}), f_number: parseFloat(e.target.value) || null })} placeholder={t('Upload.orManualInputPlaceholder')} />
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
                      <AntInput value={exif?.exposure_time || ''} onChange={(e) => setExif({ ...(exif || {}), exposure_time: e.target.value })} placeholder={t('Upload.orManualInputPlaceholder')} />
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
                      <AntInput value={exif?.iso_speed_rating || ''} onChange={(e) => setExif({ ...(exif || {}), iso_speed_rating: parseInt(e.target.value) || null })} placeholder={t('Upload.orManualInputPlaceholder')} />
                    </div>
                  </AntForm.Item>
                  <AntForm.Item label={t('Upload.exifFocalLengthLabel')}>
                    <AntInput value={exif?.focal_length || ''} onChange={(e) => setExif({ ...(exif || {}), focal_length: parseFloat(e.target.value) || null })} />
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer
                      }}
                    />
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.videoUrl')}</label>
                    <AntInput
                      disabled
                      value={videoUrl}
                      style={{
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer
                      }}
                    />
                    {!videoUrl && (
                      <p className="mt-2 text-xs text-error">{t('Upload.videoNotUploadedHint')}</p>
                    )}
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
                          borderRadius: token.borderRadius,
                          borderColor: token.colorBorder,
                        backgroundColor: token.colorBgContainer
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
                          borderRadius: token.borderRadius,
                          borderColor: token.colorBorder,
                        backgroundColor: token.colorBgContainer
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
                      backgroundColor: token.colorBgContainer
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
                      borderRadius: token.borderRadius,
                      borderColor: token.colorBorder,
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
                              backgroundColor: isSelected ? token.colorPrimary : undefined,
                              color: isSelected ? token.colorBgBase : undefined,
                              borderColor: isSelected ? token.colorPrimary : undefined
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
                        style={{
                          borderRadius: token.borderRadius,
                          borderColor: token.colorBorder
                        }}
                      />
                      <Select
                        mode="multiple"
                        value={(tagManagement.secondarySelect || []) as string[]}
                        options={(tagTree.find((t) => String(t.category) === String(tagManagement.primarySelect))?.children || []).map((c: any) => ({ label: c.name, value: c.name }))}
                        placeholder={t('Upload.tagChildrenPlaceholderMultiple')}
                        onChange={(vals: string[] | string | undefined) => {
                          const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                          tagManagement.handleCascaderChange([tagManagement.primarySelect || '', ...arrVals])
                        }}
                        style={{ width: '100%' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm text-text-secondary mb-2">{t('Upload.customTagsHeading')}</label>
                    <Select
                      mode="tags"
                      value={(tagManagement.labels.filter(Boolean) || []) as string[]}
                      options={(presetTags || []).map((s: string) => ({ label: s, value: s }))}
                      placeholder={t('Upload.indexTag')}
                      onChange={(vals: string[] | string | undefined) => {
                        const arrVals = Array.isArray(vals) ? vals : (vals ? [String(vals)] : [])
                        tagManagement.handleLabelsChange(arrVals)
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
