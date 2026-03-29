'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { cn } from '~/lib/utils'
import { useInView } from 'framer-motion'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import type { ImageType } from '~/types'
import { useRouter } from 'next-nprogress-bar'
import { useIsMobile } from '~/hooks/use-mobile'
import { useImagePreload } from '~/hooks/use-image-preload'

interface VirtualWaterfallGalleryProps {
  images: ImageType[]
  /**
   * 可见区域上下扩展的图片数量
   * 用于提前渲染和预加载
   */
  overscan?: number
  /**
   * 启用虚拟滚动的阈值
   * 当图片数量超过此值时启用虚拟滚动
   */
  threshold?: number
}

/**
 * 虚拟滚动瀑布流画廊
 * 使用 Intersection Observer 实现，只渲染可见区域的图片
 * 适合瀑布流布局，因为每列高度不同
 */
export function VirtualWaterfallGallery({ 
  images, 
  overscan = 10,
  threshold = 30
}: VirtualWaterfallGalleryProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(threshold, images.length) })
  
  // 列数：移动端 2 列，桌面端 3 列
  const columnCount = isMobile ? 2 : 3
  
  // 计算每列的图片分布
  const columns = useMemo(() => {
    const newColumns: ImageType[][] = Array.from({ length: columnCount }, () => [])
    images.forEach((image, index) => {
      newColumns[index % columnCount].push(image)
    })
    return newColumns
  }, [images, columnCount])

  // 使用 Intersection Observer 检测可见区域
  useEffect(() => {
    if (images.length <= threshold) {
      // 图片数量少，不需要虚拟滚动
      setVisibleRange({ start: 0, end: images.length })
      return
    }

    const observerOptions = {
      root: null,
      rootMargin: '200px', // 提前 200px 开始加载
      threshold: 0.1,
    }

    const observer = new IntersectionObserver((entries) => {
      const visibleIndices = new Set<number>()
      
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const index = parseInt(entry.target.getAttribute('data-index') || '0', 10)
          visibleIndices.add(index)
        }
      })

      if (visibleIndices.size > 0) {
        const indices = Array.from(visibleIndices).sort((a, b) => a - b)
        const minIndex = Math.max(0, Math.min(...indices) - overscan)
        const maxIndex = Math.min(images.length, Math.max(...indices) + overscan)
        
        setVisibleRange({ start: minIndex, end: maxIndex })
      }
    }, observerOptions)

    // 观察所有图片容器
    const containers = containerRef.current?.querySelectorAll('[data-index]')
    containers?.forEach((container) => observer.observe(container))

    return () => observer.disconnect()
  }, [images.length, overscan, threshold])

  // 计算可见的图片
  const visibleImages = useMemo(() => {
    return images.slice(visibleRange.start, visibleRange.end)
  }, [images, visibleRange])

  // 图片预加载：预加载可见区域附近的图片
  useImagePreload(visibleImages, Math.floor(visibleImages.length / 2), overscan)

  // 如果图片数量少，直接渲染所有
  if (images.length <= threshold) {
    return (
      <div className="relative flex w-full flex-col items-center justify-center py-10 px-4">
        <div ref={containerRef} className="mx-auto grid w-full max-w-7xl gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((columnImages, colIndex) => (
            <div key={colIndex} className="grid h-fit gap-6">
              {columnImages.map((image, imgIndex) => {
                const globalIndex = imgIndex * columnCount + colIndex
                const ratio = image.width && image.height ? image.width / image.height : 16 / 9
                return (
                  <AnimatedImage
                    key={image.id}
                    image={image}
                    ratio={ratio}
                    router={router}
                    index={globalIndex}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 虚拟滚动：只渲染可见区域的图片
  return (
    <div className="relative flex w-full flex-col items-center justify-center py-10 px-4">
      <div ref={containerRef} className="mx-auto grid w-full max-w-7xl gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
        {columns.map((columnImages, colIndex) => (
          <div key={colIndex} className="grid h-fit gap-6">
            {columnImages.map((image, imgIndex) => {
              const globalIndex = imgIndex * columnCount + colIndex
              const isVisible = globalIndex >= visibleRange.start && globalIndex < visibleRange.end
              
              if (!isVisible) {
                // 不可见的图片：渲染占位符保持布局
                const ratio = image.width && image.height ? image.width / image.height : 16 / 9
                return (
                  <div
                    key={image.id}
                    data-index={globalIndex}
                    className="relative"
                    style={{ aspectRatio: ratio }}
                  >
                    <div className="w-full h-full bg-muted rounded-xl" />
                  </div>
                )
              }

              const ratio = image.width && image.height ? image.width / image.height : 16 / 9
              return (
                <AnimatedImage
                  key={image.id}
                  image={image}
                  ratio={ratio}
                  router={router}
                  index={globalIndex}
                />
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

interface AnimatedImageProps {
  image: ImageType
  ratio: number
  router: ReturnType<typeof useRouter>
  index: number
}

const AnimatedImage = React.memo(function AnimatedImage({ image, ratio, router, index }: AnimatedImageProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '100px' })
  const [isLoading, setIsLoading] = React.useState(true)
  
  const handleClick = React.useCallback(() => {
    router.push(`/preview/${image.id}`)
  }, [router, image.id])

  return (
    <div
      ref={ref}
      data-index={index}
      className="group relative cursor-pointer"
      onClick={handleClick}
    >
      <AspectRatio
        ratio={ratio}
        className="bg-muted relative size-full rounded-xl overflow-hidden"
      >
        <img
          alt={image.detail || 'Image'}
          src={image.preview_url || image.url}
          className={cn(
            'size-full object-cover transition-all duration-700 ease-in-out',
            isLoading ? 'scale-110 blur-lg' : 'scale-100 blur-0',
            !isInView && 'opacity-0'
          )}
          onLoad={() => setIsLoading(false)}
          loading="lazy"
          decoding="async"
        />
        {/* Hover Title with bottom gradient */}
        {image.title && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 top-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-gradient-to-t from-black/50 via-black/25 to-transparent flex items-end">
            <div className="w-full px-3 pb-3 text-white text-sm font-semibold leading-relaxed tracking-wide drop-shadow-sm line-clamp-2">
              {image.title}
            </div>
          </div>
        )}
      </AspectRatio>
    </div>
  )
})









