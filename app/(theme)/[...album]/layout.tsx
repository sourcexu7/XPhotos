import { fetchAlbumByRouter, fetchAlbumsShow } from '~/lib/db/query/albums'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { AlbumType, Config } from '~/types'
import UnifiedNav from '~/components/layout/unified-nav'

export default async function ThemeAlbumLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ album: string }>
}>) {
  const { album } = await params
  
  const getAlbum = async (album: string) => {
    'use server'
    return await fetchAlbumByRouter(album)
  }

  const getData = async () => {
    'use server'
    return await fetchAlbumsShow()
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys(['custom_title', 'custom_index_style'])
  }

  const dataList: AlbumType[] = await getData()
  const data: AlbumType = await getAlbum(`/${album}`)
  const configs: Config[] = await getConfig()
  
  // 使用系统配置的主题，而不是相册的主题字段
  const currentTheme = configs.find(a => a.config_key === 'custom_index_style')?.config_value || '0'
  const currentAlbum = data?.album_value || `/${album}`
  const siteTitle = configs.find(a => a.config_key === 'custom_title')?.config_value || 'XPhotos'

  return (
    <>
      <UnifiedNav albums={dataList} currentAlbum={currentAlbum} currentTheme={currentTheme} siteTitle={siteTitle} />
      <div className="pt-2">
        {children}
      </div>
    </>
  )
}
