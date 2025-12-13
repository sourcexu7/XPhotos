'use client'

import type { ImageType } from '~/types'
import * as React from 'react'
import { CameraIcon } from '~/components/icons/camera.tsx'
import { ApertureIcon } from '~/components/icons/aperture.tsx'
import { TimerIcon } from '~/components/icons/timer.tsx'
import { CrosshairIcon } from '~/components/icons/crosshair.tsx'
import { GaugeIcon } from '~/components/icons/gauge.tsx'
import { CopyIcon } from '~/components/icons/copy.tsx'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link.tsx'
import { RefreshCWIcon } from '~/components/icons/refresh-cw.tsx'
import { cn } from '~/lib/utils'
import { DownloadIcon } from '~/components/icons/download.tsx'
import useSWR from 'swr'
import { ClockIcon } from '~/components/icons/clock.tsx'
import dayjs from 'dayjs'
import { useRouter } from 'next-nprogress-bar'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash.ts'
import { MotionImage } from '~/components/album/motion-image'
import { Row, Col, Space, Typography, Tag, Grid } from 'antd'

const { Title, Text } = Typography

export default function GalleryImage({ photo, configData }: { photo: ImageType, configData: any }) {
  const router = useRouter()
  const { useBreakpoint } = Grid
  const screens = useBreakpoint()
  const isDesktop = screens.lg === true
  const showTags = screens.md === true || screens.lg === true

  const exifIconClass = 'dark:text-gray-50 text-gray-500'
  const actionIconClass = 'dark:text-gray-50 text-gray-500 cursor-pointer hover:opacity-70 transition-opacity'

  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', photo?.url ?? ''], null)

  const dataURL = useBlurImageDataUrl(photo.blurhash)
  
  const customIndexOriginEnable = configData?.find((item: any) => item.config_key === 'custom_index_origin_enable')?.config_value.toString() === 'true'

  async function downloadImg() {
    setDownload(true)
    try {
      let msg = '开始下载，原图较大，请耐心等待！'
      if (photo?.album_license != null) {
        msg += '图片版权归作者所有, 分享转载需遵循 ' + photo.album_license + ' 许可协议！'
      }

      toast.warning(msg, { duration: 1500 })
      
      const storageType = photo?.url?.includes('s3') ? 's3' : 'r2'
      let response = await fetch(`/api/public/download/${photo.id}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')
      
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        response = await fetch(data.url)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = url
      const parsedUrl = new URL(photo?.url ?? '')
      const filename = parsedUrl.pathname.split('/').pop()
      link.download = filename || 'downloaded-file.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
    } catch (e) {
      toast.error('下载失败！', { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  return (
    <div className="w-full" style={{ maxWidth: 1440, margin: '0 auto', padding: '12px 16px' }}>
      {/* 移动端和平板布局：通过断点条件渲染，避免重复 */}
      {!isDesktop && (
      <div>
        {photo.title && (
          <Title level={5} style={{ margin: '0 0 8px 0', fontWeight: 500, color: '#e5e7eb' }}>
            {photo.title}
          </Title>
        )}
        
        <div className="relative select-none shadow-md rounded overflow-hidden" style={{ width: '100%', marginBottom: '8px' }}>
          <MotionImage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            src={customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url}
            overrideSrc={customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url}
            alt={photo.title}
            width={photo.width}
            height={photo.height}
            loading="lazy"
            unoptimized
            placeholder="blur"
            blurDataURL={dataURL}
            onClick={() => router.push(`/preview/${photo?.id}`)}
            style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
          />
          {photo.type === 2 && (
            <div className="absolute top-2 left-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white opacity-75 drop-shadow-lg"
                   width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                   strokeLinecap="round" strokeLinejoin="round">
                <path stroke="none" fill="none"></path>
                <circle cx="12" cy="12" r="1"></circle>
                <circle cx="12" cy="12" r="5"></circle>
                <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
                <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
                <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
                <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
                <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
                <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
                <line x1="12" y1="3" x2="12" y2="3.01"></line>
                <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
                <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
                <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
                <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
                <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
                <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
                <line x1="12" y1="21" x2="12" y2="21.01"></line>
              </svg>
            </div>
          )}
        </div>
        
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 12px', fontSize: '12px', color: '#9ca3af', marginBottom: '8px' }}>
          {(() => {
            const cam = photo?.exif?.make ? `${photo?.exif?.make} ${photo?.exif?.model ?? ''}`.trim() : (photo?.exif?.model ?? '')
            return cam && cam.length > 0 ? <span>相机：{cam}</span> : null
          })()}
          {photo?.exif?.f_number && <span>光圈：f/{photo.exif.f_number}</span>}
          {photo?.exif?.exposure_time && <span>快门：{photo.exif.exposure_time}</span>}
          {photo?.exif?.iso_speed_rating && <span>ISO：{photo.exif.iso_speed_rating}</span>}
          {photo?.exif?.focal_length && <span>焦距：{photo.exif.focal_length}</span>}
        </div>
        
        {showTags && photo?.labels && photo.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {photo.labels.map((tag: string) => (
              <span
                key={tag}
                className="cursor-pointer select-none px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                onClick={() => router.push(`/tag/${tag}`)}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
          <CopyIcon
            className={actionIconClass}
            size={16}
            onClick={async () => {
              try {
                const url = photo?.url
                if (!url) {
                  toast.error('图片链接不存在！', {duration: 500})
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
                let msg = '复制图片链接成功！'
                if (photo?.album_license != null) {
                  msg = '图片版权归作者所有, 分享转载需遵循 ' + photo?.album_license + ' 许可协议！'
                }
                toast.success(msg, {duration: 1500})
              } catch (error) {
                toast.error('复制图片链接失败！', {duration: 1000})
              }
            }}
          />
          <LinkIcon
            className={actionIconClass}
            size={16}
            onClick={async () => {
              try {
                const url = window.location.origin + '/preview/' + photo.id
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
                toast.success('复制分享直链成功！', {duration: 500})
              } catch (error) {
                toast.error('复制分享直链失败！', {duration: 1000})
              }
            }}
          />
          {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' && (
            download ? (
              <RefreshCWIcon className={cn(actionIconClass, 'animate-spin cursor-not-allowed')} size={16} />
            ) : (
              <DownloadIcon className={actionIconClass} size={16} onClick={() => downloadImg()} />
            )
          )}
        </div>
        
        {/* 标签已移至图标之上 */}
      </div>
      )}
      
      {/* 桌面端布局：通过断点条件渲染，避免重复 */}
      {isDesktop && (
      <Row gutter={[24, 0]} align="top">
        <Col xs={24} sm={24} md={24} lg={5} xl={4}>
          <div style={{ width: '100%', paddingLeft: '32px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Title level={4} style={{ margin: 0, fontWeight: 500, color: '#e5e7eb' }}>
              {photo.title}
            </Title>
            {photo?.detail && (
              <Text type="secondary" style={{ fontSize: 13, display: 'block', lineHeight: 1.6, color: '#9ca3af' }}>
                {photo.detail}
              </Text>
            )}
          </div>

          <div style={{ marginTop: '16px', paddingLeft: '32px' }}>
            <Text type="secondary" style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>拍摄参数</Text>
            <div style={{ width: '88px', height: '1px', backgroundColor: '#4b5563', marginTop: '6px' }} />
          </div>
          <div style={{ marginTop: '12px' }}>
            {(() => {
              const cam = photo?.exif?.make ? `${photo?.exif?.make} ${photo?.exif?.model ?? ''}`.trim() : (photo?.exif?.model ?? '')
              const showCam = cam && cam.length > 0 ? cam : undefined
              return showCam ? (
                <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                  <CameraIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>相机型号</Text>
                    <Text style={{ fontSize: 13, color: '#d1d5db' }}>{showCam}</Text>
                  </div>
                </div>
              ) : null
            })()}
            {photo?.exif?.data_time && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                <ClockIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>拍摄日期</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db' }}>
                    {dayjs(photo?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() ?
                      dayjs(photo?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD')
                      : photo?.exif.data_time
                    }
                  </Text>
                </div>
              </div>
            )}
            {photo?.exif?.f_number && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                <ApertureIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>光圈</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db' }}>{photo?.exif?.f_number}</Text>
                </div>
              </div>
            )}
            {photo?.exif?.exposure_time && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                <TimerIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>快门速度</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db' }}>{photo?.exif?.exposure_time}</Text>
                </div>
              </div>
            )}
            {photo?.exif?.focal_length && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                <CrosshairIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>焦距</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db' }}>{photo.exif.focal_length}</Text>
                </div>
              </div>
            )}
            {photo?.exif?.iso_speed_rating && (
              <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'flex-start', gap: '10px', marginLeft: '32px' }}>
                <GaugeIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  <Text type="secondary" style={{ fontSize: 12, color: '#9ca3af' }}>ISO</Text>
                  <Text style={{ fontSize: 13, color: '#d1d5db' }}>{photo.exif.iso_speed_rating}</Text>
                </div>
              </div>
            )}
          </div>

          {photo?.labels && photo.labels.length > 0 && (
            <div style={{ marginTop: '12px', paddingLeft: '32px' }} className="flex flex-wrap gap-2">
              {photo.labels.map((tag: string) => (
                <span
                  key={tag}
                  className="cursor-pointer select-none px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-gray-400 hover:text-gray-200 hover:bg-white/10 hover:border-white/20 transition-all duration-200"
                  onClick={() => router.push(`/tag/${tag}`)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div style={{ marginTop: '12px', paddingLeft: '32px', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <CopyIcon
              className={actionIconClass}
              size={18}
              onClick={async () => {
                try {
                  const url = photo?.url
                  if (!url) {
                    toast.error('图片链接不存在！', {duration: 500})
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
                  let msg = '复制图片链接成功！'
                  if (photo?.album_license != null) {
                    msg = '图片版权归作者所有, 分享转载需遵循 ' + photo?.album_license + ' 许可协议！'
                  }
                  toast.success(msg, {duration: 1500})
                } catch (error) {
                  toast.error('复制图片链接失败！', {duration: 1000})
                }
              }}
            />
            <LinkIcon
              className={actionIconClass}
              size={18}
              onClick={async () => {
                try {
                  const url = window.location.origin + '/preview/' + photo.id
                  if (!photo.id) {
                    toast.error('图片ID不存在！', {duration: 500})
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
                  toast.success('复制分享直链成功！', {duration: 500})
                } catch (error) {
                  toast.error('复制分享直链失败！', {duration: 1000})
                }
              }}
            />
            {configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value.toString() === 'true' && (
              download ? (
                <RefreshCWIcon className={cn(actionIconClass, 'animate-spin cursor-not-allowed')} size={18} />
              ) : (
                <DownloadIcon className={actionIconClass} size={18} onClick={() => downloadImg()} />
              )
            )}
          </div>

          {/* 标签已移至图标之上 */}
        </Col>

        <Col xs={24} sm={24} md={24} lg={19} xl={20}>
          <div className="relative select-none shadow-md rounded overflow-hidden" style={{ width: '100%' }}>
            <MotionImage
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1 }}
              src={customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url}
              overrideSrc={customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url}
              alt={photo.title}
              width={photo.width}
              height={photo.height}
              loading="lazy"
              unoptimized
              placeholder="blur"
              blurDataURL={dataURL}
              onClick={() => router.push(`/preview/${photo?.id}`)}
              style={{ width: '100%', height: 'auto', display: 'block', cursor: 'pointer' }}
            />
            {photo.type === 2 && (
              <div className="absolute top-2 left-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="text-white opacity-75 drop-shadow-lg"
                     width="24" height="24" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                     strokeLinecap="round" strokeLinejoin="round">
                  <path stroke="none" fill="none"></path>
                  <circle cx="12" cy="12" r="1"></circle>
                  <circle cx="12" cy="12" r="5"></circle>
                  <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
                  <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
                  <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
                  <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
                  <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
                  <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
                  <line x1="12" y1="3" x2="12" y2="3.01"></line>
                  <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
                  <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
                  <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
                  <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
                  <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
                  <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
                  <line x1="12" y1="21" x2="12" y2="21.01"></line>
                </svg>
              </div>
            )}
          </div>
        </Col>
      </Row>
      )}
    </div>
  )
}
