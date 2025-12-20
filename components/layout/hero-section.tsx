
'use client'

import { motion } from 'framer-motion'
import { ImageAutoSlider } from '~/components/ui/image-auto-slider'
import type { ImageType } from '~/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

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
    router.push('/covers', { scroll: true })
  }

  return (
    <div className="relative w-full h-[80vh] md:h-[100vh] flex flex-col items-center pt-[25vh] overflow-hidden bg-background">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-background"></div>
        <div className="absolute top-0 left-0 w-full h-full bg-[url('/noise.png')] opacity-20 mix-blend-overlay"></div>
        {/* Aurora / Light Spots */}
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-[#9d4edd] blur-[120px] opacity-20 animate-blob"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-[#ff9505] blur-[120px] opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute top-[40%] left-[40%] w-[30%] h-[30%] rounded-full bg-[#7b2cbf] blur-[100px] opacity-15 animate-blob animation-delay-4000"></div>
      </div>

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
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505]">
              到最深处 纵然那只是瞬间
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
            className="text-[16px] md:text-[20px] text-[#f0f0f0] font-normal tracking-wide leading-relaxed"
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
              hover:bg-gradient-to-r hover:from-[#9d4edd]/70 hover:to-[#ff9505]/70
              hover:text-white
              hover:border-white/40
              focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60
              active:scale-[0.97]
            "
            aria-label="Start"
          >
            Start
          </motion.button>
        </div>
      </div>
    </div>
  )
}
