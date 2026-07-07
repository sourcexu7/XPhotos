'use server'

import {
  fetchClientImagesListByAlbum,
  fetchClientImagesPageTotalByAlbum,
} from '~/lib/db/query/images'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { fetchImageByIdAndAuth } from '~/lib/db/query/images'

export async function getImagesByAlbum(
  pageNum: number,
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and',
  sortByShootTime?: 'desc' | 'asc',
) {
  return await fetchClientImagesListByAlbum(
    pageNum,
    album,
    cameras,
    lenses,
    tags,
    tagsOperator,
    sortByShootTime,
  )
}

export async function getImageCountByAlbum(
  album: string,
  cameras?: string[],
  lenses?: string[],
  tags?: string[],
  tagsOperator: 'and' | 'or' = 'and',
) {
  return await fetchClientImagesPageTotalByAlbum(album, cameras, lenses, tags, tagsOperator)
}

export async function getGalleryConfig() {
  return await fetchConfigsByKeys([
    'custom_index_download_enable',
    'custom_index_copy_link_enable',
    'custom_index_copy_direct_link_enable',
    'custom_index_copy_share_link_enable',
    'custom_index_origin_enable',
    'custom_index_style',
  ])
}

export async function getImageById(id: string) {
  return await fetchImageByIdAndAuth(String(id))
}
