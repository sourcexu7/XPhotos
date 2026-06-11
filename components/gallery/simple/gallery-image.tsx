'use client'

import type { ImageType } from '~/types'
import { CameraIcon } from '~/components/icons/camera.tsx'
import { ApertureIcon } from '~/components/icons/aperture.tsx'
import { TimerIcon } from '~/components/icons/timer.tsx'
import { CrosshairIcon } from '~/components/icons/crosshair.tsx'
import { GaugeIcon } from '~/components/icons/gauge.tsx'
import { CopyIcon } from '~/components/icons/copy.tsx'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link.tsx'
import { cn } from '~/lib/utils'
import { DownloadIcon } from '~/components/icons/download.tsx'
import { ClockIcon } from '~/components/icons/clock.tsx'
import dayjs from 'dayjs'
import { useRouter } from 'next-nprogress-bar'
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react'
import { buildShareUrl, copyToClipboard } from '~/lib/clipboard'

/* -------------------------------------------------------------------------- */
/*  子组件 1：图片标题 + 描述（桌面端使用）                                    */
/* -------------------------------------------------------------------------- */

type HeaderProps = {
  title?: string | null
  detail?: string | null
}

function ImageHeaderImpl({ title, detail }: HeaderProps) {
  return (
    <div className="pl-8 flex flex-col gap-1.5">
      {title && <h4 className="text-base font-medium text-foreground m-0">{title}</h4>}
      {detail && (
        <p className="text-[13px] leading-relaxed text-muted-foreground">{detail}</p>
      )}
    </div>
  )
}

const ImageHeader = memo(ImageHeaderImpl)

/* -------------------------------------------------------------------------- */
/*  子组件 2：EXIF 拍摄信息（桌面端图标版 + 移动端文本版，共用一个组件）        */
/* -------------------------------------------------------------------------- */

type ExifItem = { label: string; value: string }

type ExifProps = {
  variant: 'desktop' | 'mobile'
  items: ExifItem[]
}

/* 桌面端每个条目用一个图标，移动端只输出纯文字，避免无意义的图标实例化 */
const iconForLabel: Record<string, React.ComponentType<{
  size?: number; className?: string; style?: React.CSSProperties
}>> = {
  '相机型号': CameraIcon,
  '拍摄日期': ClockIcon,
  '光圈': ApertureIcon,
  '快门速度': TimerIcon,
  '焦距': CrosshairIcon,
  'ISO': GaugeIcon,
}

