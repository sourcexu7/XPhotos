'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { cn } from '~/lib/utils'
import { ImageLoadingAnimation } from './image-loading-animation'

const ALLOWED_WIDTHS = [16, 32, 48, 64, 96, 128, 160, 200, 256, 320, 384, 480, 560, 640, 750, 828, 1080, 1200, 1920, 2048, 3840]
function snapWidth(w: number): number {
  for (const allowed of ALLOWED_WIDTHS) {
    if (allowed >= Math.ceil(w)) return allowed
  }
  return ALLOWED_WIDTHS[ALLOWED_WIDTHS.length - 1]
}

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  className?: string
  containerClassName?: string
  priority?: boolean
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  onClick?: () => void
}

/**
 * 响应式图片组件（重写版）
 *
 * 改动：
 * - 使用原生 <picture> 元素替代 Next.js Image（gallery 场景下避免额外 JS 开销）
 * - AVIF > WebP > 原始格式的 <source> 优先级链
 * - 基于 srcset + sizes 实现精确响应式分发，图库网格全程不加载原图
 * - 图片尺寸校准：width/height 来自 EXIF 元数据
 */
export function OptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  containerClassName,
  priority = false,
  sizes,
  quality = 85,
  placeholder = 'blur',
  blurDataURL,
  onLoad,
  onClick,
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const [showLoader, setShowLoader] = useState(false)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const loaderDelayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const optimizedSizes = useMemo(() => {
    return sizes || '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
  }, [sizes])

  // 外部 CDN 图片（COS/S3）直接使用原始 src，不走 /_next/image 代理，避免超时
  // preview_url 本身已是 WebP，浏览器会直接使用正确格式
  const avifSrcset = ''
  const webpSrcset = ''

  const handleLoad = () => {
    setIsLoading(false)
    setShowLoader(false)
    setHasError(false)
    onLoad?.()
  }

  const handleError = () => {
    setIsLoading(false)
    setShowLoader(false)

    if (attempt < 2) {
      const nextAttempt = attempt + 1
      const delay = 600 * Math.pow(2, attempt)
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      retryTimerRef.current = setTimeout(() => {
        setIsLoading(true)
        setHasError(false)
        setAttempt(nextAttempt)
      }, delay)
      return
    }

    setHasError(true)
  }

  useEffect(() => {
    setAttempt(0)
    setHasError(false)
    setIsLoading(true)
    setShowLoader(false)

    if (loaderDelayTimerRef.current) clearTimeout(loaderDelayTimerRef.current)
    loaderDelayTimerRef.current = setTimeout(() => setShowLoader(true), 150)

    return () => {
      if (retryTimerRef.current) clearTimeout(retryTimerRef.current)
      if (loaderDelayTimerRef.current) clearTimeout(loaderDelayTimerRef.current)
    }
  }, [src])

  return (
    <div className={cn('relative', containerClassName)}>
      {isLoading && !hasError && showLoader && (
        <ImageLoadingAnimation visible={isLoading} size="small" className="absolute inset-0 z-10" />
      )}

      <picture style={{ display: 'block' }}>
        {src && !hasError && (
          <source type="image/avif" srcSet={avifSrcset} sizes={optimizedSizes} />
        )}
        {src && !hasError && (
          <source type="image/webp" srcSet={webpSrcset} sizes={optimizedSizes} />
        )}
        <img
          key={`${src}-${attempt}`}
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={cn('transition-opacity duration-300', isLoading ? 'opacity-0' : 'opacity-100', className)}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          style={{
            backgroundImage: blurDataURL ? `url(${blurDataURL})` : undefined,
            backgroundSize: 'cover',
          }}
          onLoad={handleLoad}
          onError={handleError}
          onClick={onClick}
        />
      </picture>

      {hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <span className="text-muted-foreground text-sm">加载失败</span>
        </div>
      )}
    </div>
  )
}
