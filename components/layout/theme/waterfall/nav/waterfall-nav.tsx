'use client'

import { useState, useEffect } from 'react'
import type { AlbumType } from '~/types'
import AlbumSelector from './album-selector'

interface WaterfallNavProps {
  albums?: AlbumType[]
  currentAlbum?: string
}

export default function WaterfallNav({ albums = [], currentAlbum = '/' }: WaterfallNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <nav 
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-in-out
        ${isScrolled 
          ? 'bg-white/80 dark:bg-black/80 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-center">
          {/* 相册选择器 */}
          <AlbumSelector albums={albums} currentAlbum={currentAlbum} />
        </div>
      </div>
    </nav>
  )
}
