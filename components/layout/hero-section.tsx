
'use client'

import { motion } from 'framer-motion'
import { ImageAutoSlider } from '~/components/ui/image-auto-slider'
import type { ImageType } from '~/types'

interface HeroSectionProps {
  images?: ImageType[]
}

export default function HeroSection({ images = [] }: HeroSectionProps) {
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
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="w-full"
          >
            <ImageAutoSlider images={images} />
          </motion.div>
        )}

        <div className="mt-16 md:mt-24">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-[32px] md:text-[48px] font-bold tracking-tight mb-[20px]"
          >
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505]">
              你所热爱的就是你的生活
            </span>
          </motion.h1>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-[16px] md:text-[20px] text-[#f0f0f0] font-normal tracking-wide leading-relaxed"
          >
            往事的光圈每一瞬间都很绝
          </motion.p>
        </div>
      </div>

      {/* Scroll Indicator */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
      >
        <div className="w-[30px] h-[50px] rounded-full border-2 border-white/20 flex justify-center p-2">
          <motion.div 
            animate={{ y: [0, 12, 0] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            className="w-1.5 h-1.5 rounded-full bg-white/50"
          />
        </div>
      </motion.div>
    </div>
  )
}
