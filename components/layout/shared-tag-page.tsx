import { fetchCameraAndLensList } from '~/lib/db/query/images'
import { fetchTagsList } from '~/lib/db/query/tags'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { Config } from '~/types'
import type { ImageHandleProps } from '~/types/props'
import { ThemeGalleryClient } from '~/components/layout/theme-gallery-client-dynamic'
import CoversBackButton from '~/components/layout/covers-back-button'
import { getImagesByAlbum, getImageCountByAlbum, getGalleryConfig } from '~/lib/actions/gallery'

// /tag/:tag 标签浏览页的实际渲染逻辑。
// 抽成独立组件是为了让两个路由同时复用：
//   1) /(default)/tag/[tag]/page.tsx     ← 静态路由（首选）
//   2) /(theme)/[...album]/page.tsx       ← 当 catch-all 命中 /tag/** 时兜底渲染
// 标签筛选通过 presetTags 写入 ThemeGalleryClient 的全局筛选状态实现，
// 用户仍可在筛选面板中叠加相机/镜头/关键字等条件。
export default async function SharedTagPage({ tag }: { tag: string }) {
  const tagName = decodeURIComponent(tag).trim()

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
      <div className="container mx-auto px-4 mb-4">
        <CoversBackButton />
      </div>
      <ThemeGalleryClient
        systemStyle={systemStyle}
        enableFilters
        presetTags={tagName ? [tagName] : undefined}
        filterOptions={{ cameras, lenses }}
        tagOptions={tagOptions?.map(t => t.name) ?? []}
        {...props}
      />
    </div>
  )
}
