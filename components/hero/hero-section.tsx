
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
    <div className="relative w-full min-h-[100vh] flex flex-col items-center justify-center px-4 py-12 overflow-hidden bg-background">
      {/* Dynamic Background */}
      <DynamicBackground />

      {/* Content */}
      <div className="relative z-10 text-center flex flex-col items-center w-full max-w-7xl">
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

        <div className="mt-8 md:mt-16 flex flex-col items-center gap-6">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="text-[28px] sm:text-[32px] md:text-[48px] font-bold tracking-tight mb-4"
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
            className="text-[14px] sm:text-[16px] md:text-[20px] text-foreground/90 font-normal tracking-wide leading-relaxed max-w-2xl"
          >
            往事的光圈每一瞬间都很绝
          </motion.p>

          {/* 占位空间，使按钮在手机端更靠下 */}
          <div className="h-8 sm:h-12 md:h-16"></div>

          {/* 毛玻璃 Start 按钮 */}
          <motion.button
            type="button"
            onClick={handleStartClick}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease: 'easeOut' }}
            whileHover={{ scale: 1.06, y: -2 }}
            whileTap={{ scale: 0.96 }}
            className="
              group relative
              inline-flex items-center justify-center gap-2.5
              min-h-[52px] px-10
              rounded-full
              font-semibold text-sm md:text-base tracking-widest uppercase
              text-white/95 dark:text-white/90
              transition-all duration-500 ease-out
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2
              cursor-pointer
            "
            style={{
              background: 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(255,255,255,0.25)',
              boxShadow: `
                0 8px 32px rgba(0,0,0,0.12),
                inset 0 1px 0 rgba(255,255,255,0.3),
                inset 0 -1px 0 rgba(0,0,0,0.05)
              `,
            }}
            onMouseEnter={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, var(--primary), var(--secondary))'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.4)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = `
                0 12px 40px rgba(37,99,235,0.35),
                inset 0 1px 0 rgba(255,255,255,0.3),
                inset 0 -1px 0 rgba(0,0,0,0.05)
              `
            }}
            onMouseLeave={(e) => {
              ;(e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(255,255,255,0.18) 0%, rgba(255,255,255,0.08) 100%)'
              ;(e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.25)'
              ;(e.currentTarget as HTMLElement).style.boxShadow = `
                0 8px 32px rgba(0,0,0,0.12),
                inset 0 1px 0 rgba(255,255,255,0.3),
                inset 0 -1px 0 rgba(0,0,0,0.05)
              `
            }}
            aria-label="Start"
          >
            {/* 内部高光层 */}
            <span className="absolute inset-0 rounded-full pointer-events-none" 
              style={{
                background: 'linear-gradient(105deg, rgba(255,255,255,0.25) 0%, transparent 45%, transparent)',
              }}
            />
            <span className="relative flex items-center gap-2.5">
              Start
              <motion.span
                initial={{ x: 0 }}
                animate={{ x: [0, 5, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="text-base"
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
