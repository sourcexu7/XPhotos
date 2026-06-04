import HeroSection from '~/components/hero/hero-section'
import { fetchFeaturedImages } from '~/lib/db/query/images'
import { fetchAlbumsShow } from '~/lib/db/query/albums'
import { AlbumGrid } from '~/components/album/album-grid'

export default async function Home() {
  const featuredImages = await fetchFeaturedImages()
  const albums = await fetchAlbumsShow()

  return (
    <div className="min-h-screen">
      <HeroSection images={featuredImages} />
      <AlbumGrid albums={albums} />
    </div>
  )
}