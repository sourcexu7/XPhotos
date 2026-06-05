'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { useTranslations } from 'next-intl'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { XIcon } from '~/components/icons/x'
import { ArrowLeftIcon } from 'lucide-react'

export default function ProgressiveImage(props: Readonly<ProgressiveImageProps>) {
  const t = useTranslations()
  const [showLightbox, setShowLightbox] = useState(Boolean(props.showLightbox))
  const [fullresSrc, setFullresSrc] = useState<string | null>(null)
  const openedRef = useRef(false)

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

  const handleClose = () => {
    setShowLightbox(false)
    openedRef.current = false
    props.onShowLightboxChange?.(false)
  }

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

      <Lightbox
        open={showLightbox}
        close={handleClose}
        slides={[{ src: slideSrc, alt: props.alt || 'image', width: props.width, height: props.height }]}
        plugins={[]}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          // render.buttonClose 渲染在 YARL toolbar 内，用 fixed 逃出父容器定位到视口角落
          buttonClose: () => (
            <>
              {/* 左上角返回按钮 — 移动端习惯 */}
              <button
                onClick={handleClose}
                style={{ position: 'fixed', top: 'max(env(safe-area-inset-top), 12px)', left: '12px', zIndex: 9999 }}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 active:bg-black/90 text-white backdrop-blur-sm touch-manipulation transition-colors"
                aria-label={t('Button.goBack') || '返回'}
              >
                <ArrowLeftIcon size={20} />
              </button>

              {/* 右上角关闭按钮 */}
              <button
                onClick={handleClose}
                style={{ position: 'fixed', top: 'max(env(safe-area-inset-top), 12px)', right: '12px', zIndex: 9999 }}
                className="w-11 h-11 sm:w-12 sm:h-12 flex items-center justify-center rounded-full bg-black/55 hover:bg-black/80 active:bg-black/90 text-white backdrop-blur-sm touch-manipulation transition-colors"
                aria-label={t('Button.close') || '关闭'}
              >
                <XIcon size={20} />
              </button>
            </>
          ),
          slide: ({ slide }) => (
            // 背景区域点击关闭，图片本身阻止冒泡
            <div
              className="w-full h-full flex items-center justify-center cursor-pointer"
              onClick={handleClose}
            >
              <img
                src={slide.src}
                alt={slide.alt ?? 'image'}
                onClick={(e) => e.stopPropagation()}
                style={{
                  // 留出顶部按钮空间（约 60px），底部安全区
                  maxHeight: 'calc(100dvh - 80px)',
                  maxWidth: '96vw',
                  width: 'auto',
                  height: 'auto',
                  objectFit: 'contain',
                  cursor: 'default',
                  // 防止 iOS 长按菜单干扰
                  WebkitTouchCallout: 'none',
                  userSelect: 'none',
                }}
              />
            </div>
          ),
        }}
        styles={{
          root: { '--yarl__color_backdrop': 'rgba(0,0,0,0.97)' },
          container: { cursor: 'pointer' },
        }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullUp: true,
          closeOnPullDown: true,
        }}
      />
    </div>
  )
}
