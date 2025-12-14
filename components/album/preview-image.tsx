'use client'

import type { HandleProps, ImageDataProps, PreviewImageHandleProps } from '~/types/props'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import useSWR from 'swr'
import { useRouter } from 'next-nprogress-bar'
import { ClockIcon } from '~/components/icons/clock'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { XIcon } from '~/components/icons/x'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { cn } from '~/lib/utils'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import 'yet-another-react-lightbox/styles.css'
import { useState } from 'react'
import { ExpandIcon } from '~/components/icons/expand'
import { useTranslations } from 'next-intl'
import ProgressiveImage from '~/components/album/progressive-image.tsx'
import { Row, Col, Space, Typography, Tag, Tooltip } from 'antd'

const { Title, Text } = Typography

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', props.data?.url ?? ''], null)
  const [lightboxPhoto, setLightboxPhoto] = useState<boolean>(false)

  const exifIconClass = 'text-gray-300'
  const actionIconClass = 'text-gray-300 cursor-pointer hover:opacity-70 transition-opacity'

  const exifProps: ImageDataProps = {
    data: props.data,
  }

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  const handleClose = () => {
    if (window != undefined) {
      if (window.history.length > 1) {
        router.back()
        return
      }
    }
    if (props.data?.album_value) {
      router.push(`${props.data.album_value}`)
    } else {
      router.push('/')
    }
  }

  const handleDownload = async () => {
    setDownload(true)
    try {
      let msg = t('Tips.downloadStart')
      if (props.data?.album_license != null) {
        msg += t('Tips.downloadLicense', { license: props.data.album_license })
      }

      toast.warning(msg, { duration: 1500 })

      // 获取存储类型
      const storageType = props.data?.url?.includes('s3') ? 's3' : 'r2'

      // 使用新的下载 API
      let response = await fetch(`/api/public/download/${props.id}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')

      if (contentType?.includes('application/json')) {
        // 如果是 JSON 响应，说明是直接下载模式
        const data = await response.json()
        // 使用后端返回的文件名，并进行 URL 解码
        const filename = decodeURIComponent(data.filename || 'download.jpg')
        // 直接使用 window.location.href 触发下载
        response = await fetch(data.url)
        const blob = await response.blob()
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      } else {
        // 对于非直接下载模式，从 Content-Disposition 头中获取文件名
        const contentDisposition = response.headers.get('content-disposition')
        let filename = 'download'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="([^"]+)"/)
          if (filenameMatch) {
            filename = decodeURIComponent(filenameMatch[1])
          }
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(new Blob([blob]))
        const link = document.createElement('a')
        link.href = url
        link.download = filename
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
    } catch {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  if (!props.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">{t('Tips.loading')}</p>
      </div>
    )
  }

  return (
    <div className="w-full h-full overflow-y-auto" style={{ maxWidth: 1440, margin: '0 auto', padding: '8px 12px' }}>
      <Row gutter={[16, 16]} align="top" style={{ height: '100%' }}>
        {/* 移动端：图片在上 */}
        <Col xs={24} sm={24} md={24} lg={0} xl={0} style={{ order: 1 }}>
          <div className="relative select-none flex items-center justify-center" style={{ width: '100%', minHeight: '300px' }}>
            {props.data.type === 1 ?
              <ProgressiveImage
                imageUrl={props.data.preview_url || props.data.url}
                previewUrl={props.data.preview_url || props.data.url}
                alt={props.data.title}
                height={props.data.height}
                width={props.data.width}
                blurhash={props.data.blurhash}
                showLightbox={lightboxPhoto}
                onShowLightboxChange={(value) => setLightboxPhoto(value)}
              />
              : <LivePhoto
                url={props.data.preview_url || props.data.url}
                videoUrl={props.data.video_url}
                className="max-h-[90vh]"
              />
            }
          </div>
        </Col>

        {/* 左侧信息栏 */}
        <Col xs={24} sm={24} md={24} lg={5} xl={4} style={{ order: 2 }}>
          <div style={{ paddingTop: '8px' }}>
            {/* 标题与关闭按钮 */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', paddingLeft: '16px', paddingRight: '8px', marginBottom: '12px' }}>
              <Title level={4} style={{ margin: 0, fontWeight: 500, flex: 1, fontSize: '16px', color: '#f0f0f0' }}>
                {props.data?.title || '未命名'}
              </Title>
              <button
                onClick={handleClose}
                aria-label={t('Button.goBack')}
                style={{ marginLeft: '8px', flexShrink: 0 }}
              >
                <XIcon className={exifIconClass} size={20} />
              </button>
            </div>

            {/* 图片描述 */}
            {props.data?.detail && (
              <div style={{ paddingLeft: '16px', marginBottom: '12px' }}>
                <Text style={{ fontSize: 13, display: 'block', lineHeight: 1.6, color: '#e0e0e0' }}>
                  {props.data.detail}
                </Text>
              </div>
            )}

            {/* EXIF信息区域 */}
            <div style={{ paddingLeft: '16px', marginTop: '12px' }}>
              <Text style={{ fontSize: 13, fontWeight: 500, color: '#e0e0e0' }}>拍摄参数</Text>
              <div style={{ width: '88px', height: '1px', backgroundColor: 'rgba(255,255,255,0.2)', marginTop: '6px' }} />
            </div>

            <div style={{ marginTop: '12px' }}>
              {/* 相机型号 */}
              {(() => {
                const cam = props.data?.exif?.make ? `${props.data?.exif?.make} ${props.data?.exif?.model ?? ''}`.trim() : (props.data?.exif?.model ?? '')
                const showCam = cam && cam.length > 0 ? cam : undefined
                return showCam ? (
                  <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                    <CameraIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                      <Text style={{ fontSize: 12, color: '#999999' }}>相机型号</Text>
                      <Text style={{ fontSize: 13, color: '#e0e0e0' }}>{showCam}</Text>
                    </div>
                  </div>
                ) : null
              })()}

              {/* 拍摄日期 */}
              {props.data?.exif?.data_time && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                  <ClockIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text style={{ fontSize: 12, color: '#999999' }}>拍摄日期</Text>
                    <Text style={{ fontSize: 13, color: '#e0e0e0' }}>
                      {dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() ?
                        dayjs(props.data?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD')
                        : props.data?.exif.data_time
                      }
                    </Text>
                  </div>
                </div>
              )}

              {/* 光圈 */}
              {props.data?.exif?.f_number && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                  <ApertureIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text style={{ fontSize: 12, color: '#999999' }}>光圈</Text>
                    <Text style={{ fontSize: 13, color: '#e0e0e0' }}>{props.data?.exif?.f_number}</Text>
                  </div>
                </div>
              )}

              {/* 焦距 */}
              {props.data?.exif?.focal_length && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                  <CrosshairIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text style={{ fontSize: 12, color: '#999999' }}>焦距</Text>
                    <Text style={{ fontSize: 13, color: '#e0e0e0' }}>{props.data.exif.focal_length}</Text>
                  </div>
                </div>
              )}

              {/* ISO */}
              {props.data?.exif?.iso_speed_rating && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                  <GaugeIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text style={{ fontSize: 12, color: '#999999' }}>ISO</Text>
                    <Text style={{ fontSize: 13, color: '#e0e0e0' }}>{props.data.exif.iso_speed_rating}</Text>
                  </div>
                </div>
              )}

              {/* 图片尺寸 */}
              {(props.data?.width && props.data?.height) && (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '16px' }}>
                  <ExpandIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }} />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text style={{ fontSize: 12, color: '#999999' }}>图片尺寸</Text>
                    <Text style={{ fontSize: 13, color: '#e0e0e0' }}>{props.data.width} × {props.data.height}</Text>
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮区域 */}
            <div style={{ marginTop: '16px', paddingLeft: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Tooltip title="复制图片直链">
                <CopyIcon
                  className={actionIconClass}
                  size={18}
                  onClick={async () => {
                    try {
                      const url = props.data?.url
                      if (!url) {
                        toast.error('图片链接不存在！', { duration: 500 })
                        return
                      }
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(url)
                      } else {
                        const textarea = document.createElement('textarea')
                        textarea.value = url
                        textarea.style.position = 'fixed'
                        textarea.style.opacity = '0'
                        document.body.appendChild(textarea)
                        textarea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textarea)
                      }
                      let msg = t('Tips.copyImageSuccess')
                      if (props.data?.album_license != null) {
                        msg = t('Tips.downloadLicense', { license: props.data?.album_license })
                      }
                      toast.success(msg, { duration: 1500 })
                    } catch (error) {
                      console.error('复制失败:', error)
                      toast.error(t('Tips.copyImageFailed'), { duration: 1000 })
                    }
                  }}
                />
              </Tooltip>
              <Tooltip title="复制分享链接">
                <LinkIcon
                  className={actionIconClass}
                  size={18}
                  onClick={async () => {
                    try {
                      const url = window.location.origin + '/preview/' + props.id
                      if (!props.id) {
                        toast.error('图片ID不存在！', { duration: 500 })
                        return
                      }
                      if (navigator.clipboard && navigator.clipboard.writeText) {
                        await navigator.clipboard.writeText(url)
                      } else {
                        const textarea = document.createElement('textarea')
                        textarea.value = url
                        textarea.style.position = 'fixed'
                        textarea.style.opacity = '0'
                        document.body.appendChild(textarea)
                        textarea.select()
                        document.execCommand('copy')
                        document.body.removeChild(textarea)
                      }
                      toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
                    } catch (error) {
                      console.error('复制失败:', error)
                      toast.error(t('Tips.copyShareFailed'), { duration: 1000 })
                    }
                  }}
                />
              </Tooltip>
              {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true'
                && <>
                  {download ?
                    <RefreshCWIcon
                      className={cn(actionIconClass, 'animate-spin cursor-not-allowed')}
                      size={18}
                    /> :
                    <DownloadIcon
                      className={actionIconClass}
                      size={18}
                      onClick={() => handleDownload()}
                    />
                  }
                </>
              }
              <Tooltip title="全屏查看">
                <ExpandIcon
                  className={actionIconClass}
                  size={18}
                  onClick={() => {
                    setLightboxPhoto(true)
                  }}
                />
              </Tooltip>
            </div>

            {/* 标签区域 */}
            {props.data?.labels && props.data.labels.length > 0 && (
              <div style={{ marginTop: '16px', paddingLeft: '16px' }}>
                <Space size={6} wrap>
                  {props.data.labels.map((tag: string) => (
                    <Tag
                      key={tag}
                      className="cursor-pointer select-none border border-white/20 bg-white/10 text-white hover:bg-white/20 dark:bg-white/10 dark:text-white dark:border-white/20 !bg-white/10 !text-white !border-white/20"
                      onClick={() => router.push(`/tag/${tag}`)}
                      style={{ margin: 0, fontSize: 12, background: 'rgba(255,255,255,0.08)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}
                    >
                      {tag}
                    </Tag>
                  ))}
                </Space>
              </div>
            )}
          </div>
        </Col>

        {/* 桌面端：右侧图片区域 */}
        <Col xs={0} sm={0} md={0} lg={19} xl={20} style={{ order: 3, height: '100%' }}>
          <div className="relative select-none flex items-center justify-center" style={{ width: '100%', height: '100%', minHeight: '400px' }}>
            {props.data.type === 1 ?
              <ProgressiveImage
                imageUrl={props.data.preview_url || props.data.url}
                previewUrl={props.data.preview_url || props.data.url}
                alt={props.data.title}
                height={props.data.height}
                width={props.data.width}
                blurhash={props.data.blurhash}
                showLightbox={lightboxPhoto}
                onShowLightboxChange={(value) => setLightboxPhoto(value)}
              />
              : <LivePhoto
                url={props.data.preview_url || props.data.url}
                videoUrl={props.data.video_url}
                className="max-h-[90vh]"
              />
            }
          </div>
        </Col>
      </Row>
    </div>
  )
}