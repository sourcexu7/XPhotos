'use client'

import type { ImageType } from '~/types'
import { CopyIcon } from '~/components/icons/copy.tsx'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link.tsx'
import { cn } from '~/lib/utils'
import { DownloadIcon } from '~/components/icons/download.tsx'
import { useRouter } from 'next-nprogress-bar'
import { useTranslations } from 'next-intl'
import {
  memo,
  useCallback,
  useMemo,
  useRef,
  useEffect,
  useState,
} from 'react'
import { buildShareUrl, copyToClipboard } from '~/lib/clipboard'
import { buildExifRows, EXIF_FIELD_ICONS, type ExifRow } from '~/lib/exif'
import { downloadImageFile, saveBlobToDevice } from '~/lib/image-download'
import { TagLink } from '~/components/ui/tag-link'

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
        <p className="text-[13px] leading-relaxed text-muted-foreground break-words">{detail}</p>
      )}
    </div>
  )
}

const ImageHeader = memo(ImageHeaderImpl)

/* -------------------------------------------------------------------------- */
/*  子组件 2：EXIF 拍摄信息（桌面端图标版 + 移动端文本版，共用一个组件）        */
/* -------------------------------------------------------------------------- */

type ExifProps = {
  variant: 'desktop' | 'mobile'
  items: ExifRow[]
}

function ImageExifImpl({ variant, items }: ExifProps) {
  const t = useTranslations()
  if (items.length === 0) return null

  if (variant === 'mobile') {
    return (
      <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground mb-2">
        {items.map((item) => (
          <span key={item.field}>
            {t(`Exif.${item.field}`)}：{item.value}
          </span>
        ))}
      </div>
    )
  }

  return (
    <>
      <div className="pl-8 mt-4">
        <span className="text-[13px] font-medium text-muted-foreground">{t('Exif.title')}</span>
        <div className="w-[88px] h-px bg-border mt-1.5" />
      </div>
      <div className="mt-3">
        {items.map((item) => {
          const Icon = EXIF_FIELD_ICONS[item.field]
          return (
            <div
              key={item.field}
              className="mb-4 flex items-start gap-2.5 ml-8"
            >
              <Icon
                className="text-muted-foreground"
                size={15}
                style={{ marginTop: '2px' }}
              />
              <div className="flex flex-col gap-0.5 min-w-0">
                <span className="text-xs text-muted-foreground">{t(`Exif.${item.field}`)}</span>
                <span className="text-[13px] text-foreground break-words">{item.value}</span>
              </div>
            </div>
          )
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
  const containerClass =
    layout === 'desktop'
      ? 'mt-3 pl-8 flex flex-wrap gap-x-3 gap-y-2'
      : 'flex flex-wrap gap-x-3 gap-y-2 mb-2'

  return (
    <div className={containerClass}>
      {labels.map((tag) => (
        <TagLink key={tag} tag={tag} />
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
  enableCopyDirectLink: boolean
  enableCopyShareLink: boolean
}

/** 图标操作按钮：真实 button 元素，带 aria-label / title 提示与键盘可达性 */
function ActionIconButton({
  label,
  onClick,
  variant,
  children,
}: {
  label: string
  onClick: () => void
  variant: 'mobile' | 'desktop'
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/60',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 transition-colors touch-manipulation',
        variant === 'mobile' ? 'p-3' : 'p-2',
      )}
    >
      {children}
    </button>
  )
}

function ImageActionsImpl({
  photoId,
  photoUrl,
  albumLicense,
  variant,
  enableDownload,
  enableCopyDirectLink,
  enableCopyShareLink,
}: ActionsProps) {
  const t = useTranslations()

  const handleCopyImageUrl = useCallback(async () => {
    if (!photoUrl) {
      toast.error(t('Tips.imageUrlMissing'), { duration: 500 })
      return
    }
    const res = await copyToClipboard(photoUrl)
    if (res.success) {
      let msg = t('Tips.copyImageSuccess')
      if (albumLicense != null) {
        msg = t('Tips.downloadLicense', { license: albumLicense })
      }
      toast.success(msg, { duration: 1500 })
    } else {
      toast.error(t('Tips.copyImageFailed'), { duration: 1000 })
    }
  }, [photoUrl, albumLicense, t])

  const handleCopyShareLink = useCallback(async () => {
    const shareUrl = buildShareUrl(photoId)
    if (!shareUrl) {
      toast.error(t('Tips.imageIdMissing'), { duration: 500 })
      return
    }
    const res = await copyToClipboard(shareUrl)
    if (res.success) {
      toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
    } else {
      toast.error(t('Tips.copyShareFailed'), { duration: 1000 })
    }
  }, [photoId, t])

  const handleDownload = useCallback(async () => {
    if (!photoUrl || !photoId) {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
      return
    }
    try {
      let msg = t('Tips.downloadStart')
      if (albumLicense != null) {
        msg += t('Tips.downloadLicense', { license: albumLicense })
      }
      toast.warning(msg, { duration: 1500 })

      const { blob, filename } = await downloadImageFile(photoId, photoUrl)
      saveBlobToDevice(blob, filename)
    } catch {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
    }
  }, [photoId, photoUrl, albumLicense, t])

  const iconSize = variant === 'mobile' ? 16 : 18
  const iconClass = 'p-0 pointer-events-none'
  const wrapperClass =
    variant === 'mobile' ? 'flex items-center gap-1 mb-1' : 'mt-3 pl-8 flex items-center gap-1'

  return (
    <div className={wrapperClass}>
      {enableCopyDirectLink && (
        <ActionIconButton label={t('Preview.copyLink')} onClick={handleCopyImageUrl} variant={variant}>
          <CopyIcon size={iconSize} className={iconClass} />
        </ActionIconButton>
      )}
      {enableCopyShareLink && (
        <ActionIconButton label={t('Preview.shareLink')} onClick={handleCopyShareLink} variant={variant}>
          <LinkIcon size={iconSize} className={iconClass} />
        </ActionIconButton>
      )}
      {enableDownload && (
        <ActionIconButton label={t('Preview.download')} onClick={handleDownload} variant={variant}>
          <DownloadIcon size={iconSize} className={iconClass} />
        </ActionIconButton>
      )}
    </div>
  )
}

const ImageActions = memo(ImageActionsImpl)

/* LivePhoto 角标（移动端/桌面端共用，避免重复 SVG） */
function LivePhotoBadge() {
  return (
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
  )
}

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

    const exifItems: ExifRow[] = buildExifRows(photo?.exif, photo)

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

    const enableCopyDirectLink =
      (configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_copy_direct_link_enable',
      )?.config_value.toString() === 'true') ||
      (configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_copy_link_enable',
      )?.config_value.toString() === 'true')

    const enableCopyShareLink =
      (configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_copy_share_link_enable',
      )?.config_value.toString() === 'true') ||
      (configData?.find(
        (item: { config_key: string; config_value: unknown }) =>
          item.config_key === 'custom_index_copy_link_enable',
      )?.config_value.toString() === 'true')

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
      enableCopyDirectLink,
      enableCopyShareLink,
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
          {photo.type === 2 && inView && <LivePhotoBadge />}
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
              enableCopyDirectLink={derived.enableCopyDirectLink}
              enableCopyShareLink={derived.enableCopyShareLink}
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
              enableCopyDirectLink={derived.enableCopyDirectLink}
              enableCopyShareLink={derived.enableCopyShareLink}
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
          {photo.type === 2 && inView && <LivePhotoBadge />}
        </div>
      </div>
    </div>
  )
}

export const GalleryImage = memo(GalleryImageImpl)
export default GalleryImage
