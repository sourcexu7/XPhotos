'use client'

import React from 'react'
import Image from 'next/image'
import type { ImageType } from '~/types'

interface ImageAutoSliderProps {
  images: ImageType[]
}

export const ImageAutoSlider = ({ images }: ImageAutoSliderProps) => {
  // Duplicate images for seamless loop
  const duplicatedImages = [...images, ...images]

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
      `}</style>
      
      <div className="w-full bg-transparent relative overflow-hidden flex items-center justify-center py-4">
        
        {/* Scrolling images container */}
        <div className="relative z-10 w-full flex items-center justify-center">
          <div className="scroll-container w-full max-w-[1400px]">
            <div className="infinite-scroll flex gap-6 w-max">
              {duplicatedImages.map((image, index) => (
                <div
                  key={`${image.id}-${index}`}
                  className="image-item relative flex-shrink-0 w-32 h-32 md:w-48 md:h-48 lg:w-64 lg:h-64 rounded-xl overflow-hidden"
                >
                  <Image
                    src={image.preview_url || image.url || ''}
                    alt={image.title || `Gallery image ${index + 1}`}
                    fill
                    sizes="(max-width: 768px) 128px, (max-width: 1024px) 192px, 256px"
                    className="object-cover"
                    unoptimized
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
