'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { safePush } from '~/lib/router/safe-navigation'
import type { AlbumType } from '~/types'
import { ArrowRight } from 'lucide-react'

interface AlbumGridProps {
  albums: AlbumType[]
}

export function AlbumGrid({ albums }: AlbumGridProps) {
  const router = useRouter()

  const filteredAlbums = albums.filter((a) => a.cover && a.show)

  if (filteredAlbums.length === 0) return null

  return (
    <section className="py-24 bg-background">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="mb-16 text-center"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-light mb-4">
            <span className="text-foreground">作品集</span>
            <span className="text-primary ml-2">精选</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
            探索不同主题的摄影作品，每一个相册都记录着独特的故事
          </p>
        </motion.div>

        {/* Album Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredAlbums.slice(0, 6).map((album, index) => (
            <motion.div
              key={album.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut', delay: index * 0.1 }}
              whileHover={{ y: -8 }}
            >
              <AlbumCard album={album} onClick={() => safePush(router, `${album.album_value}?style=1`)} />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        {filteredAlbums.length > 6 && (
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="mt-16 text-center"
          >
            <button
              onClick={() => safePush(router, '/covers')}
              className="inline-flex items-center gap-2 px-8 py-4 bg-foreground text-background rounded-full font-medium hover:bg-foreground/90 transition-all duration-300 group"
            >
              查看全部相册
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </motion.div>
        )}
      </div>
    </section>
  )
}

interface AlbumCardProps {
  album: AlbumType
  onClick: () => void
}

function AlbumCard({ album, onClick }: AlbumCardProps) {
  return (
    <div
      className="group cursor-pointer"
      onClick={onClick}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl mb-4">
        <img
          src={album.cover || ''}
          alt={album.name}
          className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-300" />
        
        {/* Overlay Content */}
        <div className="absolute bottom-0 left-0 right-0 p-6 translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <p className="text-white/80 text-xs uppercase tracking-widest mb-2">
            相册
          </p>
          <h3 className="text-white text-xl font-medium mb-1">
            {album.name}
          </h3>
          <p className="text-white/70 text-sm flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary inline-block" />
            {album.random_show ? '随机展示' : '顺序排列'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-medium text-foreground group-hover:text-primary transition-colors">
            {album.name}
          </h4>
          <p className="text-sm text-muted-foreground mt-1">
            {album.description || '探索精彩瞬间'}
          </p>
        </div>
        <div className="flex items-center gap-1 text-primary opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-sm">浏览</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </div>
  )
}
