'use client'

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import type { ImageType } from '~/types'

interface ImageAutoSliderProps {
  images: ImageType[]
}

export const ImageAutoSlider = ({ images }: ImageAutoSliderProps) => {
  const [firstImageLoaded, setFirstImageLoaded] = useState(false)
  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images]

  useEffect(() => {
    // 预加载第一张图片，用于检测加载状态
    if (images.length > 0 && typeof window !== 'undefined') {
      const firstImageUrl = images[0].preview_url || images[0].url
      if (firstImageUrl) {
        const img = new Image()
        img.src = firstImageUrl
        img.onload = () => {
          setFirstImageLoaded(true)
        }
        img.onerror = () => {
          // 即使加载失败也设置为true，避免一直显示加载动画
          setFirstImageLoaded(true)
        }
      } else {
        setFirstImageLoaded(true)
      }
    } else if (images.length === 0) {
      setFirstImageLoaded(true)
    }
  }, [images])

  if (images.length === 0) return null

  return (
    <>
      <style>{`
        @keyframes scroll-right {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .infinite-scroll {
          animation: scroll-right 40s linear infinite;
        }

        .scroll-container {
          mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
          -webkit-mask: linear-gradient(
            90deg,
            transparent 0%,
            black 10%,
            black 90%,
            transparent 100%
          );
        }

        .image-item {
          transition: transform 0.3s ease, filter 0.3s ease;
        }

        .image-item:hover {
          transform: scale(1.05);
          filter: brightness(1.1);
        }

        .loading-spinner {
          animation: spin 1s linear infinite;
        }
      `}</style>
      
      <div className="w-full bg-transparent relative overflow-hidden flex items-center justify-center py-4">
        {/* 加载动画 - 在第一张图片加载完成前显示 */}
        {!firstImageLoaded && (
          <div className="absolute inset-0 flex items-center justify-center z-20">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full loading-spinner" />
          </div>
        )}
        
        {/* Scrolling images container */}
        <div className={`relative z-10 w-full flex items-center justify-center transition-opacity duration-500 ${firstImageLoaded ? 'opacity-100' : 'opacity-0'}`}>
          <div className="scroll-container w-full max-w-[1400px]">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={`${image.id}-${index}`}
                  className="image-item relative flex-shrink-0 rounded-xl overflow-hidden"
                  style={{
                    width: 'clamp(128px, 20vw, 256px)',
                    aspectRatio: '4/3',
                  }}
                >
                  <Image
                    src={image.preview_url || image.url || ''}
                    alt={image.title || `Gallery image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                    className="object-cover"
                    unoptimized
                    onLoad={() => {
                      // 作为备用方案，如果预加载没有触发，这里也会更新状态
                      if (index === 0 && !firstImageLoaded) {
                        setFirstImageLoaded(true)
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
