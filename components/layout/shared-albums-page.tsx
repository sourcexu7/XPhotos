import { fetchCameraAndLensList } from '~/lib/db/query/images'
import type { ImageHandleProps } from '~/types/props'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'
import { fetchTagsList } from '~/lib/db/query/tags'
import { ThemeGalleryClient } from '~/components/layout/theme-gallery-client-dynamic'
import { getImagesByAlbum, getImageCountByAlbum, getGalleryConfig } from '~/lib/actions/gallery'

// /albums "景行集" 页面的实际渲染逻辑。
// 抽成独立组件是为了让 `/(default)/albums/page.tsx` 和 `/(theme)/[...album]/page.tsx`
// 在命中保留段 /albums 时都能渲染同样的内容，避免 Next.js 路由匹配歧义导致报错。
export default async function SharedAlbumsPage() {
  const style: Config[] = await fetchConfigsByKeys(['custom_index_style'])
  const systemStyle = style.find(a => a.config_key === 'custom_index_style')?.config_value || '2'

  const { cameras, lenses } = await fetchCameraAndLensList()
  const tagOptions = await fetchTagsList()

  const props: ImageHandleProps = {
    handle: getImagesByAlbum,
    args: 'getImages-client',
    album: '/',
    totalHandle: getImageCountByAlbum,
    configHandle: getGalleryConfig,
  }

  return (
    <div>
      <ThemeGalleryClient
        systemStyle={systemStyle}
        enableFilters
        filterOptions={{ cameras, lenses }}
        tagOptions={tagOptions?.map(t => t.name) ?? []}
        {...props}
      />
    </div>
  )
}
