
'use client'

import { motion } from 'framer-motion'
import { ImageAutoSlider } from '~/components/ui/image-auto-slider'
import type { ImageType } from '~/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { safePush } from '~/lib/router/safe-navigation'
import DynamicBackground from './dynamic-background'

interface HeroSectionProps {
  images?: ImageType[]
}

export default function HeroSection({ images = [] }: HeroSectionProps) {
  const router = useRouter()
  useEffect(() => {
    // 需求修改：预取「城隅寻迹」路由，减少跳转闪屏
    router.prefetch('/covers')
  }, [router])
  // 需求修改：Start 按钮改为路由跳转到「城隅寻迹」页面
  const handleStartClick = () => {
    safePush(router, '/covers?from=hero', { scroll: true })
  }

  return (
    <div className="relative w-full h-[80vh] md:h-[100vh] flex flex-col items-center pt-[25vh] overflow-hidden bg-background">
      {/* Dynamic Background */}
      <DynamicBackground />

      {/* Content */}
      <div className="relative z-10 text-center px-4 flex flex-col items-center w-full max-w-7xl">
        {/* Image Slider */}
        {images.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="w-full"
          >
            <ImageAutoSlider images={images} />
          </motion.div>
        )}

        <div className="mt-16 md:mt-24 flex flex-col items-center gap-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-[32px] md:text-[48px] font-bold tracking-tight mb-[20px]"
            aria-label="到最深处 纵然那只是瞬间"
          >
            <span
              className="bg-clip-text text-transparent"
              style={{ backgroundImage: 'linear-gradient(to right, var(--primary), var(--secondary))' }}
            >
              到最深处 纵然那只是瞬间
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-[16px] md:text-[20px] text-foreground/90 font-normal tracking-wide leading-relaxed"
          >
            往事的光圈每一瞬间都很绝
          </motion.p>

          {/* 新增：玻璃磨砂 Start 按钮 */}
              <motion.button
            type="button"
            onClick={handleStartClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.05, boxShadow: '0 20px 50px rgba(0,0,0,0.45)' }}
            whileTap={{ scale: 0.97 }}
            className="
              group
              mt-4
              inline-flex items-center justify-center
              min-h-[48px] px-8
              rounded-full
              border border-white/20
              bg-white/10
              text-white/90 text-sm md:text-base font-medium tracking-wide
              shadow-[0_18px_45px_rgba(0,0,0,0.35)]
              backdrop-blur-[8px]
              transition-all duration-300
              hover:bg-[linear-gradient(to_right,var(--primary),var(--secondary))]
              hover:text-white
              hover:border-white/40
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
            "
            aria-label="Start"
          >
            <span className="flex items-center gap-2">
              Start
              <motion.span
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
              >
                →
              </motion.span>
            </span>
          </motion.button>
        </div>
      </div>
    </div>
  )
}
