/**
 * 标签相关 API 服务
 */

import { apiClient } from '../client'

export interface AddTagParams {
  name: string
  category?: string | null
  parentId?: string | null
}

export interface MoveTagParams {
  tagId: string
  targetParentId?: string
}

export interface PromoteTagParams {
  tagId: string
}

export interface CheckTagCompletenessParams {
  fix?: boolean
}

/**
 * 添加标签
 */
export async function addTag(params: AddTagParams) {
  return apiClient.post('/settings/tags/add', params)
}

/**
 * 移动标签
 */
export async function moveTag(params: MoveTagParams) {
  return apiClient.post('/settings/tags/move', params)
}

/**
 * 升级标签（二级标签升为一级）
 */
export async function promoteTag(params: PromoteTagParams) {
  return apiClient.post('/settings/tags/promote', params)
}

/**
 * 检查标签完整性
 */
export async function checkTagCompleteness(params: CheckTagCompletenessParams = {}) {
  return apiClient.post('/settings/tags/check-completeness', params)
}

/**
 * 获取标签列表
 */
export async function getTags() {
  return apiClient.get('/settings/tags/get')
}
