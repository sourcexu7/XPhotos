import { fetchClientImagesListByAlbum, fetchClientImagesPageTotalByAlbum } from '~/lib/db/query/images'
import type { ImageHandleProps } from '~/types/props.ts'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import 'react-photo-album/masonry.css'
import type { Config } from '~/types'
import ThemeGalleryClient from '~/components/layout/theme-gallery-client'
import CoversBackButton from '~/components/layout/covers-back-button'
import Link from 'next/link'

export default async function Page({
  params,
  searchParams
}: {
  params: Promise<{ album: string }>
  searchParams: Promise<{ style?: string }>
}) {
  const { album } = await params
  const { style } = await searchParams

  const preferredStyle = style === '1'
    ? 'single'
    : style === '2'
      ? 'waterfall'
      : undefined

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

  const props: ImageHandleProps = {
    handle: getData,
    args: 'getImages-client',
    album: `/${album}`,
    totalHandle: getPageTotal,
    configHandle: getConfig
  }

  return (
    <div className="pt-16">
      <div className="container mx-auto px-4 mb-4">
        <CoversBackButton />
      </div>
      <ThemeGalleryClient systemStyle={systemStyle} preferredStyle={preferredStyle} {...props} />
    </div>
  )
}