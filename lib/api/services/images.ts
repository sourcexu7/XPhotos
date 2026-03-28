/**
 * 图片相关 API 服务
 */

import { apiClient } from '../client'
import type { ImageType } from '~/types'

export interface UpdateImageSortParams {
  orders: Array<{ id: string; sort: number }>
}

export interface UpdateImageAlbumParams {
  imageId: string
  albumId: string
}

export interface UpdateImageFeaturedParams {
  imageId: string
  featured: number
}

export interface UpdateImageShowParams {
  imageId: string
  show: number
}

export interface CameraLensListResponse {
  cameras: string[]
  lenses: string[]
}

/**
 * 更新图片排序
 */
export async function updateImageSort(params: UpdateImageSortParams) {
  return apiClient.put('/images/update-sort', params)
}

/**
 * 更新图片相册
 */
export async function updateImageAlbum(params: UpdateImageAlbumParams) {
  return apiClient.put('/images/update-Album', params)
}

/**
 * 更新图片推荐状态
 */
export async function updateImageFeatured(params: UpdateImageFeaturedParams) {
  return apiClient.put('/images/update-featured', params)
}

/**
 * 更新图片显示状态
 */
export async function updateImageShow(params: UpdateImageShowParams) {
  return apiClient.put('/images/update-show', params)
}

/**
 * 获取相机和镜头列表
 */
export async function getCameraLensList() {
  return apiClient.get<CameraLensListResponse>('/images/camera-lens-list')
}

/**
 * 检查图片重复
 */
export async function checkDuplicateImage(imageHash: string) {
  return apiClient.post('/images/check-duplicate', { imageHash })
}

/**
 * 添加图片
 */
export async function addImage(data: Partial<ImageType>) {
  return apiClient.post('/images/add', data)
}
