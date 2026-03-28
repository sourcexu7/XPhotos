/**
 * 通用图片组件
 * 支持 Next.js Image 和原生 img 两种模式
 * 在图片加载时显示加载动效，加载完成后自动隐藏
 * 性能优化：支持 WebP/AVIF 格式、自动优化、懒加载、错误重试
 */

'use client'

import { useState, useEffect, useMemo, useRef, forwardRef } from 'react'
import type { SyntheticEvent, ComponentProps, ImgHTMLAttributes } from 'react'
import Image from 'next/image'
import { ImageLoadingAnimation } from './image-loading-animation'
import { cn } from '~/lib/utils'

interface BaseImageProps {
  /**
   * 是否显示加载动效
   * @default true
   */
  showLoading?: boolean
  /**
   * 加载动效大小
   * @default 'medium'
   */
  loadingSize?: 'small' | 'medium' | 'large'
  /**
   * 加载动效圆圈颜色
   * @default '#fff'
   */
  loadingCircleColor?: string
  /**
   * 加载动效阴影颜色
   * @default 'rgba(0, 0, 0, 0.9)'
   */
  loadingShadowColor?: string
  /**
   * 图片容器的类名
   */
  containerClassName?: string
  /**
   * 图片加载完成后的回调
   */
  onLoadComplete?: () => void
  /**
   * 使用原生 img 标签
   * @default false
   */
  useNativeImg?: boolean
  /**
   * 是否优先加载（用于首屏图片）
   * @default false
   */
  priority?: boolean
  /**
   * 响应式尺寸配置
   */
  sizes?: string
  /**
   * 图片质量 (1-100)
   * @default 85
   */
  quality?: number
  /**
   * 占位符类型
   * @default 'blur'
   */
  placeholder?: 'blur' | 'empty'
  /**
   * 模糊占位符数据 URL
   */
  blurDataURL?: string
  /**
   * 点击回调
   */
  onClick?: () => void
  /**
   * 最大重试次数
   * @default 2
   */
  maxRetries?: number
}

export type ImageProps = BaseImageProps & (
  | (ComponentProps<typeof Image> & { useNativeImg?: false })
  | (ImgHTMLAttributes<HTMLImageElement> & { useNativeImg: true })
)

/**
 * 通用图片组件
 * 支持 Next.js Image 和原生 img 两种模式
 */
export const ImageComponent = forwardRef<HTMLImageElement, ImageProps>(
  (
    {
      showLoading = true,
      loadingSize = 'medium',
      loadingCircleColor = '#fff',
      loadingShadowColor = 'rgba(0, 0, 0, 0.9)',
      containerClassName = '',
      onLoadComplete,
      useNativeImg = false,
      className = '',
      priority = false,
      sizes,
      quality = 85,
      placeholder = 'blur',
      blurDataURL,
      onClick,
      maxRetries = 2,
      ...props
    },
    ref
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)
    const [attempt, setAttempt] = useState(0)
    const retryTimerRef = useRef<number | null>(null)

    const src = useNativeImg
      ? (props as ImgHTMLAttributes<HTMLImageElement>).src
      : (props as ComponentProps<typeof Image>).src

    // 性能优化：计算响应式 sizes
    const optimizedSizes = useMemo(() => {
      if (sizes) return sizes
      return '(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw'
    }, [sizes])

    // 如果没有提供 blurDataURL，则移除 placeholder='blur'
    const imagePlaceholder = blurDataURL ? placeholder : 'empty'
    const imageBlurDataURL = blurDataURL || undefined

    useEffect(() => {
      setIsLoading(true)
      setHasError(false)
      setAttempt(0)

      return () => {
        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current)
          retryTimerRef.current = null
        }
      }
    }, [src])

    const handleLoad = (e: SyntheticEvent<HTMLImageElement>) => {
      setIsLoading(false)
      setHasError(false)
      onLoadComplete?.()
      ;(props as ImgHTMLAttributes<HTMLImageElement>).onLoad?.(e)
    }

    const handleError = (e: SyntheticEvent<HTMLImageElement>) => {
      // 图片加载失败重试
      if (attempt < maxRetries) {
        const nextAttempt = attempt + 1
        const delay = 600 * Math.pow(2, attempt)

        if (retryTimerRef.current) {
          window.clearTimeout(retryTimerRef.current)
        }

        retryTimerRef.current = window.setTimeout(() => {
          setIsLoading(true)
          setHasError(false)
          setAttempt(nextAttempt)
        }, delay)
        return
      }

      setIsLoading(false)
      setHasError(true)
      ;(props as ImgHTMLAttributes<HTMLImageElement>).onError?.(e)
    }

    const handleNextImageLoad = () => {
      setIsLoading(false)
      setHasError(false)
      onLoadComplete?.()
    }

    return (
      <div className={cn('relative', containerClassName)}>
        {showLoading && isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <ImageLoadingAnimation
              size={loadingSize}
              circleColor={loadingCircleColor}
              shadowColor={loadingShadowColor}
            />
          </div>
        )}
        {useNativeImg ? (
          <img
            ref={ref}
            alt={(props as ImgHTMLAttributes<HTMLImageElement>).alt ?? ''}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            onLoad={handleLoad}
            onError={handleError}
            onClick={onClick}
            {...(props as ImgHTMLAttributes<HTMLImageElement>)}
          />
        ) : (
          <Image
            ref={ref}
            alt={(props as ComponentProps<typeof Image>).alt ?? ''}
            className={cn(
              'transition-opacity duration-300',
              isLoading ? 'opacity-0' : 'opacity-100',
              className
            )}
            priority={priority}
            loading={priority ? undefined : 'lazy'}
            sizes={optimizedSizes}
            quality={quality}
            placeholder={imagePlaceholder}
            blurDataURL={imageBlurDataURL}
            onLoad={handleNextImageLoad}
            onError={handleError}
            onClick={onClick}
            {...(props as ComponentProps<typeof Image>)}
          />
        )}
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <span className="text-muted-foreground text-sm">加载失败</span>
          </div>
        )}
      </div>
    )
  }
)

ImageComponent.displayName = 'ImageComponent'

// 为了保持向后兼容，导出别名
export const ImageWithLoading = ImageComponent
export const ImgWithLoading = ImageComponent
