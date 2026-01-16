'use client'

import React, { useMemo, useRef, useEffect, useState, useCallback } from 'react'
import { FixedSizeGrid as Grid } from 'react-window'
import { cn } from '~/lib/utils'
import { useInView } from 'framer-motion'
import { AspectRatio } from '~/components/ui/aspect-ratio'
import type { ImageType } from '~/types'
import { useRouter } from 'next-nprogress-bar'
import { useIsMobile } from '~/hooks/use-mobile'
import { useImagePreload } from '~/hooks/use-image-preload'

interface VirtualImageGalleryProps {
  images: ImageType[]
  /**
   * 是否启用虚拟滚动
   * 当图片数量超过 threshold 时自动启用
   */
  enableVirtualScroll?: boolean
  /**
   * 启用虚拟滚动的阈值
   */
  virtualScrollThreshold?: number
}

/**
 * 虚拟滚动图片画廊组件
 * 当图片数量较多时，只渲染可见区域的图片，大幅提升性能
 */
export function VirtualImageGallery({ 
  images, 
  enableVirtualScroll = true,
  virtualScrollThreshold = 50 
}: VirtualImageGalleryProps) {
  const isMobile = useIsMobile()
  const router = useRouter()
  const containerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  
  // 列数：移动端 2 列，桌面端 3 列
  const columnCount = isMobile ? 2 : 3
  const gap = 24 // gap-6 = 24px
  
  // 计算每列的图片分布
  const columns = useMemo(() => {
    const newColumns: ImageType[][] = Array.from({ length: columnCount }, () => [])
    images.forEach((image, index) => {
      newColumns[index % columnCount].push(image)
    })
    return newColumns
  }, [images, columnCount])

  // 计算每列的总高度（用于虚拟滚动）
  const columnHeights = useMemo(() => {
    return columns.map((columnImages) => {
      return columnImages.reduce((total, image) => {
        const ratio = image.width && image.height ? image.width / image.height : 16 / 9
        const itemHeight = (containerSize.width / columnCount - gap * (columnCount - 1) / columnCount) / ratio + gap
        return total + itemHeight
      }, 0)
    })
  }, [columns, containerSize.width, columnCount, gap])

  // 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })

    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [])

  // 是否使用虚拟滚动
  const shouldUseVirtualScroll = enableVirtualScroll && images.length > virtualScrollThreshold

  // 如果不需要虚拟滚动，使用普通渲染
  if (!shouldUseVirtualScroll || containerSize.width === 0) {
    return (
      <div className="relative flex w-full flex-col items-center justify-center py-10 px-4">
        <div ref={containerRef} className="mx-auto grid w-full max-w-7xl gap-6 grid-cols-2 md:grid-cols-2 lg:grid-cols-3">
          {columns.map((columnImages, colIndex) => (
            <div key={colIndex} className="grid h-fit gap-6">
              {columnImages.map((image) => {
                const ratio = image.width && image.height ? image.width / image.height : 16 / 9
                return (
                  <AnimatedImage
                    key={image.id}
                    image={image}
                    ratio={ratio}
                    router={router}
                  />
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // 虚拟滚动渲染
  const columnWidth = (containerSize.width - gap * (columnCount - 1)) / columnCount
  const maxHeight = Math.max(...columnHeights, 1000)

  return (
    <div className="relative flex w-full flex-col items-center justify-center py-10 px-4">
      <div ref={containerRef} className="mx-auto w-full max-w-7xl">
        <Grid
          columnCount={columnCount}
          columnWidth={columnWidth + gap}
          height={Math.min(maxHeight, window.innerHeight * 2)}
          rowCount={Math.ceil(images.length / columnCount)}
          rowHeight={() => 300} // 估算行高，实际会动态计算
          width={containerSize.width}
          className="overflow-x-hidden"
        >
          {({ columnIndex, rowIndex, style }) => {
            const imageIndex = rowIndex * columnCount + columnIndex
            const image = images[imageIndex]
            
            if (!image) return null

            const ratio = image.width && image.height ? image.width / image.height : 16 / 9
            const itemHeight = columnWidth / ratio

            return (
              <div
                style={{
                  ...style,
                  height: itemHeight,
                  paddingRight: columnIndex < columnCount - 1 ? gap : 0,
                  paddingBottom: gap,
                }}
              >
                <AnimatedImage
                  image={image}
                  ratio={ratio}
                  router={router}
                />
              </div>
            )
          }}
        </Grid>
      </div>
    </div>
  )
}

interface AnimatedImageProps {
  image: ImageType
  ratio: number
  router: ReturnType<typeof useRouter>
}

const AnimatedImage = React.memo(function AnimatedImage({ image, ratio, router }: AnimatedImageProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { once: true, margin: '100px' })
  const [isLoading, setIsLoading] = React.useState(true)
  
  // 图片预加载：当图片进入视口时预加载
  useImagePreload([image], 0, 0)
  
  const handleClick = React.useCallback(() => {
    router.push(`/preview/${image.id}`)
  }, [router, image.id])

  return (
    <div
      ref={ref}
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









