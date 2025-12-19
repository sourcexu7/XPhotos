/**
 * 带加载动效的原生 img 标签组件
 * 用于不需要 Next.js Image 优化的场景
 */

'use client'

import { useState, useEffect, forwardRef } from 'react'
import type { SyntheticEvent } from 'react'
import { ImageLoadingAnimation } from './image-loading-animation'
import { cn } from '~/lib/utils'

export interface ImgWithLoadingProps extends ImgHTMLAttributes<HTMLImageElement> {
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
}

/**
 * 带加载动效的原生 img 标签组件
 */
export const ImgWithLoading = forwardRef<HTMLImageElement, ImgWithLoadingProps>(
  (
    {
      showLoading = true,
      loadingSize = 'medium',
      loadingCircleColor = '#fff',
      loadingShadowColor = 'rgba(0, 0, 0, 0.9)',
      containerClassName,
      className,
      onLoad,
      onLoadComplete,
      ...props
    },
    ref,
  ) => {
    const [isLoading, setIsLoading] = useState(true)
    const [hasError, setHasError] = useState(false)

    const handleLoad = (e: SyntheticEvent<HTMLImageElement, Event>) => {
      setIsLoading(false)
      setHasError(false)
      onLoad?.(e)
      onLoadComplete?.()
    }

    const handleError = () => {
      setIsLoading(false)
      setHasError(true)
    }

    // 当 src 改变时重置加载状态
    useEffect(() => {
      setIsLoading(true)
      setHasError(false)
    }, [props.src])

    return (
      <div className={cn('relative', containerClassName)}>
        {showLoading && isLoading && !hasError && (
          <ImageLoadingAnimation
            visible={isLoading}
            size={loadingSize}
            circleColor={loadingCircleColor}
            shadowColor={loadingShadowColor}
          />
        )}
        <img
          ref={ref}
          className={cn(
            'transition-opacity duration-300',
            isLoading ? 'opacity-0' : 'opacity-100',
            className,
          )}
          onLoad={handleLoad}
          onError={handleError}
          {...props}
        />
        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
            <span className="text-muted-foreground text-sm">加载失败</span>
          </div>
        )}
      </div>
    )
  },
)

ImgWithLoading.displayName = 'ImgWithLoading'

