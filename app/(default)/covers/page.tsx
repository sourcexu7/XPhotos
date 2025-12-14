import { DestinationCard } from '~/components/ui/card-21'
import { fetchAlbumsShow } from '~/lib/db/query/albums'
import { fetchClientImagesCountByAlbum } from '~/lib/db/query/images'
import { Button } from '~/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { getTranslations } from 'next-intl/server'

function getThemeColor(str: string) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = Math.abs(hash % 360);
  return `${h} 50% 35%`;
}

export default async function CoversPage() {
  const t = await getTranslations('Words')
  const albums = await fetchAlbumsShow()
  
  const albumsWithCounts = await Promise.all(
    albums
      .filter(album => album.cover)
      .map(async (album) => {
        const count = await fetchClientImagesCountByAlbum(album.album_value)
        return {
          ...album,
          count
        }
      })
  )

  return (
    <div className="pt-[80px] min-h-screen bg-background">
      <div className="container mx-auto px-4 mb-8">
         <Link href="/albums">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            返回作品合集
          </Button>
        </Link>
        {albumsWithCounts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 max-w-6xl mx-auto">
            {albumsWithCounts.map((album) => (
              <div key={album.id} className="w-full aspect-[4/3]">
                <DestinationCard
                  imageUrl={album.cover!}
                  location={album.name}
                  stats={`${album.count} PHOTOS`}
                  href={album.album_value}
                  themeColor={getThemeColor(album.name)}
                  exploreText={t('explore_now')}
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
