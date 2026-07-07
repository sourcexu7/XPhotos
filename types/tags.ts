export interface ImageTagSyncResult {
  imageId: string
  addedTags: string[]
  removedTags: string[]
  keptTags: string[]
}

export interface BatchImageTagSyncResult {
  totalImages: number
  successCount: number
  failedCount: number
  results: ImageTagSyncResult[]
  errors: Array<{ imageId: string; error: string }>
}

export interface TagCompletenessCheckResult {
  totalImages: number
  fixedImages: number
  invalidRelations: number
  details: Array<{
    imageId: string
    action: 'added' | 'no_change'
    tags: {
      added: string[]
      removed: string[]
    }
  }>
  errors: Array<{ imageId: string; error: string }>
}

export interface TagMoveValidationResult {
  valid: boolean
  error?: string
  reason?: string
  targetTag?: {
    id: string
    name: string
    parentId?: string | null
  }
}
