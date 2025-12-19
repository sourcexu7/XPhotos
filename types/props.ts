// 业务专用类型

import type { AlbumType, ImageType } from '~/types/index'

export interface AlbumDataProps {
  data: AlbumType[]
}

export interface HandleProps {
  handle: () => unknown
  args: string
}

export interface ImageServerHandleProps {
  handle: (
    pageNum: number,
    tag: string,
    showStatus?: number,
    featured?: number,
    camera?: string,
    lens?: string,
    exposure?: string,
    f_number?: string,
    iso?: string,
    labels?: string[],
    labelsOperator?: 'and' | 'or'
  ) => unknown
  args: string
  totalHandle: (
    tag: string,
    showStatus?: number,
    featured?: number,
    camera?: string,
    lens?: string,
    exposure?: string,
    f_number?: string,
    iso?: string,
    labels?: string[],
    labelsOperator?: 'and' | 'or'
  ) => unknown
}

export interface ImageFilters {
  // 新增：前台作品画廊筛选条件（多选）
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
}

export interface ImageHandleProps {
  handle: (
    pageNum: number,
    tag: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator?: 'and' | 'or',
    sortByShootTime?: 'desc' | 'asc'
  ) => unknown
  args: string
  album: string
  totalHandle: (
    tag: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator?: 'and' | 'or',
    sortByShootTime?: 'desc' | 'asc'
  ) => unknown
  configHandle: () => unknown
  // 新增：筛选条件（传递给后端进行数据库查询）
  filters?: ImageFilters & { tagsOperator?: 'and' | 'or' }
  // 新增：排序方式（按拍摄时间）
  sortByShootTime?: 'desc' | 'asc'
}

export interface PreviewImageHandleProps {
  data: ImageType
  args: string
  id: string
  configHandle: () => unknown
}

export interface ProgressiveImageProps {
  imageUrl: string
  previewUrl: string
  width?: number
  height?: number
  blurhash: string
  alt?: string
  showLightbox?: boolean
  onShowLightboxChange?: (value: boolean) => void
}

export interface LinkProps {
  handle: () => unknown
  args: string
  data: unknown
}

export interface AlbumListProps {
  data: AlbumType[]
}

export interface ImageDataProps {
  data: ImageType
}

export interface ImageListDataProps {
  data: ImageType[]
}

export interface CameraStats {
  camera: string
  lens: string
  count: number
}

export interface AlbumStats {
  name: string
  value: string
  total: number
  show_total: number
}

export interface AnalysisDataProps {
  data: {
    total: number
    showTotal: number
    tagsTotal: number
    cameraStats: CameraStats[]
    result: AlbumStats[]
  }
}