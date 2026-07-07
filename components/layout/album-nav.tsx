'use client'

import Link from 'next/link'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '~/lib/utils'
import type { AlbumType } from '~/types'

interface AlbumNavProps {
  currentAlbumValue: string
  albums: AlbumType[]
}

export default function AlbumNav({ currentAlbumValue, albums }: AlbumNavProps) {
  // 找到当前相册的索引
  const currentIndex = albums.findIndex(album => album.album_value === currentAlbumValue)
  
  // 获取上一个和下一个相册
  const prevAlbum = currentIndex > 0 ? albums[currentIndex - 1] : null
  const nextAlbum = currentIndex < albums.length - 1 ? albums[currentIndex + 1] : null

  // 如果没有其他相册，不显示导航
  if (!prevAlbum && !nextAlbum) return null

  return (
    <div className="w-full flex justify-between items-center gap-4">
      {/* 上一个相册 */}
      {prevAlbum ? (
        <Link
          href={`/${prevAlbum.album_value.replace(/^\//, '')}`}
          className={cn(
            'group relative inline-flex items-center justify-center gap-2',
            'px-4 py-2.5 rounded-xl',
            'bg-background border border-border',
            'hover:bg-accent hover:text-foreground transition-all duration-150 ease-out',
            'min-h-[44px] min-w-[44px] touch-manipulation',
            'text-sm font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          )}
          aria-label={`上一个相册：${prevAlbum.name}`}
        >
          <ChevronLeft className="h-5 w-5 shrink-0" />
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {prevAlbum.name}
          </span>
        </Link>
      ) : (
        <div className="flex-1" />
      )}

      {/* 下一个相册 */}
      {nextAlbum ? (
        <Link
          href={`/${nextAlbum.album_value.replace(/^\//, '')}`}
          className={cn(
            'group relative inline-flex items-center justify-center gap-2',
            'px-4 py-2.5 rounded-xl',
            'bg-background border border-border',
            'hover:bg-accent hover:text-foreground transition-all duration-150 ease-out',
            'min-h-[44px] min-w-[44px] touch-manipulation',
            'text-sm font-medium',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
          )}
          aria-label={`下一个相册：${nextAlbum.name}`}
        >
          <span className="truncate max-w-[150px] sm:max-w-[200px]">
            {nextAlbum.name}
          </span>
          <ChevronRight className="h-5 w-5 shrink-0" />
        </Link>
      ) : (
        <div className="flex-1" />
      )}
    </div>
  )
}
