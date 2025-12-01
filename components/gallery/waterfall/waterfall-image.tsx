'use client'

import { useRouter } from 'next-nprogress-bar'
import { useBlurImageDataUrl } from '~/hooks/use-blurhash'
import { MotionImage } from '~/components/album/motion-image'
import { useState } from 'react'
import type { ImageType } from '~/types'
import { theme } from 'antd'

export default function WaterfallImage({ photo }: { photo: ImageType }) {
  const router = useRouter()
  const { token } = theme.useToken()
  const [isHovered, setIsHovered] = useState(false)
  const dataURL = useBlurImageDataUrl(photo.blurhash)

  return (
    <div 
      style={{
        position: 'relative',
        marginBottom: token.margin,
        breakInside: 'avoid',
        cursor: 'pointer',
        overflow: 'hidden',
        borderRadius: token.borderRadius,
        transition: 'all 0.3s',
        transform: isHovered ? 'scale(1.02)' : 'scale(1)',
        boxShadow: isHovered ? token.boxShadow : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => router.push(`/preview/${photo?.id}`)}
    >
      <MotionImage
        style={{ width: '100%', height: 'auto', display: 'block' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
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
        <div style={{ position: 'absolute', top: token.paddingSM, left: token.paddingSM }}>
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
          background: 'linear-gradient(to top, rgba(0,0,0,0.6), rgba(0,0,0,0), transparent)',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.3s',
        }}
      >
        {photo.detail && (
          <div style={{ 
            position: 'absolute', 
            bottom: 0, 
            left: 0, 
            right: 0, 
            padding: token.padding 
          }}>
            <p style={{ 
              color: 'white', 
              fontSize: token.fontSizeSM, 
              fontWeight: 300,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              margin: 0,
            }}>
              {photo.detail}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
