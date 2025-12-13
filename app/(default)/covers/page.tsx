import { FocusCards } from '~/components/ui/focus-cards'
import { fetchAlbumsShow } from '~/lib/db/query/albums'
import { Button } from '~/components/ui/button'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default async function CoversPage() {
  const albums = await fetchAlbumsShow()
  const focusCardsItems = albums
    .filter(album => album.cover)
    .map(album => ({
      title: album.name,
      src: album.cover!,
      link: album.album_value
    }))

  return (
    <div className="pt-[80px] min-h-screen bg-background">
      <div className="container mx-auto px-4 mb-8">
         <Link href="/albums">
          <Button variant="ghost" className="gap-2 pl-0 hover:bg-transparent hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            返回作品合集
          </Button>
        </Link>
        {focusCardsItems.length > 0 ? (
          <FocusCards cards={focusCardsItems} />
        ) : (
          <div className="text-center text-gray-500 py-20">暂无相册封面</div>
        )}
      </div>
    </div>
  )
}
