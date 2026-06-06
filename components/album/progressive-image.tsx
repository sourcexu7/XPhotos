'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef, useCallback } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { useTranslations } from 'next-intl'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { ArrowLeftIcon, X } from 'lucide-react'

export default function ProgressiveImage(props: Readonly<ProgressiveImageProps>) {
  const t = useTranslations()
  const [showLightbox, setShowLightbox] = useState(Boolean(props.showLightbox))
  const [fullresSrc, setFullresSrc] = useState<string | null>(null)
  const openedRef = useRef(false)
  const lightboxRef = useRef<any>(null)

  useEffect(() => {
    setShowLightbox(Boolean(props.showLightbox))
  }, [props.showLightbox])

  useEffect(() => {
    if (showLightbox && !openedRef.current) {
      openedRef.current = true
      setFullresSrc(props.previewUrl || null)
    }
  }, [showLightbox, props.previewUrl])

  const dataURL = useBlurImageDataUrl(props.blurhash)

  const handleClose = useCallback(() => {
    setShowLightbox(false)
    openedRef.current = false
    props.onShowLightboxChange?.(false)
  }, [props.onShowLightboxChange])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showLightbox) {
        handleClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [showLightbox, handleClose])

  if (!props.previewUrl || props.previewUrl.trim() === '') {
    return (
      <div className="flex items-center justify-center w-full h-[90vh] bg-gray-100">
        <div className="text-muted-foreground">{t('Tips.imageLoadFailed')}</div>
      </div>
    )
  }

  const slideSrc = fullresSrc ?? props.previewUrl

  return (
    <div className="relative">
      <img
        src={props.previewUrl}
        alt={props.alt || 'image'}
        width={props.width}
        height={props.height}
        className="object-contain md:max-h-[90vh] cursor-zoom-in w-full"
        style={{
          backgroundImage: dataURL ? `url(${dataURL})` : undefined,
          backgroundSize: 'cover',
        }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onClick={() => setShowLightbox(true)}
      />

      {/* 全屏遮罩层 - 独立于 Lightbox 渲染，确保能接收点击事件 */}
      {showLightbox && (
        <>
          {/* 背景遮罩层 - 点击关闭 */}
          <div
            className="fixed inset-0 z-[9998] bg-black/97"
            onClick={handleClose}
            style={{ touchAction: 'none' }}
          />

          {/* 关闭按钮 - 置于最高层级 */}
          <div className="fixed inset-x-0 top-0 z-[9999] flex justify-between p-3 pointer-events-none">
            <button
              onClick={handleClose}
              className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 active:bg-black/90 text-white backdrop-blur-sm touch-manipulation transition-colors"
              aria-label={t('Button.goBack') || '返回'}
              type="button"
            >
              <ArrowLeftIcon size={20} />
            </button>

            <button
              onClick={handleClose}
              className="pointer-events-auto w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 active:bg-black/90 text-white backdrop-blur-sm touch-manipulation transition-colors"
              aria-label={t('Button.close') || '关闭'}
              type="button"
            >
              <X size={20} />
            </button>
          </div>

          {/* 图片内容 - 置于遮罩层之上 */}
          <div
            className="fixed inset-0 z-[9998] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                handleClose()
              }
            }}
          >
            <img
              src={slideSrc}
              alt={props.alt || 'image'}
              onClick={(e) => e.stopPropagation()}
              style={{
                maxHeight: 'calc(100dvh - 80px)',
                maxWidth: '96vw',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain',
                cursor: 'default',
                WebkitTouchCallout: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        </>
      )}

      {/* 保持 Lightbox 组件但禁用其默认行为，避免重复渲染 */}
      <Lightbox
        ref={lightboxRef}
        open={false}
        close={() => {}}
        slides={[]}
        plugins={[]}
      />
    </div>
  )
}
