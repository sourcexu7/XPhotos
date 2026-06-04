'use client'

import React, { useState, useRef, useMemo, useCallback } from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { cn } from '~/lib/utils'
import type { ImageType } from '~/types'

interface MagicImageCardProps {
  image: ImageType
  x: number
  y: number
  w: number
  h: number
  index: number
  isVisible: boolean
  onClick: (id: string) => void
}

export const MagicImageCard = React.memo(function MagicImageCard({
  image,
  x,
  y,
  w,
  h,
  index,
  isVisible,
  onClick,
}: MagicImageCardProps) {
  const [inView, setInView] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  
  // 3D 倾斜效果
  const xMotion = useMotionValue(0)
  const yMotion = useMotionValue(0)
  
  // 高性能弹性动画
  const xSpring = useSpring(xMotion, { damping: 20, stiffness: 200, mass: 0.8 })
  const ySpring = useSpring(yMotion, { damping: 20, stiffness: 200, mass: 0.8 })
  
  // 旋转变换
  const rotateX = useTransform(ySpring, [-0.5, 0.5], [12, -12])
  const rotateY = useTransform(xSpring, [-0.5, 0.5], [-12, 12])
  const scale = useTransform(
    [xSpring, ySpring],
    ([xVal, yVal]: any[]) => {
      const distance = Math.sqrt(xVal * xVal + yVal * yVal)
      return 1 + distance * 0.05
    }
  )

  useEffect(() => {
    if (!ref.current) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      { rootMargin: '300px' },
    )
    io.observe(ref.current)
    return () => io.disconnect()
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseX = e.clientX - rect.left
    const mouseY = e.clientY - rect.top
    const xPct = (mouseX / rect.width) - 0.5
    const yPct = (mouseY / rect.height) - 0.5
    
    xMotion.set(xPct)
    yMotion.set(yPct)
  }, [xMotion, yMotion])

  const handleMouseLeave = useCallback(() => {
    xMotion.set(0)
    yMotion.set(0)
    setIsHovered(false)
  }, [xMotion, yMotion])

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true)
  }, [])

  const src = image.preview_url || image.url || ''
  const priority = index < 6

  return (
    <motion.div
      ref={ref}
      className="absolute cursor-pointer rounded-xl overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
      tabIndex={0}
      role="button"
      style={{ 
        left: x, 
        top: y, 
        width: w, 
        height: h,
        transformStyle: 'preserve-3d',
        perspective: '1000px',
      }}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(image.id) } }}
      onClick={() => onClick(image.id)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={handleMouseEnter}
      whileHover={{ zIndex: 50 }}
      animate={{
        rotateX,
        rotateY,
        scale,
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
        mass: 0.5,
      }}
    >
      {!loaded && (
        <div className="absolute inset-0 bg-muted animate-pulse" />
      )}
      
      {/* 动态光泽层 */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        style={{
          background: isHovered 
            ? 'linear-gradient(120deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)'
            : 'transparent',
          backgroundPosition: xSpring,
        }}
      />

      {(inView || isVisible) && src && (
        <motion.img
          src={src}
          alt={image.detail || image.title || '摄影作品'}
          width={w}
          height={h}
          loading={priority ? 'eager' : 'lazy'}
          decoding={priority ? 'sync' : 'async'}
          fetchPriority={priority ? 'high' : 'auto'}
          className={cn(
            'w-full h-full object-cover',
            loaded ? 'opacity-100' : 'opacity-0',
          )}
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: loaded ? 1 : 0,
            scale: isHovered ? 1.08 : 1,
          }}
          transition={{
            opacity: { duration: 0.5 },
            scale: { duration: 0.4, type: 'spring', stiffness: 300, damping: 20 },
          }}
          onLoad={() => setLoaded(true)}
        />
      )}
      
      {/* 悬浮信息层 */}
      <motion.div
        className="absolute inset-x-0 bottom-0 pointer-events-none bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isHovered ? 1 : 0,
          y: isHovered ? 0 : 20,
        }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        {image.title && (
          <motion.p 
            className="text-white text-sm font-medium line-clamp-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.1 }}
          >
            {image.title}
          </motion.p>
        )}
        {image.detail && (
          <motion.p 
            className="text-white/70 text-xs mt-1 line-clamp-1"
            initial={{ opacity: 0 }}
            animate={{ opacity: isHovered ? 1 : 0 }}
            transition={{ delay: 0.2 }}
          >
            {image.detail}
          </motion.p>
        )}
      </motion.div>

      {/* 照片类型指示器动画 */}
      {image.type === 2 && (
        <motion.div
          className="absolute top-3 left-3"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ 
            scale: isHovered ? 1.2 : 1, 
            opacity: 1,
          }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          <div className="relative">
            <motion.div
              className="absolute inset-0 bg-white/20 rounded-full blur-md"
              animate={{
                scale: isHovered ? [1, 1.5, 1] : 1,
                opacity: isHovered ? [0.5, 0, 0.5] : 0,
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: 'easeInOut',
              }}
            />
            <div className="relative bg-black/40 backdrop-blur-sm rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="text-white"
                width="20" height="20" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" fill="none"
                strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="1" />
                <circle cx="12" cy="12" r="5" />
                <line x1="15.9" y1="20.11" x2="15.9" y2="20.12" />
                <line x1="19.04" y1="17.61" x2="19.04" y2="17.62" />
                <line x1="20.77" y1="14" x2="20.77" y2="14.01" />
                <line x1="20.77" y1="10" x2="20.77" y2="10.01" />
                <line x1="19.04" y1="6.39" x2="19.04" y2="6.4" />
                <line x1="15.9" y1="3.89" x2="15.9" y2="3.9" />
                <line x1="12" y1="3" x2="12" y2="3.01" />
                <line x1="8.1" y1="3.89" x2="8.1" y2="3.9" />
                <line x1="4.96" y1="6.39" x2="4.96" y2="6.4" />
                <line x1="3.23" y1="10" x2="3.23" y2="10.01" />
                <line x1="3.23" y1="14" x2="3.23" y2="14.01" />
                <line x1="4.96" y1="17.61" x2="4.96" y2="17.62" />
                <line x1="8.1" y1="20.11" x2="8.1" y2="20.12" />
                <line x1="12" y1="21" x2="12" y2="21.01" />
              </svg>
            </div>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
})
