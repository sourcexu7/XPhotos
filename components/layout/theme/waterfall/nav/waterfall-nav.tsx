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
        fixed top-0 left-0 right-0 z-50 h-14
        transition-all duration-500 ease-out
        ${isScrolled
          ? 'bg-background/80 backdrop-blur-2xl border-b border-border/30 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)]'
          : 'bg-transparent border-b border-transparent'
        }
      `}
    >
      <div className="max-w-[1400px] mx-auto px-8 h-full">
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center">
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
