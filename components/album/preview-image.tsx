'use client'

import type { HandleProps, ImageDataProps, PreviewImageHandleProps } from '~/types/props'
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
import { ArrowLeftIcon } from 'lucide-react'

export default function PreviewImage(props: Readonly<PreviewImageHandleProps>) {
  const router = useRouter()
  const t = useTranslations()
  const [downloading, setDownloading] = useState(false)
  const [lightboxPhoto, setLightboxPhoto] = useState<boolean>(false)

  const configProps: HandleProps = {
    handle: props.configHandle,
    args: 'system-config',
  }
  const { data: configData } = useSwrHydrated(configProps)

  const downloadEnabled =
    configData?.find((item: any) => item.config_key === 'custom_index_download_enable')?.config_value?.toString() === 'true'

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

  if (!props.data) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">{t('Tips.loading')}</p>
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

  const exifRows = [
    { icon: CameraIcon,    label: '相机型号', value: cam || null },
    { icon: ClockIcon,     label: '拍摄日期', value: shotDate },
    { icon: ApertureIcon,  label: '光圈',     value: exif?.f_number ?? null },
    { icon: CrosshairIcon, label: '焦距',     value: exif?.focal_length ?? null },
    { icon: GaugeIcon,     label: 'ISO',      value: exif?.iso_speed_rating ?? null },
    {
      icon: ExpandIcon,
      label: '分辨率',
      value: props.data.width && props.data.height ? `${props.data.width} × ${props.data.height}` : null,
    },
  ].filter((r) => r.value)

  const ImageSlot = (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {props.data.type === 1 ? (
        <ProgressiveImage
          imageUrl={props.data.preview_url || props.data.url}
          previewUrl={props.data.preview_url || props.data.url}
          alt={props.data.title}
          height={props.data.height}
          width={props.data.width}
          blurhash={props.data.blurhash}
          showLightbox={lightboxPhoto}
          onShowLightboxChange={(v) => setLightboxPhoto(v)}
        />
      ) : (
        <LivePhoto url={props.data.preview_url || props.data.url} videoUrl={props.data.video_url} className="max-h-[90vh]" />
      )}
    </div>
  )

  return (
    <div className="w-full h-full flex flex-col lg:flex-row overflow-hidden bg-background" style={{ maxWidth: 1440, margin: '0 auto' }}>

      {/* ── Mobile: image on top ── */}
      <div className="lg:hidden w-full flex-shrink-0" style={{ minHeight: 280 }}>
        {ImageSlot}
      </div>

      {/* ── Sidebar ── */}
      <aside
        className="
          w-full lg:w-[300px] xl:w-[320px] flex-shrink-0
          flex flex-col
          border-t lg:border-t-0 lg:border-r border-border
          bg-card
          overflow-y-auto
        "
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm border-b border-border px-5 py-4 flex items-start justify-between gap-3">
          <h1 className="text-base font-semibold text-card-foreground leading-snug line-clamp-2 flex-1">
            {props.data.title || '未命名'}
          </h1>
          <button
            onClick={handleClose}
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors touch-manipulation text-muted-foreground hover:text-foreground"
            aria-label={t('Button.goBack')}
          >
            <ArrowLeftIcon size={18} />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 space-y-5">

          {/* Description */}
          {props.data.detail && (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {props.data.detail}
            </p>
          )}

          {/* EXIF block */}
          {exifRows.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">拍摄参数</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="rounded-xl overflow-hidden border border-border divide-y divide-border">
                {exifRows.map(({ icon: Icon, label, value }, i) => (
                  <div
                    key={label}
                    className={cn(
                      'flex items-center gap-3 px-4 py-2.5',
                      i % 2 === 0 ? 'bg-card' : 'bg-muted/40',
                    )}
                  >
                    <Icon size={14} className="flex-shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-14 flex-shrink-0">{label}</span>
                    <span className="text-xs font-medium text-foreground truncate">{String(value)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Tags */}
          {props.data.labels && props.data.labels.length > 0 && (
            <section>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">标签</span>
                <div className="flex-1 h-px bg-border" />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {props.data.labels.map((tag: string) => (
                  <button
                    key={tag}
                    onClick={() => router.push(`/tag/${tag}`)}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-muted text-foreground border border-border hover:bg-accent hover:text-accent-foreground hover:border-accent transition-all duration-150 touch-manipulation"
                  >
                    # {tag}
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Actions */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">操作</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <ActionButton icon={<CopyIcon size={15} />} label="复制直链" onClick={handleCopyUrl} disabled={!props.data.url} />
              <ActionButton icon={<LinkIcon size={15} />} label="分享链接" onClick={handleCopyShare} disabled={!props.id} />
              {downloadEnabled && (
                <ActionButton
                  icon={downloading ? <RefreshCWIcon size={15} className="animate-spin" /> : <DownloadIcon size={15} />}
                  label="下载原图"
                  onClick={handleDownload}
                  disabled={downloading}
                />
              )}
              <ActionButton
                icon={<ExpandIcon size={15} />}
                label="全屏查看"
                onClick={() => setLightboxPhoto(true)}
              />
            </div>
          </section>

        </div>
      </aside>

      {/* ── Desktop: image area ── */}
      <div className="hidden lg:flex flex-1 min-w-0 items-center justify-center bg-muted/20 p-4">
        {ImageSlot}
      </div>

    </div>
  )
}

/* ── Small reusable action button ── */
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
      className="
        flex items-center gap-2 px-3 py-2.5 rounded-lg
        bg-muted hover:bg-accent
        text-foreground hover:text-accent-foreground
        border border-border hover:border-accent
        text-xs font-medium
        transition-all duration-150
        disabled:opacity-40 disabled:cursor-not-allowed
        touch-manipulation select-none
      "
    >
      <span className="flex-shrink-0 text-muted-foreground group-hover:text-accent-foreground">{icon}</span>
      {label}
    </button>
  )
}
