import { fetchAlbumsShow } from '~/lib/db/query/albums'
import type { AlbumType, Config } from '~/types'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import UnifiedNav from '~/components/layout/unified-nav'

const DEFAULT_STYLE = '0'
const DEFAULT_TITLE = 'XPhotos'

export default async function DefaultLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [configs, albums] = await Promise.all([
    fetchConfigsByKeys(['custom_index_style', 'custom_title']),
    fetchAlbumsShow(),
  ])

  const currentStyle = configs.find((c) => c.config_key === 'custom_index_style')?.config_value || DEFAULT_STYLE
  const siteTitle = configs.find((c) => c.config_key === 'custom_title')?.config_value || DEFAULT_TITLE

  return (
    <>
      <UnifiedNav
        albums={albums}
        currentAlbum="/"
        currentTheme={currentStyle}
        siteTitle={siteTitle}
      />
      <div className="pt-4 sm:pt-6 md:pt-8">{children}</div>
    </>
  )
}
