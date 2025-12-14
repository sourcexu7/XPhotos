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
    camera?: string,
    lens?: string,
    exposure?: string,
    f_number?: string,
    iso?: string,
    labels?: string[],
    labelsOperator?: 'and' | 'or'
  ) => unknown
}

export interface ImageHandleProps {
  handle: (pageNum: number, tag: string) => unknown
  args: string
  album: string
  totalHandle: (tag: string) => unknown
  configHandle: () => unknown
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