/**
 * 相册相关 API 服务
 */

import { apiClient } from '../client'

export interface UpdateAlbumParams {
  id: string
  name?: string
  album_value?: string
  detail?: string | null
  theme?: string
  show?: number
  sort?: number
  license?: string | null
  image_sorting?: number
  random_show?: number
  cover?: string | null
}

export interface UpdateAlbumSortParams {
  orderedIds: string[]
}

export interface UpdateAlbumShowParams {
  albumId: string
  show: number
}

/**
 * 更新相册信息
 */
export async function updateAlbum(params: UpdateAlbumParams) {
  return apiClient.put('/albums/update', params)
}

/**
 * 更新相册排序
 */
export async function updateAlbumSort(params: UpdateAlbumSortParams) {
  return apiClient.put('/albums/update-sort', params)
}

/**
 * 更新相册显示状态
 */
export async function updateAlbumShow(params: UpdateAlbumShowParams) {
  return apiClient.put('/albums/update-show', params)
}

/**
 * 获取相册列表
 */
export async function getAlbums() {
  return apiClient.get('/albums/get')
}
