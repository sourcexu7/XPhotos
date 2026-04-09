'use client'

import { useState } from 'react'
import type { AlbumType } from '~/types'
import { useRouter } from 'next/navigation'
import { ChevronDownIcon } from '@radix-ui/react-icons'
import { safePush } from '~/lib/router/safe-navigation'

interface AlbumSelectorProps {
  albums: AlbumType[]
  currentAlbum?: string
}

export default function AlbumSelector({ albums, currentAlbum = '/' }: AlbumSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const router = useRouter()

  const handleAlbumChange = (albumValue: string) => {
    setIsOpen(false)
    if (albumValue === '/') {
      safePush(router, '/albums')
    } else {
      safePush(router, albumValue)
    }
  }

  const currentAlbumData = albums.find(a => a.album_value === currentAlbum) || { name: '全部照片', album_value: '/' }

  // 过滤掉根路径相册
  const filteredAlbums = albums.filter(album => album.album_value !== '/')

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center space-x-2 px-4 py-2 rounded-lg
          bg-muted dark:bg-muted
          hover:bg-muted/80 dark:hover:bg-muted/80
          transition-colors duration-200
          text-sm font-medium
        "
      >
        <span>{currentAlbumData.name}</span>
        <ChevronDownIcon 
          className={`transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          width={16} 
          height={16} 
        />
      </button>

      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* 下拉菜单 */}
          <div className="
            absolute top-full left-0 mt-2 z-50
            min-w-[200px] max-h-[400px] overflow-y-auto
            bg-card dark:bg-card
            rounded-lg shadow-lg border border-border dark:border-border
            py-2
          ">
            {/* 全部照片选项 */}
            <button
              onClick={() => handleAlbumChange('/')}
              className={`
                w-full px-4 py-2 text-left text-sm
                hover:bg-muted dark:hover:bg-muted
                transition-colors duration-150
                ${currentAlbum === '/' ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium' : ''}
              `}
            >
              全部照片
            </button>

            {/* 相册列表 */}
            {filteredAlbums.length > 0 ? (
              filteredAlbums.map((album) => (
                <button
                  key={album.id}
                  onClick={() => handleAlbumChange(album.album_value)}
                  className={`
                    w-full px-4 py-2 text-left text-sm
                    hover:bg-muted dark:hover:bg-muted
                    transition-colors duration-150
                    ${currentAlbum === album.album_value ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary font-medium' : ''}
                  `}
                >
                  <span>{album.name}</span>
                </button>
              ))
            ) : (
              <div className="px-4 py-2 text-sm text-muted-foreground">
                暂无相册
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
