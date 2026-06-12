'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import type { ImageType } from '~/types'

interface ImageAutoSliderProps {
  images: ImageType[]
}

export const ImageAutoSlider = ({ images }: ImageAutoSliderProps) => {
  const [firstImageLoaded, setFirstImageLoaded] = useState(false)
  // 复制一份做无缝循环
  const duplicatedImages = [...images, ...images]

  // M3：恢复骨架屏状态 — 首图加载完才显示滑块，避免无占位直接渲染
  useEffect(() => {
    if (!Array.isArray(images) || images.length === 0) {
      setFirstImageLoaded(true)
      return
    }
    const first = images[0]
    const firstUrl = first?.preview_url || first?.url
    if (!firstUrl) {
      setFirstImageLoaded(true)
      return
    }
    // 使用 window.Image 避免与 Next.js Image 组件冲突
    const img = new window.Image()
    img.src = firstUrl
    img.onload = () => setFirstImageLoaded(true)
    img.onerror = () => setFirstImageLoaded(true)
  }, [images])

  if (!Array.isArray(images) || images.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }

        .infinite-scroll {
          animation: scroll-right 40s linear infinite;
        }

        /* M2：prefers-reduced-motion 独立保护 CSS animation */
        @media (prefers-reduced-motion: reduce) {
          .infinite-scroll {
            animation: none;
          }
        }

        .scroll-container {
          mask: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
          -webkit-mask: linear-gradient(90deg, transparent 0%, black 10%, black 90%, transparent 100%);
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }
      `}</style>

      <div className="w-full bg-transparent relative overflow-hidden flex items-center justify-center py-5">
        {/* M3：骨架屏占位 — 首图加载完成前显示 */}
        {!firstImageLoaded && (
          <div className="scroll-container w-full max-w-[1600px]">
            <div className="flex gap-7">
              {Array.from({ length: 6 }).map((_, i) => (
                <div
                  key={`skeleton-${i}`}
                  className="relative flex-shrink-0 rounded-2xl overflow-hidden bg-muted animate-pulse"
                  style={{ width: 'clamp(160px, 26vw, 320px)', aspectRatio: '3/2' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* 真实图片轮播 */}
        <div
          className={`relative z-10 w-full flex items-center justify-center transition-opacity duration-500 ${
            firstImageLoaded ? 'opacity-100' : 'opacity-0 absolute'
          }`}
        >
          <div className="scroll-container w-full max-w-[1600px]">
            <div className="infinite-scroll flex gap-7 w-max">
              {duplicatedImages.map((image, index) => {
                const isFirstTwo = index === 0 || index === 1
                return (
                  <div
                    key={`${image.id}-${index}`}
                    className="image-item relative flex-shrink-0 rounded-2xl overflow-hidden shadow-lg ring-1 ring-white/10 dark:ring-white/5"
                    style={{ width: 'clamp(160px, 26vw, 320px)', aspectRatio: '3/2' }}
                  >
                    <Image
                      src={image.preview_url || image.url || ''}
                      alt={image.title || `Gallery image ${index + 1}`}
                      fill
                      sizes="(max-width: 768px) 160px, (max-width: 1024px) 240px, 320px"
                      className="object-cover"
                      priority={isFirstTwo}
                      loading={isFirstTwo ? undefined : 'lazy'}
                      onLoad={() => {
                        if (index === 0) setFirstImageLoaded(true)
                      }}
                    />
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
