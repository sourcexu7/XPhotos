import { fetchFeaturedImages } from '~/lib/db/query/images'
import HeroSection from '~/components/layout/hero-section'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'
import type { ImageHandleProps } from '~/types/props'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'
import ThemeGalleryClient from '~/components/layout/theme-gallery-client'

export default async function Home() {
  const featuredImages = await fetchFeaturedImages()

  const getData = async (pageNum: number, album: string) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album)
  }

  const getPageTotal = async (album: string) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable',
      'custom_index_origin_enable'
    ])
  }

  const getStyleConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_style',
    ])
  }

  const style: Config[] = await getStyleConfig()
  const systemStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value || '0'

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: '/',
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <>
      <HeroSection images={featuredImages} />
      <div className="min-h-screen bg-background">
        <ThemeGalleryClient systemStyle={systemStyle} {...props} />
      </div>
    </>
  )
}
