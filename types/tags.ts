/**
 * 标签管理相关类型定义
 * 支持一级/二级标签层级关联与图片标签自动同步
 */

/**
 * 一级标签（父标签）
 */
export interface PrimaryTag {
  id: string
  name: string
  category: string | null
  parentId: string | null
  detail?: string | null
  createdAt?: Date
  updatedAt?: Date | null
}

/**
 * 二级标签（子标签）
 */
export interface SecondaryTag {
  id: string
  name: string
  category: string | null
  parentId: string
  parent?: PrimaryTag
  detail?: string | null
  createdAt?: Date
  updatedAt?: Date | null
}

/**
 * 标签树节点（用于前端展示）
 */
export interface TagTreeNode {
  id: string | null
  category: string | null
  children: Array<{ id: string; name: string }>
}

/**
 * 标签移动操作类型
 */
export type TagMoveOperation = 
  | { type: 'promote'; tagId: string } // 二级标签升级为一级标签
  | { type: 'move'; tagId: string; targetParentId: string } // 二级标签移动到其他一级标签下

/**
 * 标签移动验证结果
 */
export interface TagMoveValidationResult {
  valid: boolean
  error?: string
}

/**
 * 图片标签关联调整结果
 */
export interface ImageTagSyncResult {
  imageId: string
  addedTags: string[]
  removedTags: string[]
  keptTags: string[]
}

/**
 * 批量图片标签调整结果
 */
export interface BatchImageTagSyncResult {
  totalImages: number
  successCount: number
  failedCount: number
  results: ImageTagSyncResult[]
  errors: Array<{ imageId: string; error: string }>
}

/**
 * 历史图片标签补全检查结果
 */
export interface TagCompletenessCheckResult {
  totalImages: number
  fixedImages: number
  invalidRelations: number
  details: Array<{
    imageId: string
    action: 'added' | 'removed' | 'no_change'
    tags: {
      added: string[]
      removed: string[]
    }
  }>
  errors: Array<{ imageId: string; error: string }>
}

