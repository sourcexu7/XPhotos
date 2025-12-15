'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, useMotionValue, animate } from 'framer-motion'
import Image from 'next/image'
import type { ImageType } from '~/types'

interface ThumbnailCarouselProps {
  images: ImageType[]
}

const FULL_WIDTH_PX = 120
const COLLAPSED_WIDTH_PX = 35
const GAP_PX = 2
const MARGIN_PX = 2

import type { ImageType } from '~/types'
function Thumbnails({ index, setIndex, items }: { index: number, setIndex: (i: number) => void, items: ImageType[] }) {
  const thumbnailsRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (thumbnailsRef.current) {
      let scrollPosition = 0
      for (let i = 0; i < index; i++) {
        scrollPosition += COLLAPSED_WIDTH_PX + GAP_PX
      }

      scrollPosition += MARGIN_PX

      const containerWidth = thumbnailsRef.current.offsetWidth
      const centerOffset = containerWidth / 2 - FULL_WIDTH_PX / 2
      scrollPosition -= centerOffset

      thumbnailsRef.current.scrollTo({
        left: scrollPosition,
        behavior: 'smooth',
      })
    }
  }, [index])

  return (
    <div
      ref={thumbnailsRef}
      className='overflow-x-auto'
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
    >
      <style>{`
        .overflow-x-auto::-webkit-scrollbar {
          display: none;
        }
      `}</style>
      <div className='flex gap-0.5 h-20 pb-2' style={{ width: 'fit-content' }}>
        {items.map((item, i) => (
          <motion.button
            key={item.id}
            onClick={() => setIndex(i)}
            initial={false}
            animate={i === index ? 'active' : 'inactive'}
            variants={{
              active: {
                width: FULL_WIDTH_PX,
                marginLeft: MARGIN_PX,
                marginRight: MARGIN_PX,
              },
              inactive: {
                width: COLLAPSED_WIDTH_PX,
                marginLeft: 0,
                marginRight: 0,
              },
            }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className='relative shrink-0 h-full overflow-hidden rounded'
          >
            <Image
              src={item.url}
              alt={item.title}
              fill
              sizes="120px"
              className='object-cover pointer-events-none select-none'
              draggable={false}
            />
          </motion.button>
        ))}
      </div>
    </div>
  )
}

export default function ThumbnailCarousel({ images }: ThumbnailCarouselProps) {
  const [index, setIndex] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const x = useMotionValue(0)

  const items = images.map(img => ({
    id: img.id,
    url: img.url || img.preview_url || '',
    title: img.title || 'Untitled'
  })).filter(item => item.url)

  useEffect(() => {
    if (!isDragging && containerRef.current) {
      const containerWidth = containerRef.current.offsetWidth || 1
      const targetX = -index * containerWidth

      animate(x, targetX, {
        type: 'spring',
        stiffness: 300,
        damping: 30,
      })
    }
  }, [index, x, isDragging])

  if (items.length === 0) return null

  return (
    <div className='w-full max-w-5xl mx-auto p-4 lg:p-10'>
      <div className='flex flex-col gap-3'>
        {/* Main Carousel */}
        <div className='relative overflow-hidden rounded-lg bg-gray-900/50 backdrop-blur-sm border border-white/10' ref={containerRef}>
          <motion.div
            className='flex'
            drag='x'
            dragElastic={0.2}
            dragMomentum={false}
            onDragStart={() => setIsDragging(true)}
            onDragEnd={(e, info) => {
              setIsDragging(false)
              const containerWidth = containerRef.current?.offsetWidth || 1
              const offset = info.offset.x
              const velocity = info.velocity.x

              let newIndex = index

              // If fast swipe, use velocity
              if (Math.abs(velocity) > 500) {
                newIndex = velocity > 0 ? index - 1 : index + 1
              }
              // Otherwise use offset threshold (30% of container width)
              else if (Math.abs(offset) > containerWidth * 0.3) {
                newIndex = offset > 0 ? index - 1 : index + 1
              }

              // Clamp index
              newIndex = Math.max(0, Math.min(items.length - 1, newIndex))
              setIndex(newIndex)
            }}
            style={{ x }}
          >
            {items.map((item) => (
              <div key={item.id} className='relative shrink-0 w-full h-[500px]'>
                <Image
                  src={item.url}
                  alt={item.title}
                  fill
                  sizes="100vw"
                  className='object-contain bg-black/20 select-none pointer-events-none'
                  draggable={false}
                />
              </div>
            ))}
          </motion.div>

          {/* Previous Button */}
          <motion.button
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            className={`absolute left-4 text-black top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === 0
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white/80 hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M15 19l-7-7 7-7'
              />
            </svg>
          </motion.button>

          {/* Next Button */}
          <motion.button
            disabled={index === items.length - 1}
            onClick={() => setIndex((i) => Math.min(items.length - 1, i + 1))}
            className={`absolute text-black right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-transform z-10
              ${
                index === items.length - 1
                  ? 'opacity-40 cursor-not-allowed'
                  : 'bg-white/80 hover:scale-110 hover:opacity-100 opacity-70'
              }`}
          >
            <svg
              className='w-6 h-6'
              fill='none'
              stroke='currentColor'
              viewBox='0 0 24 24'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M9 5l7 7-7 7'
              />
            </svg>
          </motion.button>

          {/* Image Counter */}
          <div className='absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-md text-white px-3 py-1 rounded-full text-sm border border-white/10'>
            {index + 1} / {items.length}
          </div>
        </div>

        <Thumbnails index={index} setIndex={setIndex} items={items} />
      </div>
    </div>
  )
}
