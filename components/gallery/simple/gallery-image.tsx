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

export default function GalleryImage({ photo, configData }: { photo: ImageType, configData: { config_key: string; config_value: string }[] }) {
  const router = useRouter()

  const exifIconClass = 'text-muted-foreground'
  const actionIconClass = 'text-muted-foreground cursor-pointer hover:opacity-70 transition-opacity'

  const { data: download = false, mutate: setDownload } = useSWR(['masonry/download', photo?.url ?? ''], null)

  const dataURL = useBlurImageDataUrl(photo.blurhash)

  const customIndexOriginEnable = configData?.find((item: { config_key: string; config_value: any }) => item.config_key === 'custom_index_origin_enable')?.config_value.toString() === 'true'

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
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const parsedUrl = new URL(photo?.url ?? '')
      const filename = parsedUrl.pathname.split('/').pop()
      link.download = filename || 'downloaded-file.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 0)
    } catch (e) {
      toast.error('下载失败！', { duration: 500 })
    } finally {
      setDownload(false)
    }
  }

  const imageSrc = customIndexOriginEnable ? photo.url || photo.preview_url : photo.preview_url || photo.url

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 py-3">
      {/* 移动端和平板布局 */}
      <div className="lg:hidden">
        {photo.title && (
          <h5 className="text-sm font-medium text-foreground mb-2">{photo.title}</h5>
        )}

        <div className="relative select-none shadow-md rounded overflow-hidden w-full mb-2">
          <MotionImage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={imageSrc}
            overrideSrc={imageSrc}
            alt={photo.title}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
            loading="lazy"
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

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
          {(() => {
            const cam = photo?.exif?.make ? `${photo?.exif?.make} ${photo?.exif?.model ?? ''}`.trim() : (photo?.exif?.model ?? '')
            return cam && cam.length > 0 ? <span>相机：{cam}</span> : null
          })()}
          {photo?.exif?.f_number && (() => {
            const fNumber = photo.exif.f_number.toString()
            const displayValue = fNumber.startsWith('f/') ? fNumber : `f/${fNumber}`
            return <span>光圈：{displayValue}</span>
          })()}
          {photo?.exif?.exposure_time && <span>快门：{photo.exif.exposure_time}</span>}
          {photo?.exif?.iso_speed_rating && <span>ISO：{photo.exif.iso_speed_rating}</span>}
          {photo?.exif?.focal_length && <span>焦距：{photo.exif.focal_length}</span>}
        </div>

        {photo?.labels && photo.labels.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {photo.labels.map((tag: string) => (
              <span
                key={tag}
                className="cursor-pointer select-none px-3 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80 transition-all duration-200"
                onClick={() => router.push(`/tag/${tag}`)}
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-4 mb-1">
          <CopyIcon
            className={cn(actionIconClass, 'p-1 -m-1')}
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
            className={cn(actionIconClass, 'p-1 -m-1')}
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
              <RefreshCWIcon className={cn(actionIconClass, 'animate-spin cursor-not-allowed p-1 -m-1')} size={16} />
            ) : (
              <DownloadIcon className={cn(actionIconClass, 'p-1 -m-1')} size={16} onClick={() => downloadImg()} />
            )
          )}
        </div>
      </div>

      {/* 桌面端布局：左侧 EXIF + 右侧图片 */}
      <div className="hidden lg:flex lg:gap-6 lg:items-start">
        {/* 左侧 EXIF 信息栏 */}
        <div className="w-[20%] xl:w-[16.7%] shrink-0">
          <div className="pl-8 flex flex-col gap-1.5">
            <h4 className="text-base font-medium text-foreground m-0">{photo.title}</h4>
            {photo?.detail && (
              <p className="text-[13px] leading-relaxed text-muted-foreground">{photo.detail}</p>
            )}
          </div>

          <div className="pl-8 mt-4">
            <span className="text-[13px] font-medium text-muted-foreground">拍摄参数</span>
            <div className="w-[88px] h-px bg-border mt-1.5" />
          </div>

          <div className="mt-3">
            {(() => {
              const cam = photo?.exif?.make ? `${photo?.exif?.make} ${photo?.exif?.model ?? ''}`.trim() : (photo?.exif?.model ?? '')
              const showCam = cam && cam.length > 0 ? cam : undefined
              return showCam ? (
                <div className="mb-4 flex items-start gap-2.5 ml-8">
                  <CameraIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-xs text-muted-foreground">相机型号</span>
                    <span className="text-[13px] text-foreground">{showCam}</span>
                  </div>
                </div>
              ) : null
            })()}
            {photo?.exif?.data_time && (
              <div className="mb-4 flex items-start gap-2.5 ml-8">
                <ClockIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">拍摄日期</span>
                  <span className="text-[13px] text-foreground">
                    {dayjs(photo?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').isValid() ?
                      dayjs(photo?.exif?.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD')
                      : photo?.exif.data_time
                    }
                  </span>
                </div>
              </div>
            )}
            {photo?.exif?.f_number && (
              <div className="mb-4 flex items-start gap-2.5 ml-8">
                <ApertureIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">光圈</span>
                  <span className="text-[13px] text-foreground">{photo?.exif?.f_number}</span>
                </div>
              </div>
            )}
            {photo?.exif?.exposure_time && (
              <div className="mb-4 flex items-start gap-2.5 ml-8">
                <TimerIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">快门速度</span>
                  <span className="text-[13px] text-foreground">{photo?.exif?.exposure_time}</span>
                </div>
              </div>
            )}
            {photo?.exif?.focal_length && (
              <div className="mb-4 flex items-start gap-2.5 ml-8">
                <CrosshairIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">焦距</span>
                  <span className="text-[13px] text-foreground">{photo.exif.focal_length}</span>
                </div>
              </div>
            )}
            {photo?.exif?.iso_speed_rating && (
              <div className="mb-4 flex items-start gap-2.5 ml-8">
                <GaugeIcon className={exifIconClass} size={15} style={{ marginTop: '2px' }}/>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">ISO</span>
                  <span className="text-[13px] text-foreground">{photo.exif.iso_speed_rating}</span>
                </div>
              </div>
            )}
          </div>

          {photo?.labels && photo.labels.length > 0 && (
            <div className="mt-3 pl-8 flex flex-wrap gap-2">
              {photo.labels.map((tag: string) => (
                <span
                  key={tag}
                  className="cursor-pointer select-none px-3 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80 transition-all duration-200"
                  onClick={() => router.push(`/tag/${tag}`)}
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 pl-8 flex items-center gap-3">
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
        </div>

        {/* 右侧图片区域 */}
        <div className="flex-1 relative select-none shadow-md rounded overflow-hidden">
          <MotionImage
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            src={imageSrc}
            overrideSrc={imageSrc}
            alt={photo.title}
            width={photo.width}
            height={photo.height}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 75vw, 60vw"
            loading="lazy"
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
      </div>
    </div>
  )
}
