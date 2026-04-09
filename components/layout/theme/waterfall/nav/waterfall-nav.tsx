'use client'

import { useState, useEffect } from 'react'
import type { AlbumType } from '~/types'
import AlbumSelector from './album-selector'
import HeaderIconGroup from '~/components/layout/header-icon-group.tsx'
import type { AlbumDataProps } from '~/types/props.ts'

interface WaterfallNavProps extends AlbumDataProps {
  currentAlbum?: string
}

export default function WaterfallNav({ data, currentAlbum = '/' }: WaterfallNavProps) {
  const albums = data?.albums || []
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
          ? 'bg-white/80 dark:bg-background/80 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
        }
      `}
    >
      <div className="max-w-[1400px] mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {/* 相册选择器 */}
            <AlbumSelector albums={albums} currentAlbum={currentAlbum} />
          </div>
          <div className="flex items-center">
            <HeaderIconGroup {...{ data }} />
          </div>
        </div>
      </div>
    </nav>
  )
}
