'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import type { ImageType } from '~/types'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { safePush } from '~/lib/router/safe-navigation'
import { ArrowRight } from 'lucide-react'

interface HeroSectionProps {
  images?: ImageType[]
}

export default function HeroSection({ images = [] }: HeroSectionProps) {
  const router = useRouter()
  const reduceMotion = useReducedMotion()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  useEffect(() => {
    router.prefetch('/covers')
  }, [router])

  const handleStartClick = () => {
    safePush(router, '/covers?from=hero', { scroll: true })
  }

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
    <section className="relative w-full h-[100dvh] min-h-[480px] overflow-hidden -mt-14">
      {/* Full-screen Image Background */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="crossfade">
          {currentImage && (
            <motion.div
              key={currentImage.id}
              initial={reduceMotion ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: reduceMotion ? 0 : 1.8, ease: [0.25, 0.1, 0.25, 1] }}
              className="absolute inset-0"
            >
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${currentImage.preview_url || currentImage.url})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)]" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div
        className="relative z-10 h-full flex flex-col px-5 sm:px-8 md:px-12 lg:px-16"
        style={{
          paddingTop: 'max(calc(56px + env(safe-area-inset-top)), 68px)',
          paddingBottom: 'max(env(safe-area-inset-bottom), 20px)',
        }}
      >
        {/* Top bar — label only */}
        <div className="shrink-0 flex items-center py-1">
          <motion.span
            initial={reduceMotion ? false : { opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.2, duration: reduceMotion ? 0 : 0.8 }}
            className="text-white/80 font-light tracking-[0.25em] text-xs uppercase"
          >
            Photography
          </motion.span>
        </div>

        {/* Center — title */}
        <div className="flex-1 flex flex-col items-center justify-center text-center min-h-0">
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.5, duration: reduceMotion ? 0 : 1, ease: 'easeOut' }}
          >
            <p className="text-white/50 text-[10px] sm:text-xs tracking-[0.35em] uppercase mb-2 sm:mb-3">
              Visual Storytelling
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white leading-[1.1] mb-3 sm:mb-4">
              <span className="block">Every Moment</span>
              <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-cyan-400 bg-clip-text text-transparent">
                Tells a Story
              </span>
            </h1>
            <p className="text-white/60 text-xs sm:text-sm max-w-[260px] sm:max-w-sm mx-auto font-light leading-relaxed">
              捕捉光影，定格永恒 — 用镜头记录生活的美好瞬间
            </p>
          </motion.div>
        </div>

        {/* Bottom bar — 3-column: counter | CTA | arrows */}
        <div className="shrink-0 grid grid-cols-3 items-center gap-2 py-1 mb-6 sm:mb-10 md:mb-14">

          {/* Left: slide counter + progress line */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.8, duration: reduceMotion ? 0 : 0.7 }}
            className="flex items-center gap-2 sm:gap-3"
          >
            {images.length > 0 ? (
              <>
                <span className="text-white/50 text-[10px] sm:text-xs font-mono tabular-nums select-none">
                  {String(currentIndex + 1).padStart(2, '0')}
                  <span className="mx-1 text-white/25">/</span>
                  {String(images.length).padStart(2, '0')}
                </span>
                {/* Animated progress track */}
                <div className="hidden sm:block relative h-px flex-1 max-w-[72px] bg-white/15 overflow-hidden rounded-full">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400/70 to-orange-400/70"
                    animate={{ width: `${((currentIndex + 1) / images.length) * 100}%` }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                  />
                </div>
              </>
            ) : null}
          </motion.div>

          {/* Center: CTA button */}
          <div className="flex justify-center">
            <motion.button
              type="button"
              onClick={handleStartClick}
              initial={reduceMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: reduceMotion ? 0 : 0.9, duration: reduceMotion ? 0 : 0.8 }}
              whileHover={reduceMotion ? {} : { scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="group flex items-center gap-1.5 sm:gap-2 px-5 sm:px-7 py-2.5 sm:py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-xs sm:text-sm font-medium tracking-wide hover:bg-white/20 transition-all duration-300 whitespace-nowrap"
            >
              探索作品集
              <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:translate-x-0.5 transition-transform duration-200" />
            </motion.button>
          </div>

          {/* Right: prev / next arrows */}
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduceMotion ? 0 : 0.8, duration: reduceMotion ? 0 : 0.7 }}
            className="flex justify-end items-center gap-1 sm:gap-2"
          >
            {images.length > 0 && (
              <>
                <button
                  onClick={handlePrev}
                  aria-label="Previous"
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/15 transition-all duration-200 btn-press"
                >
                  <svg className="w-3.5 h-3.5 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                <button
                  onClick={handleNext}
                  aria-label="Next"
                  className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/60 hover:text-white hover:border-white/40 hover:bg-white/15 transition-all duration-200 btn-press"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </>
            )}
          </motion.div>

        </div>
      </div>
    </section>
  )
}