function ImageExifImpl({ variant, items }: ExifProps) {
  if (items.length === 0) return null

  if (variant === 'mobile') {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
        {items.map((item) => (
          <span key={item.label}>
            {item.label}：{item.value}
          </span>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="pl-8 mt-4">
        <span className="text-[13px] font-medium text-muted-foreground">拍摄参数</span>
        <div className="w-[88px] h-px bg-border mt-1.5" />
      </div>
      <div className="mt-3">
        {items.map((item) => {
          const Icon = iconForLabel[item.label]
          return Icon ? (
            <div
              key={item.label}
              className="mb-4 flex items-start gap-2.5 ml-8"
            >
              <Icon
                className="text-muted-foreground"
                size={15}
                style={{ marginTop: '2px' }}
              />
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">{item.label}</span>
                <span className="text-[13px] text-foreground">{item.value}</span>
              </div>
            </div>
          ) : null
        })}
      </div>
    </>
  )
}

const ImageExif = memo(ImageExifImpl)

/* -------------------------------------------------------------------------- */
/*  子组件 3：标签栏                                                          */
/* -------------------------------------------------------------------------- */

type LabelsProps = {
  labels: string[]
  layout: 'mobile' | 'desktop'
}

function ImageLabelsImpl({ labels, layout }: LabelsProps) {
  const router = useRouter()
  const handleClick = useCallback(
    (tag: string) => {
      router.push(`/tag/${tag}`)
    },
    [router],
  )

  const containerClass =
    layout === 'desktop'
      ? 'mt-3 pl-8 flex flex-wrap gap-2'
      : 'flex flex-wrap gap-2 mb-2'

  return (
    <div className={containerClass}>
      {labels.map((tag) => (
        <span
          key={tag}
          className="cursor-pointer select-none px-3 py-1 rounded-full bg-muted/60 border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted hover:border-border/80 transition-all duration-200"
          onClick={() => handleClick(tag)}
        >
          #{tag}
        </span>
      ))}
    </div>
  )
}

const ImageLabels = memo(ImageLabelsImpl)

/* -------------------------------------------------------------------------- */
/*  子组件 4：操作按钮（复制链接 / 分享直链 / 下载）                           */
/* -------------------------------------------------------------------------- */

type ActionsProps = {
  photoId: string | undefined
  photoUrl: string | undefined
  albumLicense: string | null | undefined
  variant: 'mobile' | 'desktop'
  enableDownload: boolean
}

function ImageActionsImpl({
  photoId,
  photoUrl,
  albumLicense,
  variant,
  enableDownload,
}: ActionsProps) {
  const baseIconClass =
    'text-muted-foreground cursor-pointer hover:opacity-70 transition-opacity'

  const handleCopyImageUrl = useCallback(async () => {
    const url = photoUrl
    if (!url) {
      toast.error('图片链接不存在！', { duration: 500 })
      return
    }
    const res = await copyToClipboard(url)
    if (res.success) {
      let msg = '复制图片链接成功！'
      if (albumLicense != null) {
        msg = '图片版权归作者所有, 分享转载需遵循 ' + albumLicense + ' 许可协议！'
      }
      toast.success(msg, { duration: 1500 })
    } else {
      toast.error('复制图片链接失败！', { duration: 1000 })
    }
  }, [photoUrl, albumLicense])

  const handleCopyShareLink = useCallback(async () => {
    const shareUrl = buildShareUrl(photoId)
    if (!shareUrl) {
      toast.error('图片ID不存在！', { duration: 500 })
      return
    }
    const res = await copyToClipboard(shareUrl)
    if (res.success) {
      toast.success('复制分享直链成功！', { duration: 500 })
    } else {
      toast.error('复制分享直链失败！', { duration: 1000 })
    }
  }, [photoId])

  const handleDownload = useCallback(async () => {
    if (!photoUrl || !photoId) {
      toast.error('下载失败！', { duration: 500 })
      return
    }
    try {
      let msg = '开始下载，原图较大，请耐心等待！'
      if (albumLicense != null) {
        msg += '图片版权归作者所有, 分享转载需遵循 ' + albumLicense + ' 许可协议！'
      }
      toast.warning(msg, { duration: 1500 })

      const storageType = photoUrl.includes('s3') ? 's3' : 'r2'
      let response = await fetch(`/api/public/download/${photoId}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')
      if (contentType?.includes('application/json')) {
        const data = await response.json()
        response = await fetch(data.url)
      }
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      const parsedUrl = new URL(photoUrl ?? '')
      const filename = parsedUrl.pathname.split('/').pop()
      link.download = filename || 'downloaded-file.jpg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => {
        window.URL.revokeObjectURL(url)
      }, 0)
    } catch {
      toast.error('下载失败！', { duration: 500 })
    }
  }, [photoId, photoUrl, albumLicense])

  const sizeClass = variant === 'mobile' ? 'p-1 -m-1' : ''
  const iconSize = variant === 'mobile' ? 16 : 18
  const wrapperClass =
    variant === 'mobile' ? 'flex items-center gap-4 mb-1' : 'mt-3 pl-8 flex items-center gap-3'

  return (
    <div className={wrapperClass}>
      <CopyIcon
        className={cn(baseIconClass, sizeClass)}
        size={iconSize}
        onClick={handleCopyImageUrl}
      />
      <LinkIcon
        className={cn(baseIconClass, sizeClass)}
        size={iconSize}
        onClick={handleCopyShareLink}
      />
      {enableDownload && (
        <DownloadIcon
          className={cn(baseIconClass, sizeClass)}
          size={iconSize}
          onClick={handleDownload}
        />
      )}
    </div>
  )
}

const ImageActions = memo(ImageActionsImpl)

/* -------------------------------------------------------------------------- */
/*  主组件：图片卡片（IO 两阶段渲染 + 桌面/移动双布局）                       */
/* -------------------------------------------------------------------------- */

function GalleryImageImpl({
  photo,
  configData,
}: {
  photo: ImageType
  configData: { config_key: string; config_value: string }[]
}) {
  const router = useRouter()
  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const [inView, setInView] = useState(false)
  const [imgLoaded, setImgLoaded] = useState(false)

  /* 进入视口才开始渲染内容，避免大量图片/信息栏/标签/事件监听浪费 */
  useEffect(() => {
    if (inView) return
    const el = wrapperRef.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true)
            io.disconnect()
            return
          }
        }
      },
      { rootMargin: '800px 0px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [inView])

  /* 静态派生数据：用 useMemo 确保 memo 子组件收到稳定引用 */
  const derived = useMemo(() => {
    const customIndexOriginEnable =
      configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_origin_enable',
      )?.config_value.toString() === 'true'

    const imageSrc = customIndexOriginEnable
      ? photo.url || photo.preview_url
      : photo.preview_url || photo.url

    const imgW =
      typeof photo.width === 'number' && photo.width > 0 ? photo.width : 1200
    const imgH =
      typeof photo.height === 'number' && photo.height > 0 ? photo.height : 800

    const exifItems: ExifItem[] = []
    const exif = photo?.exif
    if (exif) {
      const cam = exif.make
        ? `${exif.make} ${exif.model ?? ''}`.trim()
        : exif.model ?? ''
      if (cam && cam.length > 0) {
        exifItems.push({ label: '相机型号', value: cam })
      }
      if (exif.data_time) {
        const parsed = dayjs(exif.data_time, 'YYYY:MM:DD HH:mm:ss')
        const value = parsed.isValid() ? parsed.format('YYYY-MM-DD') : exif.data_time
        exifItems.push({ label: '拍摄日期', value })
      }
      if (exif.f_number != null) {
        const raw = String(exif.f_number)
        const value = raw.startsWith('f/') ? raw : `f/${raw}`
        exifItems.push({ label: '光圈', value })
      }
      if (exif.exposure_time) {
        exifItems.push({ label: '快门速度', value: exif.exposure_time })
      }
      if (exif.focal_length) {
        exifItems.push({ label: '焦距', value: exif.focal_length })
      }
      if (exif.iso_speed_rating) {
        exifItems.push({ label: 'ISO', value: String(exif.iso_speed_rating) })
      }
    }

    const hasTitle = Boolean(photo.title)
    const hasDetail = Boolean(photo.detail)
    const hasExif = exifItems.length > 0
    const hasLabels = Boolean(photo?.labels && photo.labels.length > 0)
    const showInfoBlock = hasTitle || hasDetail || hasExif || hasLabels

    const enableDownload =
      configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_download_enable',
      )?.config_value.toString() === 'true'

    return {
      imageSrc,
      imgW,
      imgH,
      exifItems,
      hasTitle,
      hasDetail,
      hasExif,
      hasLabels,
      showInfoBlock,
      enableDownload,
    }
  }, [photo, configData])

  const handleImageClick = useCallback(() => {
    router.push(`/preview/${photo?.id}`)
  }, [router, photo?.id])

  return (
    <div ref={wrapperRef} className="w-full max-w-[1440px] mx-auto px-4 py-3">
      {/* 移动端和平板布局 */}
      <div className="lg:hidden">
        {derived.hasTitle && (
          <h5 className="text-sm font-medium text-foreground mb-2">{photo.title}</h5>
        )}

        {/* 图片容器：始终按宽高比占位；进入视口才真正请求图片 */}
        <div
          className="relative select-none shadow-md rounded overflow-hidden w-full mb-2"
          style={{ aspectRatio: `${derived.imgW} / ${derived.imgH}` }}
        >
          {!inView && <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden />}
          {inView && derived.imageSrc && (
            <img
              src={derived.imageSrc}
              alt={photo.title || ''}
              width={derived.imgW}
              height={derived.imgH}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onClick={handleImageClick}
              className={cn(
                'w-full h-auto block cursor-pointer',
                imgLoaded ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transition: 'opacity 0.25s ease-in-out' }}
            />
          )}
          {photo.type === 2 && inView && (
            <div className="absolute top-2 left-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-white opacity-75 drop-shadow-lg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" fill="none" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="12" r="5" />
                <line x1="15.9" y1="20.11" x2="15.9" y2="20.12" />
                <line x1="19.04" y1="17.61" x2="19.04" y2="17.62" />
                <line x1="20.77" y1="14" x2="20.77" y2="14.01" />
                <line x1="20.77" y1="10" x2="20.77" y2="10.01" />
                <line x1="19.04" y1="6.39" x2="19.04" y2="6.4" />
                <line x1="15.9" y1="3.89" x2="15.9" y2="3.9" />
                <line x1="12" y1="3" x2="12" y2="3.01" />
                <line x1="8.1" y1="3.89" x2="8.1" y2="3.9" />
                <line x1="4.96" y1="6.39" x2="4.96" y2="6.4" />
                <line x1="3.23" y1="10" x2="3.23" y2="10.01" />
                <line x1="3.23" y1="14" x2="3.23" y2="14.01" />
                <line x1="4.96" y1="17.61" x2="4.96" y2="17.62" />
                <line x1="8.1" y1="20.11" x2="8.1" y2="20.12" />
                <line x1="12" y1="21" x2="12" y2="21.01" />
              </svg>
            </div>
          )}
        </div>

        {/* 信息栏：进入视口后才渲染 */}
        {inView && (
          <>
            {derived.hasExif && (
              <ImageExif variant="mobile" items={derived.exifItems} />
            )}
            {derived.hasLabels && photo.labels && (
              <ImageLabels labels={photo.labels} layout="mobile" />
            )}
            <ImageActions
              photoId={photo.id}
              photoUrl={photo.url}
              albumLicense={photo.album_license}
              variant="mobile"
              enableDownload={derived.enableDownload}
            />
          </>
        )}
      </div>

      {/* 桌面端布局：左侧信息栏 + 右侧图片 */}
      <div className="hidden lg:flex lg:gap-6 lg:items-start">
        {inView && derived.showInfoBlock && (
          <div className="w-[20%] xl:w-[16.7%] shrink-0">
            <ImageHeader title={photo.title} detail={photo.detail} />
            {derived.hasExif && <ImageExif variant="desktop" items={derived.exifItems} />}
            {derived.hasLabels && photo.labels && (
              <ImageLabels labels={photo.labels} layout="desktop" />
            )}
            <ImageActions
              photoId={photo.id}
              photoUrl={photo.url}
              albumLicense={photo.album_license}
              variant="desktop"
              enableDownload={derived.enableDownload}
            />
          </div>
        )}

        <div
          className="flex-1 relative select-none shadow-md rounded overflow-hidden"
          style={{ aspectRatio: `${derived.imgW} / ${derived.imgH}` }}
        >
          {!inView && <div className="absolute inset-0 bg-muted animate-pulse" aria-hidden />}
          {inView && derived.imageSrc && (
            <img
              src={derived.imageSrc}
              alt={photo.title || ''}
              width={derived.imgW}
              height={derived.imgH}
              loading="lazy"
              decoding="async"
              onLoad={() => setImgLoaded(true)}
              onClick={handleImageClick}
              className={cn(
                'w-full h-auto block cursor-pointer',
                imgLoaded ? 'opacity-100' : 'opacity-0',
              )}
              style={{ transition: 'opacity 0.25s ease-in-out' }}
            />
          )}
          {photo.type === 2 && inView && (
            <div className="absolute top-2 left-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="text-white opacity-75 drop-shadow-lg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                strokeWidth="2"
                stroke="currentColor"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path stroke="none" fill="none" />
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="12" r="5" />
                <line x1="15.9" y1="20.11" x2="15.9" y2="20.12" />
                <line x1="19.04" y1="17.61" x2="19.04" y2="17.62" />
                <line x1="20.77" y1="14" x2="20.77" y2="14.01" />
                <line x1="20.77" y1="10" x2="20.77" y2="10.01" />
                <line x1="19.04" y1="6.39" x2="19.04" y2="6.4" />
                <line x1="15.9" y1="3.89" x2="15.9" y2="3.9" />
                <line x1="12" y1="3" x2="12" y2="3.01" />
                <line x1="8.1" y1="3.89" x2="8.1" y2="3.9" />
                <line x1="4.96" y1="6.39" x2="4.96" y2="6.4" />
                <line x1="3.23" y1="10" x2="3.23" y2="10.01" />
                <line x1="3.23" y1="14" x2="3.23" y2="14.01" />
                <line x1="4.96" y1="17.61" x2="4.96" y2="17.62" />
                <line x1="8.1" y1="20.11" x2="8.1" y2="20.12" />
                <line x1="12" y1="21" x2="12" y2="21.01" />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export const GalleryImage = memo(GalleryImageImpl)
export default GalleryImage
