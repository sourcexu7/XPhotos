import { redirect } from 'next/navigation'
import React from 'react'
import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'
import { fetchAlbumByRouter, fetchAlbumsShow } from '~/lib/db/query/albums'
import type { ImageHandleProps } from '~/types/props.ts'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'
import CoversBackButton from '~/components/layout/covers-back-button'
import AlbumNav from '~/components/layout/album-nav'
import SharedAlbumsPage from '~/components/layout/shared-albums-page'
import { ThemeGalleryClient } from '~/components/layout/theme-gallery-client-dynamic'

// 不属于相册动态路由的保留路径。
// theme 路由组使用了 catch-all `[...album]`，所以 /albums、/covers 等静态 URL
// 也可能被错误地匹配到这里。遇到这些保留段时直接渲染对应的静态页面内容，
// 避免用"不存在的相册"去查数据库而抛错。
const SEGMENT_HANDLERS: Record<string, () => React.ReactElement> = {
  albums: () => <SharedAlbumsPage />,
}

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ album: string | string[] }>
  searchParams: Promise<{ style?: string }>
}) {
  const raw = (await params).album
  const segments: string[] = Array.isArray(raw)
    ? raw
    : typeof raw === 'string'
      ? raw.split('/').filter(Boolean)
      : []

  // 命中保留段 /albums：直接渲染对应的静态页面
  if (segments.length > 0 && SEGMENT_HANDLERS[segments[0]]) {
    return SEGMENT_HANDLERS[segments[0]]()
  }
  // 命中其他保留段：redirect 到 /covers（让真正的静态路由处理）
  const OTHER_RESERVED = new Set(['covers', 'about', 'guides', 'preview', 'admin', 'login', 'rss.xml', 'api'])
  if (segments.length > 0 && OTHER_RESERVED.has(segments[0])) {
    redirect('/covers')
  }

  const { style } = await searchParams

  const preferredStyle = style === '1'
    ? 'single'
    : style === '2'
      ? 'waterfall'
      : undefined

  const albumSlash = segments.length === 0 ? '/' : `/${segments.join('/')}`

  // 先校验这个 album 是否真的存在，避免下游查询失败抛错
  const albumData = await fetchAlbumByRouter(albumSlash).catch(() => null)
  if (!albumData && segments.length > 0) {
    redirect('/covers')
  }

  const getData = async (
    pageNum: number,
    album: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator: 'and' | 'or' = 'and'
  ) => {
    'use server'
    return await fetchClientImagesListByAlbum(pageNum, album, cameras, lenses, tags, tagsOperator)
  }

  const getPageTotal = async (
    album: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator: 'and' | 'or' = 'and'
  ) => {
    'use server'
    return await fetchClientImagesPageTotalByAlbum(album, cameras, lenses, tags, tagsOperator)
  }

  const getConfig = async () => {
    'use server'
    return await fetchConfigsByKeys([
      'custom_index_download_enable',
      'custom_index_style'
    ])
  }

  const configs: Config[] = await getConfig()
  const systemStyle = configs.find(a => a.config_key === 'custom_index_style')?.config_value || '0'
  const albums = await fetchAlbumsShow()

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: albumSlash,
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <div className="pt-16">
      <div className="container mx-auto px-4 mb-4">
        <CoversBackButton />
      </div>
      <ThemeGalleryClient systemStyle={systemStyle} preferredStyle={preferredStyle} {...props} />
      <div className="container mx-auto px-4 py-6 mt-4">
        <AlbumNav currentAlbumValue={albumSlash} albums={albums} />
      </div>
    </div>
  )
}
