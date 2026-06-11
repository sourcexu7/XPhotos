'use client'

import type { HandleProps, PreviewImageHandleProps } from '~/types/props'
import type { ImageType } from '~/types'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import dayjs from 'dayjs'
import { useRouter } from 'next-nprogress-bar'
import { ClockIcon } from '~/components/icons/clock'
import { CameraIcon } from '~/components/icons/camera'
import { ApertureIcon } from '~/components/icons/aperture'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { CompassIcon } from '~/components/icons/compass'
import { TimerIcon } from '~/components/icons/timer'
import { TelescopeIcon } from '~/components/icons/telescope'
import { ArrowLeftIcon } from '~/components/icons/arrow-left'
import { ChevronLeftIcon } from '~/components/icons/chevron-left'
import { ChevronRightIcon } from '~/components/icons/chevron-right'
import { ExpandIcon } from '~/components/icons/expand'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import 'yet-another-react-lightbox/styles.css'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import ProgressiveImage from '~/components/album/progressive-image.tsx'

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const [downloading, setDownloading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<boolean>(false)
  const [imageList, setImageList] = useState<ImageType[]>([])
  const [currentIndex, setCurrentIndex] = useState(-1)

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps) as { data: { config_key: string; config_value: string }[] | undefined }

  const downloadEnabled =
    configData?.find((item) => item.config_key === 'custom_index_download_enable')?.config_value?.toString() === 'true'

  // Fetch image list for prev/next navigation
  useEffect(() => {
    const album = props.data?.album_value || '/'
    fetch(`/api/v1/public/gallery/images?page=1&album=${encodeURIComponent(album)}`)
      .then(res => res.json())
      .then((data: { items: ImageType[] }) => {
        const items = data.items || []
        setImageList(items)
        const idx = items.findIndex((img: ImageType) => img.id === props.id)
        setCurrentIndex(idx)
      })
      .catch(() => { setImageList([]); setCurrentIndex(-1) })
  }, [props.id, props.data?.album_value])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      const prevImage = imageList[currentIndex - 1]
      router.replace(`/preview/${prevImage.id}`)
    }
  }, [currentIndex, imageList, router])

  const handleNext = useCallback(() => {
    if (currentIndex < imageList.length - 1) {
      const nextImage = imageList[currentIndex + 1]
      router.replace(`/preview/${nextImage.id}`)
    }
  }, [currentIndex, imageList, router])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxPhoto) return
      if (e.key === 'ArrowLeft') handlePrev()
      if (e.key === 'ArrowRight') handleNext()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handlePrev, handleNext, lightboxPhoto])

  const handleClose = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back()
      return
    }
    router.push(props.data?.album_value ?? '/')
  }

  const handleCopyUrl = async () => {
    const url = props.data?.url
    if (!url) { toast.error('图片链接不存在！', { duration: 500 }); return }
    try {
      await navigator.clipboard.writeText(url)
      let msg = t('Tips.copyImageSuccess')
      if (props.data?.album_license) msg = t('Tips.downloadLicense', { license: props.data.album_license })
      toast.success(msg, { duration: 1500 })
    } catch {
      toast.error(t('Tips.copyImageFailed'), { duration: 1000 })
    }
  }

  const handleCopyShare = async () => {
    if (!props.id) { toast.error('图片ID不存在！', { duration: 500 }); return }
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/preview/${props.id}`)
      toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
    } catch {
      toast.error(t('Tips.copyShareFailed'), { duration: 1000 })
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      let msg = t('Tips.downloadStart')
      if (props.data?.album_license) msg += t('Tips.downloadLicense', { license: props.data.album_license })
      toast.warning(msg, { duration: 1500 })

      const storageType = props.data?.url?.includes('s3') ? 's3' : 'r2'
      let response = await fetch(`/api/public/download/${props.id}?storage=${storageType}`)
      const contentType = response.headers.get('content-type')

      let blob: Blob
      let filename = 'download.jpg'

      if (contentType?.includes('application/json')) {
        const data = await response.json()
        filename = decodeURIComponent(data.filename || filename)
        response = await fetch(data.url)
        blob = await response.blob()
      } else {
        const cd = response.headers.get('content-disposition')
        if (cd) {
          const m = cd.match(/filename="([^"]+)"/)
          if (m) filename = decodeURIComponent(m[1])
        }
        blob = await response.blob()
      }

      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.setTimeout(() => window.URL.revokeObjectURL(url), 0)
    } catch {
      toast.error(t('Tips.downloadFailed'), { duration: 500 })
    } finally {
      setDownloading(false)
    }
  }

  const hasPrev = currentIndex > 0
  const hasNext = currentIndex < imageList.length - 1

  // Loading skeleton
  if (!props.data) {
    return (
      <div>
        {/* 桌面端：横向布局 */}
        <div className="hidden lg:flex h-screen w-full flex-row overflow-hidden bg-background">
          <div className="flex-1 min-w-0 flex items-center justify-center">
            <div className="w-3/4 h-3/4 rounded-xl bg-muted animate-pulse" />
          </div>
          <aside className="w-[320px] flex-shrink-0 bg-card border-l border-border overflow-y-auto">
            <div className="px-6 py-5 border-b border-border">
              <div className="h-6 w-3/4 rounded-lg bg-muted animate-pulse" />
            </div>
            <div className="px-6 py-5 space-y-4">
              <div className="h-4 w-full rounded bg-muted animate-pulse" />
              <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
              <div className="space-y-3 mt-6">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                    <div className="w-14 h-3 rounded bg-muted animate-pulse" />
                    <div className="flex-1 h-3 rounded bg-muted animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        {/* 移动端：简单纵向堆叠 */}
        <div className="lg:hidden">
          <div className="px-4 py-3 border-b border-border bg-background sticky top-0 z-10">
            <div className="h-5 w-1/2 rounded bg-muted animate-pulse" />
          </div>
          <div className="w-full min-h-[50dvh] flex items-center justify-center bg-muted/30">
            <div className="w-3/4 aspect-square rounded-xl bg-muted animate-pulse" />
          </div>
          <div className="px-4 py-5 space-y-4 bg-card">
            <div className="h-4 w-full rounded bg-muted animate-pulse" />
            <div className="h-4 w-2/3 rounded bg-muted animate-pulse" />
            <div className="space-y-3 mt-6">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex items-center gap-3">
                  <div className="w-4 h-4 rounded bg-muted animate-pulse" />
                  <div className="w-14 h-3 rounded bg-muted animate-pulse" />
                  <div className="flex-1 h-3 rounded bg-muted animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  const exif = props.data.exif
  const cam = exif?.make ? `${exif.make} ${exif.model ?? ''}`.trim() : (exif?.model ?? '')
  const shotDate = exif?.data_time
    ? (dayjs(exif.data_time, 'YYYY:MM:DD HH:mm:ss').isValid()
        ? dayjs(exif.data_time, 'YYYY:MM:DD HH:mm:ss').format('YYYY-MM-DD')
        : exif.data_time)
    : null

  const hasLocation = props.data.lat && props.data.lon

  const exifRows = [
    { icon: CameraIcon,    label: t('Exif.camera'),    value: cam || null },
    { icon: TelescopeIcon, label: t('Exif.lens'),      value: exif?.lens_model ?? null },
    { icon: ClockIcon,     label: t('Exif.date'),      value: shotDate },
    { icon: ApertureIcon,  label: t('Exif.aperture'),  value: exif?.f_number ?? null },
    { icon: TimerIcon,     label: t('Exif.shutter'),   value: exif?.exposure_time ?? null },
    { icon: CrosshairIcon, label: t('Exif.focalLength'), value: exif?.focal_length ?? null },
    { icon: GaugeIcon,     label: t('Exif.iso'),       value: exif?.iso_speed_rating ?? null },
    {
      icon: ExpandIcon,
      label: t('Exif.resolution'),
      value: props.data.width && props.data.height ? `${props.data.width} × ${props.data.height}` : null,
    },
    ...(hasLocation ? [{ icon: CompassIcon, label: t('Exif.location'), value: `${props.data.lat}, ${props.data.lon}` }] : []),
  ].filter((r) => r.value)

  // ========== 共享：图片元素 ==========
  const renderImage = () => {
    if (props.data!.type === 1) {
      return (
        <ProgressiveImage
          imageUrl={props.data!.preview_url || props.data!.url}
          previewUrl={props.data!.preview_url || props.data!.url}
          alt={props.data!.title}
          height={props.data!.height}
          width={props.data!.width}
          blurhash={props.data!.blurhash}
          showLightbox={lightboxPhoto}
          onShowLightboxChange={(v) => setLightboxPhoto(v)}
        />
      )
    }
    return <LivePhoto url={props.data!.preview_url || props.data!.url || ''} videoUrl={props.data!.video_url || ''} />
  }

  // ========== 共享：信息侧栏内容 ==========
  const renderInfoContent = () => (
    <>
      {props.data!.detail && (
        <p className="text-sm text-muted-foreground leading-relaxed">{props.data!.detail}</p>
      )}
      {exifRows.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              {t('Exif.title')}
            </span>
            <div className="flex-1 h-px bg-border" />
          </div>
          <div className="space-y-2">
            {exifRows.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                <Icon size={14} className="flex-shrink-0 text-muted-foreground" />
                <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{label}</span>
                <span className="text-xs font-medium text-foreground truncate">{String(value)}</span>
              </div>
            ))}
          </div>
        </section>
      )}
      {props.data!.labels && props.data!.labels.length > 0 && (
        <section>
          <div className="flex flex-wrap gap-1.5">
            {props.data!.labels.map((tag: string) => (
              <button key={tag} onClick={() => router.push(`/tag/${tag}`)}
                className="inline-flex items-center gap-0.5 px-2.5 py-1 rounded-lg text-xs font-medium
                  bg-muted/60 text-muted-foreground border border-transparent
                  hover:bg-accent hover:text-accent-foreground hover:border-accent
                  active:scale-95
                  transition-all duration-150 touch-manipulation">
                <span className="text-muted-foreground/50 font-normal">#</span>{tag}
              </button>
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="pt-2 border-t border-border/60">
          <div className="grid grid-cols-2 gap-2 pt-4 pb-2">
            <ActionButton icon={<CopyIcon size={14} />} label={t('Preview.copyLink')} onClick={handleCopyUrl} disabled={!props.data!.url} />
            <ActionButton icon={<LinkIcon size={14} />} label={t('Preview.shareLink')} onClick={handleCopyShare} disabled={!props.id} />
            {downloadEnabled && (
              <ActionButton
                icon={downloading ? <RefreshCWIcon size={14} className="animate-spin" /> : <DownloadIcon size={14} />}
                label={t('Preview.download')} onClick={handleDownload} disabled={downloading}
              />
            )}
            <ActionButton icon={<ExpandIcon size={14} />} label={t('Preview.fullscreen')} onClick={() => setLightboxPhoto(true)} />
          </div>
        </div>
      </section>
    </>
  )

  // ========== 主渲染：两套完全独立的布局 ==========
  return (
    <div>
      {/* ── 桌面端（lg+）：横向布局，固定视口高度，图片居左，信息栏居右 ── */}
      <div className="hidden lg:flex h-screen w-full flex-row overflow-hidden bg-background">
        {/* 图片区 */}
        <div className="relative flex-1 min-w-0 flex items-center justify-center">
          <div className="w-full h-full flex items-center justify-center">
            {renderImage()}
          </div>
          {hasPrev && (
            <button
              onClick={handlePrev}
              aria-label={t('Button.prev')}
              className="absolute top-1/2 -translate-y-1/2 z-20 left-4
                w-11 h-11 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation"
            >
              <ChevronLeftIcon size={20} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={handleNext}
              aria-label={t('Button.next')}
              className="absolute top-1/2 -translate-y-1/2 z-20 right-4
                w-11 h-11 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation"
            >
              <ChevronRightIcon size={20} />
            </button>
          )}
        </div>

        {/* 信息栏（内部可滚动） */}
        <aside className="w-[300px] xl:w-[340px] flex-shrink-0 bg-card border-l border-border overflow-y-auto">
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-5 items-start justify-between gap-3 flex">
            <h1 className="text-lg font-bold text-card-foreground leading-snug line-clamp-2 flex-1">
              {props.data!.title || t('Preview.untitled')}
            </h1>
            <button onClick={handleClose}
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation text-muted-foreground hover:text-foreground"
              aria-label={t('Button.goBack')}>
              <ArrowLeftIcon size={18} />
            </button>
          </div>
          <div className="px-6 py-5 space-y-5">
            {renderInfoContent()}
          </div>
        </aside>
      </div>

      {/* ── 移动端（<lg）：纵向堆叠，跟随文档流，浏览器原生滚动 ── */}
      <div className="lg:hidden bg-background">
        {/* 顶部导航（sticky 吸顶） */}
        <div className="sticky top-0 z-20 bg-background/90 backdrop-blur-sm px-4 py-3 flex items-center justify-between border-b border-border">
          <h1 className="text-sm font-bold text-foreground leading-snug line-clamp-1 flex-1 mr-3">
            {props.data!.title || t('Preview.untitled')}
          </h1>
          <button onClick={handleClose}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation text-muted-foreground"
            aria-label={t('Button.goBack')}>
            <ArrowLeftIcon size={18} />
          </button>
        </div>

        {/* 图片（自然宽高，按原始比例显示） */}
        <div className="w-full relative bg-muted/20">
          {renderImage()}

          {/* 翻页按钮 */}
          {hasPrev && (
            <button
              onClick={handlePrev}
              aria-label={t('Button.prev')}
              className="absolute top-1/2 left-3 -translate-y-1/2 z-10
                w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation"
            >
              <ChevronLeftIcon size={18} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={handleNext}
              aria-label={t('Button.next')}
              className="absolute top-1/2 right-3 -translate-y-1/2 z-10
                w-10 h-10 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation"
            >
              <ChevronRightIcon size={18} />
            </button>
          )}
        </div>

        {/* 信息区（紧随图片下方，随页面滚动） */}
        <div className="bg-card border-t border-border">
          <div className="px-5 py-5 space-y-5">
            {renderInfoContent()}
          </div>
        </div>
      </div>
    </div>
  )
}

/* 小操作按钮 */
function ActionButton({
  icon,
  label,
  onClick,
  disabled,
}: {
  icon: React.ReactNode
  label: string
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg
        bg-muted/60 hover:bg-accent text-muted-foreground hover:text-accent-foreground
        border border-transparent hover:border-accent text-xs font-medium
        active:scale-[0.98]
        transition-all duration-150
        disabled:text-muted-foreground/60 disabled:bg-muted/30 disabled:border-transparent disabled:cursor-not-allowed
        touch-manipulation select-none"
    >
      <span className="flex-shrink-0 [&_svg]:transition-colors [&_svg]:duration-150">{icon}</span>
      {label}
    </button>
  )
}
