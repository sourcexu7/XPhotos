import HeroSection from '~/components/layout/hero-section'
import { fetchFeaturedImages } from '~/lib/db/query/images'

export default async function Home() {
  const featuredImages = await fetchFeaturedImages()

  return (
    <HeroSection images={featuredImages} />
  )
}
