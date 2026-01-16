'use client'

import { useEffect, useRef } from 'react'
import type { ImageType } from '~/types'

/**
 * 图片预加载 Hook
 * 提前加载可见区域附近的图片，提升用户体验
 * 
 * @param images 图片数组
 * @param currentIndex 当前索引（可选，如果不提供则预加载前 N 张）
 * @param preloadCount 预加载数量（当前索引前后各加载多少张）
 */
export function useImagePreload(
  images: ImageType[],
  currentIndex: number = 0,
  preloadCount: number = 5
) {
  const preloadedRef = useRef<Set<string>>(new Set())
  const imageObjectsRef = useRef<Map<string, HTMLImageElement>>(new Map())

  useEffect(() => {
    if (!images || images.length === 0) return

    // 确定预加载范围
    let startIndex: number
    let endIndex: number

    if (currentIndex === 0 && preloadCount > 0) {
      // 如果 currentIndex 为 0，预加载前 N 张
      startIndex = 0
      endIndex = Math.min(images.length, preloadCount)
    } else {
      // 预加载当前索引附近的图片
      startIndex = Math.max(0, currentIndex - preloadCount)
      endIndex = Math.min(images.length, currentIndex + preloadCount + 1)
    }

    const imagesToPreload: Array<{ url: string; image: ImageType }> = []

    for (let i = startIndex; i < endIndex; i++) {
      const image = images[i]
      if (!image) continue

      const imageUrl = image.preview_url || image.url
      if (!imageUrl || preloadedRef.current.has(imageUrl)) continue

      imagesToPreload.push({ url: imageUrl, image })
    }

    // 批量预加载图片
    imagesToPreload.forEach(({ url, image }) => {
      // 使用 Image 对象预加载（更可靠）
      const img = new Image()
      img.src = url
      img.loading = 'lazy'
      img.decoding = 'async'
      
      // 可选：添加错误处理
      img.onerror = () => {
        // 预加载失败，从缓存中移除
        preloadedRef.current.delete(url)
        imageObjectsRef.current.delete(url)
      }

      preloadedRef.current.add(url)
      imageObjectsRef.current.set(url, img)

      // 同时使用 link preload（浏览器优化）
      if (typeof document !== 'undefined') {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = url
        link.crossOrigin = 'anonymous'
        document.head.appendChild(link)
      }
    })

    // 清理函数：移除过期的预加载链接
    return () => {
      if (typeof document !== 'undefined') {
        const links = document.head.querySelectorAll('link[rel="preload"][as="image"]')
        links.forEach((link) => {
          const href = link.getAttribute('href')
          // 只移除不在当前预加载列表中的链接
          if (href && !preloadedRef.current.has(href)) {
            link.remove()
          }
        })
      }
    }
  }, [images, currentIndex, preloadCount])
}

