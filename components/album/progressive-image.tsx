'use client'

import { ProgressiveImageProps } from '~/types/props.ts'
import { useEffect, useState, useRef } from 'react'
import Lightbox from 'yet-another-react-lightbox'
import { useTranslations } from 'next-intl'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'

const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
function snapWidth(w: number): number {
  for (const allowed of ALLOWED_WIDTHS) {
    if (allowed >= Math.ceil(w)) return allowed
  }
  return ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]
}

/**
 * 渐进式图片预览组件
 *
 * 改动：
 * - 默认只加载轻量 preview_url（不预取原图）
 * - 全屏 Lightbox 打开时才切换 src 为 previewUrl（当前设计中 previewUrl 即高质量版本）
 * - 禁止 WebGL context 泄漏：移除 yet-another-react-lightbox 的 plugins，保持纯 CSS 渲染
 * - 图片尺寸基于 EXIF 元数据（width/height props 来自数据库，已在上传时从 EXIF 读取）
 */
export default function ProgressiveImage(props: Readonly<ProgressiveImageProps>) {
  const t = useTranslations()
  const [showLightbox, setShowLightbox] = useState(Boolean(props.showLightbox))
  // 只有在全屏打开时才加载高清图（按需加载）
  const [fullresSrc, setFullresSrc] = useState<string | null>(null)
  const openedRef = useRef(false)

  useEffect(() => {
    setShowLightbox(Boolean(props.showLightbox))
  }, [props.showLightbox])

  // 全屏打开时，懒加载原图
  useEffect(() => {
    if (showLightbox && !openedRef.current) {
      openedRef.current = true
      setFullresSrc(props.previewUrl || null)
    }
  }, [showLightbox, props.previewUrl])

  const dataURL = useBlurImageDataUrl(props.blurhash)

  const handleClose = () => {
    setShowLightbox(false)
    // M5：关闭时重置 openedRef，支持用户重复打开全屏
    openedRef.current = false
    if (props.onShowLightboxChange) {
      props.onShowLightboxChange(false)
    }
  }

  if (!props.previewUrl || props.previewUrl.trim() === '') {
    return (
      <div className="flex items-center justify-center w-full h-[90vh] bg-gray-100">
        <div className="text-muted-foreground">{t('Tips.imageLoadFailed')}</div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* 预览图：直接用 preview_url（COS 上已是 WebP），不走 /_next/image 代理 */}
      <img
        src={props.previewUrl}
        alt={props.alt || 'image'}
        width={props.width}
        height={props.height}
        className="object-contain md:max-h-[90vh] cursor-pointer w-full"
        style={{
          backgroundImage: dataURL ? `url(${dataURL})` : undefined,
          backgroundSize: 'cover',
        }}
        loading="eager"
        fetchPriority="high"
        decoding="async"
        onClick={() => setShowLightbox(true)}
      />

      {/* 全屏 Lightbox：打开后才加载 src，避免重复加载 OOM */}
      <Lightbox
        open={showLightbox}
        close={handleClose}
        slides={fullresSrc ? [{ src: fullresSrc, alt: props.alt || 'image' }] : [{ src: props.previewUrl, alt: props.alt || 'image' }]}
        plugins={[]}
        carousel={{ finite: true }}
        render={{
          buttonPrev: () => null,
          buttonNext: () => null,
          buttonClose: () => null,
          slide: ({ slide }) => (
            <div
              onClick={handleClose}
              className="w-full h-full flex items-center justify-center cursor-pointer"
            >
              <img
                src={slide.src}
                alt={slide.alt}
                className="max-w-[100vw] max-h-[90vh] mx-auto object-contain cursor-pointer"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
          ),
        }}
        styles={{ root: { '--yarl__color_backdrop': 'rgba(0, 0, 0, .9)' } }}
        controller={{
          closeOnBackdropClick: true,
          closeOnPullUp: true,
          closeOnPullDown: true,
        }}
      />
    </div>
  )
}
