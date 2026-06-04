'use client'

import { motion, AnimatePresence } from 'framer-motion'
import type { ImageType } from '~/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { safePush } from '~/lib/router/safe-navigation'
import { ChevronDown, ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  images?: ImageType[]
}

export default function HeroSection({ images = [] }: HeroSectionProps) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    router.prefetch('/covers')
  }, [router])

  const handleStartClick = () => {
    safePush(router, '/covers?from=hero', { scroll: true })
  }

  // Auto slide
  useEffect(() => {
    if (images.length === 0) return
    
    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % images.length)
    }, 5000)
    
    return () => clearInterval(timer)
  }, [images.length])

  const handleNext = useCallback(() => {
    if (images.length === 0) return
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % images.length)
  }, [images.length])

  const handlePrev = useCallback(() => {
    if (images.length === 0) return
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
  }, [images.length])

  const currentImage = images[currentIndex]

  return (
    <section className="relative w-full h-screen overflow-hidden">
      {/* Full-screen Image Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          {currentImage && (
            <motion.div
              key={currentImage.id}
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="absolute inset-0"
            >
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ 
                  backgroundImage: `url(${currentImage.preview_url || currentImage.url})`,
                }}
              />
              {/* Gradient Overlay for readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
              {/* Vignette effect */}
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content Overlay */}
      <div className="relative z-10 h-full flex flex-col justify-between px-4 sm:px-6 md:px-8 lg:px-12 py-8">
        {/* Top Section - Minimal Header */}
        <div className="flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="text-white/90 font-light tracking-[0.2em] text-sm uppercase"
          >
            Photography
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="flex gap-4"
          >
            {images.length > 0 && (
              <>
                <button
                  onClick={handlePrev}
                  className="text-white/70 hover:text-white transition-colors p-2"
                  aria-label="Previous"
                >
                  <svg className="w-6 h-6 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  className="text-white/70 hover:text-white transition-colors p-2"
                  aria-label="Next"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </motion.div>
        </div>

        {/* Center - Main Title */}
        <div className="flex flex-col items-center justify-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1, ease: 'easeOut' }}
          >
            <p className="text-white/60 text-sm md:text-base tracking-[0.3em] uppercase mb-4">
              Visual Storytelling
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 leading-tight">
              <span className="block">Every Moment</span>
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
                Tells a Story
              </span>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-xl mx-auto font-light leading-relaxed">
              捕捉光影，定格永恒 — 用镜头记录生活的美好瞬间
            </p>
          </motion.div>
        </div>

        {/* Bottom Section - CTA & Indicator */}
        <div className="flex flex-col items-center gap-8">
          {/* Slide Indicators */}
          {images.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="flex gap-2"
            >
              {images.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setDirection(idx > currentIndex ? 1 : -1)
                    setCurrentIndex(idx)
                  }}
                  className={`h-1 rounded-full transition-all duration-500 ${
                    idx === currentIndex 
                      ? 'w-8 bg-gradient-to-r from-amber-400 to-orange-400' 
                      : 'w-2 bg-white/30 hover:bg-white/50'
                  }`}
                  aria-label={`Go to slide ${idx + 1}`}
                />
              ))}
            </motion.div>
          )}

          {/* Main CTA Button */}
          <motion.button
            type="button"
            onClick={handleStartClick}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            className="group relative overflow-hidden px-8 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white font-medium tracking-wide hover:bg-white/20 transition-all duration-300"
          >
            <span className="relative z-10 flex items-center gap-2">
              探索作品集
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </span>
          </motion.button>

          {/* Scroll Indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5, duration: 1 }}
            className="text-white/50 flex flex-col items-center gap-2"
          >
            <span className="text-xs tracking-widest uppercase">Scroll</span>
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <ChevronDown className="w-5 h-5" />
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}