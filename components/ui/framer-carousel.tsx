'use client'
import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import { motion, useMotionValue, animate, PanInfo } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface CarouselItem {
  id: string | number
  url: string // 预览图URL（优先使用）
  originalUrl?: string // 原图URL（可选，用于点击查看）
  title?: string
}

interface FramerCarouselProps {
  items: CarouselItem[]
  /** 是否自动播放，默认 false */
  autoPlay?: boolean
  /** 自动播放间隔（毫秒），默认 5000 */
  autoPlayInterval?: number
  /** 是否显示导航按钮，默认 true */
  showNavButtons?: boolean
  /** 是否显示进度指示器，默认 true */
  showIndicators?: boolean
  /** 宽高比（与 heightClass 二选一） */
  aspectRatio?: string
  /** 固定高度类名（与 aspectRatio 二选一） */
  heightClass?: string
}

export function FramerCarousel({
  items,
  autoPlay = false,
  autoPlayInterval = 5000,
  showNavButtons = true,
  showIndicators = true,
  aspectRatio,
  heightClass,
}: FramerCarouselProps) {
  const [index, setIndex] = useState(0)
  const [containerWidth, setContainerWidth] = useState(0)
  const [loadedImages, setLoadedImages] = useState<Set<number>>(new Set([0]))
  const containerRef = useRef<HTMLDivElement>(null)
  const x = useMotionValue(0)

  // 更新容器宽度
  const updateContainerWidth = useCallback(() => {
    if (containerRef.current) {
      const width = containerRef.current.offsetWidth
      setContainerWidth(width)
      // 立即更新 x 位置，避免初始位置不正确
      if (width > 0) {
        x.set(-index * width)
      }
    }
  }, [index, x])

  // 监听窗口变化
  useEffect(() => {
    // 使用 requestAnimationFrame 确保 DOM 已渲染
    requestAnimationFrame(() => {
      updateContainerWidth()
    })
    const handleResize = () => updateContainerWidth()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [updateContainerWidth])

  // 使用 ResizeObserver 监听容器尺寸变化
  useEffect(() => {
    if (!containerRef.current) return
    
    const resizeObserver = new ResizeObserver(() => {
      updateContainerWidth()
    })
    
    resizeObserver.observe(containerRef.current)
    return () => resizeObserver.disconnect()
  }, [updateContainerWidth])

  // 预加载相邻图片
  useEffect(() => {
    const toPreload = [index - 1, index, index + 1].filter(
      (i) => i >= 0 && i < items.length
    )
    
    toPreload.forEach((i) => {
      if (!loadedImages.has(i)) {
        const img = new Image()
        img.src = items[i].url
        img.onload = () => {
          setLoadedImages((prev) => new Set([...prev, i]))
        }
      }
    })
  }, [index, items, loadedImages])

  // 滑动动画 - 优化动画参数提高平滑度
  useEffect(() => {
    if (containerWidth > 0 && items.length > 0) {
      const targetX = -index * containerWidth
      // 如果是初始加载且 x 为 0，直接设置位置而不使用动画
      if (x.get() === 0 && index === 0) {
        x.set(targetX)
      } else {
        animate(x, targetX, {
          type: 'spring',
          stiffness: 200,  // 降低刚度，更平滑
          damping: 25,     // 适中阻尼
          mass: 0.8,       // 添加质量感
        })
      }
    }
  }, [index, containerWidth, x, items.length])

  // 自动播放
  useEffect(() => {
    if (!autoPlay || items.length <= 1) return
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % items.length)
    }, autoPlayInterval)
    return () => clearInterval(timer)
  }, [autoPlay, autoPlayInterval, items.length])

  // 拖拽手势支持
  const handleDragEnd = useCallback(
    (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
      const threshold = containerWidth * 0.15  // 降低阈值，更容易切换
      const velocity = info.velocity.x
      
      // 考虑速度因素，快速滑动也可以切换
      if ((info.offset.x < -threshold || velocity < -500) && index < items.length - 1) {
        setIndex((prev) => prev + 1)
      } else if ((info.offset.x > threshold || velocity > 500) && index > 0) {
        setIndex((prev) => prev - 1)
      } else {
        // 回弹到当前位置
        animate(x, -index * containerWidth, {
          type: 'spring',
          stiffness: 200,
          damping: 25,
          mass: 0.8,
        })
      }
    },
    [containerWidth, index, items.length, x]
  )

  const goToPrev = useCallback(() => {
    setIndex((prev) => Math.max(0, prev - 1))
  }, [])

  const goToNext = useCallback(() => {
    setIndex((prev) => Math.min(items.length - 1, prev + 1))
  }, [items.length])

  // 决定使用 heightClass 还是 aspectRatio
  const useFixedHeight = !!heightClass
  const containerClassName = `relative overflow-hidden rounded-2xl border border-white/10 bg-black/40 ${heightClass || ''}`
  const containerStyle = useFixedHeight ? {} : { aspectRatio: aspectRatio || '16/9' }

  // 判断图片是否应该加载（当前、前一张、后一张）
  const shouldLoadImage = useCallback((i: number) => {
    return Math.abs(i - index) <= 1
  }, [index])

  if (!items || items.length === 0) {
    return (
      <div 
        className={`w-full flex items-center justify-center bg-black/20 rounded-2xl border border-white/10 ${heightClass || ''}`}
        style={useFixedHeight ? {} : { aspectRatio: aspectRatio || '16/9' }}
      >
        <span className="text-sm text-gray-500">暂无照片</span>
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="flex flex-col gap-3">
        {/* 轮播主容器 */}
        <div
          ref={containerRef}
          className={containerClassName}
          style={containerStyle}
        >
          <motion.div
            className="flex h-full cursor-grab active:cursor-grabbing"
            style={{ 
              x,
              willChange: 'transform',  // GPU 加速
            }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.08}  // 降低弹性，更自然
            onDragEnd={handleDragEnd}
          >
            {items.map((item, i) => (
              <div
                key={item.id}
                className="shrink-0 h-full relative"
                style={{ 
                  width: containerWidth > 0 ? containerWidth : '100%',
                  willChange: 'transform',
                  flexShrink: 0,
                }}
              >
                {/* 加载占位符 */}
                {!loadedImages.has(i) && (
                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                    <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
                {/* 图片 - 懒加载 + 异步解码 */}
                {shouldLoadImage(i) && (
                  <img
                    src={item.url}
                    alt={item.title || `Photo ${item.id}`}
                    className={`w-full h-full object-cover select-none pointer-events-none transition-opacity duration-300 ${
                      loadedImages.has(i) ? 'opacity-100' : 'opacity-0'
                    }`}
                    draggable={false}
                    loading={i === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onLoad={() => {
                      setLoadedImages((prev) => new Set([...prev, i]))
                    }}
                  />
                )}
                {/* 照片标题（可选） */}
                {item.title && loadedImages.has(i) && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4 pt-12">
                    <h3 className="text-white text-lg font-medium drop-shadow-lg">
                      {item.title}
                    </h3>
                  </div>
                )}
              </div>
            ))}
          </motion.div>

          {/* 左导航按钮 */}
          {showNavButtons && items.length > 1 && (
            <>
              <button
                disabled={index === 0}
                onClick={goToPrev}
                className={`absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10 backdrop-blur-sm
                  ${
                    index === 0
                      ? 'opacity-30 cursor-not-allowed bg-white/20'
                      : 'bg-white/80 hover:bg-white hover:scale-110 active:scale-95'
                  }`}
                aria-label="上一张"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>

              {/* 右导航按钮 */}
              <button
                disabled={index === items.length - 1}
                onClick={goToNext}
                className={`absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-200 z-10 backdrop-blur-sm
                  ${
                    index === items.length - 1
                      ? 'opacity-30 cursor-not-allowed bg-white/20'
                      : 'bg-white/80 hover:bg-white hover:scale-110 active:scale-95'
                  }`}
                aria-label="下一张"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 text-gray-800" />
              </button>
            </>
          )}

          {/* 进度指示器 */}
          {showIndicators && items.length > 1 && (
            <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2 p-1.5 sm:p-2 bg-black/30 backdrop-blur-sm rounded-full border border-white/20">
              {items.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${
                    i === index
                      ? 'w-6 sm:w-8 bg-white'
                      : 'w-1.5 sm:w-2 bg-white/50 hover:bg-white/70'
                  }`}
                  aria-label={`跳转到第 ${i + 1} 张`}
                />
              ))}
            </div>
          )}

          {/* 照片计数器 */}
          <div className="absolute top-3 sm:top-4 right-3 sm:right-4 px-2.5 py-1 bg-black/40 backdrop-blur-sm rounded-full text-xs sm:text-sm text-white/90 font-medium">
            {index + 1} / {items.length}
          </div>
        </div>
      </div>
    </div>
  )
}
