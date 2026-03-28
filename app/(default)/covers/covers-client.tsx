'use client'

import useSWR from 'swr'
import { DestinationCard } from '~/components/ui/card-21'
import { Button } from '~/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useTranslations } from 'next-intl'

type AlbumWithCount = {
  id: string
  name: string
  cover: string | null
  album_value: string
  count: number
}

function getThemeColor(str: string) {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  const h = Math.abs(hash % 360)
  return `${h} 50% 35%`
}

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Request failed: ${res.status}`)
  return res.json()
}

export default function CoversClient() {
  const t = useTranslations('Words')

  const { data, error, isLoading, mutate } = useSWR<AlbumWithCount[]>('/api/v1/public/covers', fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    keepPreviousData: true,
    dedupingInterval: 120_000, // 增加到2分钟
    refreshInterval: 0, // 禁用自动刷新
    errorRetryCount: 3, // 增加错误重试次数
  })

  // 只渲染有有效封面的相册，避免 null cover 导致异常
  const albums = Array.isArray(data) ? data.filter((a) => a.cover) : []

  return (
    <div className="pt-[80px] min-h-screen bg-background">
      <div className="container mx-auto px-4 mb-8">
        <Link href="/albums">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            返回作品合集
          </Button>
        </Link>

        {error ? (
          <div className="text-center py-20 px-4">
            <p className="text-gray-500 mb-4">加载失败，请检查网络后重试</p>
            <Button variant="outline" size="sm" onClick={() => mutate()}>
              重新加载
            </Button>
          </div>
        ) : isLoading ? (
          <div className="text-center text-gray-500 py-20">加载中...</div>
        ) : albums.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {albums.map((album) => (
              <div key={album.id} className="w-full aspect-[4/3]">
                <DestinationCard
                  imageUrl={album.cover ?? ''}
                  location={album.name}
                  stats={`${album.count} PHOTOS`}
                  href={`${album.album_value}?style=1`}
                  themeColor={getThemeColor(album.name)}
                  exploreText={t('explore_now')}
                  enableImageColor={false}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-gray-500 py-20">暂无相册封面</div>
        )}
      </div>
    </div>
  )
}

