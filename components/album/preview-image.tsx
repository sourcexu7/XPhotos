'use client'

import type { HandleProps, PreviewImageHandleProps } from '~/types/props'
import type { ImageType } from '~/types'
import LivePhoto from '~/components/album/live-photo'
import { toast } from 'sonner'
import { LinkIcon } from '~/components/icons/link'
import { DownloadIcon } from '~/components/icons/download'
import { useRouter } from 'next-nprogress-bar'
import { CopyIcon } from '~/components/icons/copy'
import { RefreshCWIcon } from '~/components/icons/refresh-cw'
import { ArrowLeftIcon } from '~/components/icons/arrow-left'
import { ChevronLeftIcon } from '~/components/icons/chevron-left'
import { ChevronRightIcon } from '~/components/icons/chevron-right'
import { ExpandIcon } from '~/components/icons/expand'
import { useSwrHydrated } from '~/hooks/use-swr-hydrated'
import 'yet-another-react-lightbox/styles.css'
import { useState, useEffect, useCallback } from 'react'
import { useTranslations } from 'next-intl'
import ProgressiveImage from '~/components/album/progressive-image.tsx'
import { buildShareUrl, copyToClipboard } from '~/lib/clipboard'
import { buildExifRows, EXIF_FIELD_ICONS } from '~/lib/exif'
import { TagLink } from '~/components/ui/tag-link'
import { downloadImageFile, saveBlobToDevice } from '~/lib/image-download'

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

  const copyLinkEnabled =
    configData?.find((item) => item.config_key === 'custom_index_copy_link_enable')?.config_value?.toString() === 'true'

  const copyDirectLinkEnabled =
    configData?.find((item) => item.config_key === 'custom_index_copy_direct_link_enable')?.config_value?.toString() === 'true' || copyLinkEnabled

  const copyShareLinkEnabled =
    configData?.find((item) => item.config_key === 'custom_index_copy_share_link_enable')?.config_value?.toString() === 'true' || copyLinkEnabled

  // Fetch image list for prev/next navigation (pageSize=200 to cover as many images as possible)
  useEffect(() => {
    const album = props.data?.album_value || '/'
    fetch(`/api/v1/public/gallery/images?page=1&pageSize=200&album=${encodeURIComponent(album)}`)
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
    if (!url) { toast.error(t('Tips.imageUrlMissing'), { duration: 500 }); return }
    const res = await copyToClipboard(url)
    if (res.success) {
      let msg = t('Tips.copyImageSuccess')
      if (props.data?.album_license) msg = t('Tips.downloadLicense', { license: props.data.album_license })
      toast.success(msg, { duration: 1500 })
    } else {
      toast.error(t('Tips.copyImageFailed'), { duration: 1000 })
    }
  }

  const handleCopyShare = async () => {
    const shareUrl = buildShareUrl(props.id)
    if (!shareUrl) { toast.error(t('Tips.imageIdMissing'), { duration: 500 }); return }
    const res = await copyToClipboard(shareUrl)
    if (res.success) {
      toast.success(t('Tips.copyShareSuccess'), { duration: 500 })
    } else {
      toast.error(t('Tips.copyShareFailed'), { duration: 1000 })
    }
  }

  const handleDownload = async () => {
    setDownloading(true)
    try {
      let msg = t('Tips.downloadStart')
      if (props.data?.album_license) msg += t('Tips.downloadLicense', { license: props.data.album_license })
      toast.warning(msg, { duration: 1500 })

      const { blob, filename } = await downloadImageFile(props.id, props.data?.url || '')
      saveBlobToDevice(blob, filename)
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

  // 统一使用共享 EXIF 格式化（含单位、镜头/分辨率/位置字段，与单列主题保持一致）
  const exifRows = buildExifRows(props.data.exif, props.data)

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
            {exifRows.map(({ field, value }) => {
              const Icon = EXIF_FIELD_ICONS[field]
              return (
                <div key={field} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/30">
                  <Icon size={14} className="flex-shrink-0 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground w-16 flex-shrink-0">{t(`Exif.${field}`)}</span>
                  <span className="text-xs font-medium text-foreground truncate">{value}</span>
                </div>
              )
            })}
          </div>
        </section>
      )}
      {props.data!.labels && props.data!.labels.length > 0 && (
        <section>
          <div className="flex flex-wrap gap-x-3 gap-y-2">
            {props.data!.labels.map((tag: string) => (
              <TagLink key={tag} tag={tag} />
            ))}
          </div>
        </section>
      )}
      <section>
        <div className="pt-2 border-t border-border/60">
          <div className="grid grid-cols-2 gap-2 pt-4 pb-2">
            {copyDirectLinkEnabled && <ActionButton icon={<CopyIcon size={14} className="p-0 pointer-events-none" />} label={t('Preview.copyLink')} onClick={handleCopyUrl} disabled={!props.data!.url} />}
            {copyShareLinkEnabled && <ActionButton icon={<LinkIcon size={14} className="p-0 pointer-events-none" />} label={t('Preview.shareLink')} onClick={handleCopyShare} disabled={!props.id} />}
            {downloadEnabled && (
              <ActionButton
                icon={downloading ? <RefreshCWIcon size={14} className="p-0 pointer-events-none animate-spin" /> : <DownloadIcon size={14} className="p-0 pointer-events-none" />}
                label={t('Preview.download')} onClick={handleDownload} disabled={downloading}
              />
            )}
            <ActionButton icon={<ExpandIcon size={14} className="p-0 pointer-events-none" />} label={t('Preview.fullscreen')} onClick={() => setLightboxPhoto(true)} />
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
                flex items-center justify-center transition-colors touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
                flex items-center justify-center transition-colors touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
              className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              aria-label={t('Button.goBack')}>
              <ArrowLeftIcon size={18} className="p-0 pointer-events-none" />
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
            className="flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted transition-colors touch-manipulation text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
            aria-label={t('Button.goBack')}>
            <ArrowLeftIcon size={18} className="p-0 pointer-events-none" />
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
                w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              <ChevronLeftIcon size={18} />
            </button>
          )}
          {hasNext && (
            <button
              onClick={handleNext}
              aria-label={t('Button.next')}
              className="absolute top-1/2 right-3 -translate-y-1/2 z-10
                w-10 h-10 rounded-xl bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm
                flex items-center justify-center transition-colors touch-manipulation
                focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
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
      className="flex items-center gap-2 px-3 py-2.5 rounded-lg whitespace-nowrap
        bg-muted/60 hover:bg-accent text-muted-foreground hover:text-accent-foreground
        border border-transparent hover:border-accent text-xs font-medium
        active:scale-[0.98]
        transition-all duration-150
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60
        disabled:text-muted-foreground/60 disabled:bg-muted/30 disabled:border-transparent disabled:cursor-not-allowed
        touch-manipulation select-none"
    >
      <span className="flex-shrink-0 [&_svg]:transition-colors [&_svg]:duration-150">{icon}</span>
      {label}
    </button>
  )
}
