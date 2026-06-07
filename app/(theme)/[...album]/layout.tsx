import { fetchAlbumByRouter, fetchAlbumsShow } from '~/lib/db/query/albums'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { AlbumType, Config } from '~/types'
import UnifiedNav from '~/components/layout/unified-nav'

// 不属于相册动态路由的"保留路径"。
// theme 路由组使用了 catch-all `[...album]`，所以 /albums、/covers 等静态 URL
// 也可能被错误地匹配到这里。命中这些保留段时，退化为与 /(default) 相同的导航布局，
// 让子 page 自行决定渲染内容，避免把"景行集"内容塞进"相册详情"的布局里。
const RESERVED_SEGMENTS = new Set([
  'albums',
  'covers',
  'about',
  'guides',
  'preview',
  'admin',
  'login',
  'rss.xml',
  'api',
])

function isReserved(segments: string[]): boolean {
  if (segments.length === 0) return false
  return RESERVED_SEGMENTS.has(segments[0])
}

async function renderDefaultNav(children: React.ReactNode) {
  // 保留段使用与 /(default)/layout.tsx 一致的导航，保证外观对齐
  const [configs, albums] = await Promise.all([
    fetchConfigsByKeys(['custom_index_style', 'custom_title']),
    fetchAlbumsShow(),
  ]).catch(() => [null, null] as const)

  const currentTheme = (configs as Config[] | null)?.find(
    a => a.config_key === 'custom_index_style',
  )?.config_value || '0'
  const siteTitle = (configs as Config[] | null)?.find(
    a => a.config_key === 'custom_title',
  )?.config_value || 'XPhotos'

  return (
    <>
      <UnifiedNav
        albums={(albums as AlbumType[] | null) ?? []}
        currentAlbum="/"
        currentTheme={currentTheme}
        siteTitle={siteTitle}
      />
      <div className="pt-14">{children}</div>
    </>
  )
}

export default async function ThemeAlbumLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ album: string | string[] }>
}>) {
  const raw = (await params).album
  const segments: string[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split('/').filter(Boolean)
      : []

  if (isReserved(segments)) {
    return renderDefaultNav(children)
  }

  const albumSlash = segments.length === 0 ? '/' : `/${segments.join('/')}`

  const [albums, configs, album] = await Promise.all([
    fetchAlbumsShow(),
    fetchConfigsByKeys(['custom_title', 'custom_index_style']),
    fetchAlbumByRouter(albumSlash),
  ]).catch(() => [null, null, null] as const)

  // 有 album 路径但数据库里找不到：同样退化到 default 布局，交给子 page 处理
  if (!album && segments.length > 0) {
    return renderDefaultNav(children)
  }

  const dataList: AlbumType[] = (albums as AlbumType[] | null) ?? []
  const currentTheme = (configs as Config[] | null)?.find(
    a => a.config_key === 'custom_index_style',
  )?.config_value || '0'
  const currentAlbum = (album as AlbumType | null)?.album_value || albumSlash
  const siteTitle = (configs as Config[] | null)?.find(
    a => a.config_key === 'custom_title',
  )?.config_value || 'XPhotos'

  return (
    <>
      <UnifiedNav albums={dataList} currentAlbum={currentAlbum} currentTheme={currentTheme} siteTitle={siteTitle} />
      <div className="pt-14">{children}</div>
    </>
  )
}
