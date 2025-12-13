'use client'

import { useRouter } from 'next-nprogress-bar'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { MotionImage } from '~/components/album/motion-image'
import { useState } from 'react'
import type { ImageType } from '~/types'
import { motion } from 'framer-motion'

export default function WaterfallImage({ photo, index }: { photo: ImageType, index?: number }) {
  const router = useRouter()
  const [isHovered, setIsHovered] = useState(false)
  const dataURL = useBlurImageDataUrl(photo.blurhash)

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: index ? (index % 3) * 0.1 : 0 }}
      style={{
        position: 'relative',
        marginBottom: '40px',
        breakInside: 'avoid',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: '12px',
        transition: 'all 0.4s ease',
        transform: isHovered ? 'scale(1.05)' : 'scale(1)',
        boxShadow: isHovered ? '0 0 20px rgba(157, 78, 221, 0.5)' : 'none',
        border: '1px solid transparent',
        borderImage: isHovered ? 'linear-gradient(to right, #9d4edd, #ff9505) 1' : 'none',
      }}
      className="group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/preview/${photo?.id}`)}
    >
      {/* Gradient Border Hack for rounded corners */}
      <div 
        className="absolute inset-0 rounded-[12px] pointer-events-none"
        style={{
          padding: '1px',
          background: isHovered ? 'linear-gradient(to right, #9d4edd, #ff9505)' : 'transparent',
          WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          WebkitMaskComposite: 'xor',
          maskComposite: 'exclude',
        }}
      />

      <MotionImage
        style={{ width: '100%', height: 'auto', display: 'block' }}
        src={photo.preview_url || photo.url}
        overrideSrc={photo.preview_url || photo.url}
        alt={photo.detail || 'image'}
        width={photo.width}
        height={photo.height}
        unoptimized
        loading="lazy"
        placeholder="blur"
        blurDataURL={dataURL}
      />
      
      {/* LivePhoto 标识 */}
      {photo.type === 2 && (
        <div style={{ position: 'absolute', top: 12, left: 12, zIndex: 10 }}>
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            style={{ color: 'white', opacity: 0.8, filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))' }}
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            strokeWidth="2" 
            stroke="currentColor" 
            fill="none"
            strokeLinecap="round" 
            strokeLinejoin="round"
          >
            <path stroke="none" fill="none"></path>
            <circle cx="12" cy="12" r="1"></circle>
            <circle cx="12" cy="12" r="5"></circle>
            <line x1="15.9" y1="20.11" x2="15.9" y2="20.12"></line>
            <line x1="19.04" y1="17.61" x2="19.04" y2="17.62"></line>
            <line x1="20.77" y1="14" x2="20.77" y2="14.01"></line>
            <line x1="20.77" y1="10" x2="20.77" y2="10.01"></line>
            <line x1="19.04" y1="6.39" x2="19.04" y2="6.4"></line>
            <line x1="15.9" y1="3.89" x2="15.9" y2="3.9"></line>
            <line x1="12" y1="3" x2="12" y2="3.01"></line>
            <line x1="8.1" y1="3.89" x2="8.1" y2="3.9"></line>
            <line x1="4.96" y1="6.39" x2="4.96" y2="6.4"></line>
            <line x1="3.23" y1="10" x2="3.23" y2="10.01"></line>
            <line x1="3.23" y1="14" x2="3.23" y2="14.01"></line>
            <line x1="4.96" y1="17.61" x2="4.96" y2="17.62"></line>
            <line x1="8.1" y1="20.11" x2="8.1" y2="20.12"></line>
            <line x1="12" y1="21" x2="12" y2="21.01"></line>
          </svg>
        </div>
      )}

      {/* 悬停时显示的遮罩和信息 */}
      <div 
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(157, 78, 221, 0.2), rgba(255, 149, 5, 0.2))',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
          mixBlendMode: 'overlay',
        }}
      />
      
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, transparent 50%)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.4s ease',
        }}
      >
        {photo.detail && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: '16px',
            transform: isHovered ? 'translateY(0)' : 'translateY(10px)',
            transition: 'transform 0.4s ease',
          }}>
            <p style={{ 
              color: 'white', 
              fontSize: '14px', 
              fontWeight: 500,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
              textShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}>
              {photo.detail}
            </p>
          </div>
        )}
      </div>
    </motion.div>
  )
}

