import type { ImageType, AlbumType } from '~/types'

export interface ImageFilters {
  cameras?: string[]
  lenses?: string[]
  tags?: string[]
  tagsOperator?: 'and' | 'or'
}

export interface HandleProps {
  handle?: (...args: any[]) => Promise<any>
  args: string
}

export interface ImageHandleProps {
  handle?: (
    pageNum: number,
    album: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator?: 'and' | 'or',
    sortByShootTime?: 'desc' | 'asc',
  ) => Promise<ImageType[]>
  totalHandle?: (
    album: string,
    cameras?: string[],
    lenses?: string[],
    tags?: string[],
    tagsOperator?: 'and' | 'or',
  ) => Promise<number>
  configHandle?: () => Promise<any[]>
  album: string
  args: string
  filters?: ImageFilters
  sortByShootTime?: 'desc' | 'asc'
}

export interface PreviewImageHandleProps {
  data: ImageType | null
  id: string
  args: string
  configHandle?: (...args: any[]) => Promise<any>
}

export interface ImageDataProps {
  data: ImageType
}

export interface ImageListDataProps {
  data: ImageType[]
}

export interface ImageServerHandleProps {
  handle: (...args: any[]) => Promise<any>
  args: string
  totalHandle?: (...args: any[]) => Promise<any>
}

export interface AlbumDataProps {
  data: AlbumType[]
}

export interface ProgressiveImageProps {
  imageUrl?: string
  previewUrl?: string
  blurhash?: string
  alt?: string
  width?: number
  height?: number
  showLightbox?: boolean
  onShowLightboxChange?: (show: boolean) => void
}

export interface AnalysisDataProps {
  data: {
    total?: number
    showTotal?: number
    tagsTotal?: number
    cameraStats?: { camera: string; count: number }[]
    lensData?: { lens: string; count: number }[]
    result?: { name: string; total: number; show_total: number }[]
    dateRangeData?: { date: string; count: number }[]
    heatmapData?: { hour: number; day: number; count: number }[]
    totalImages?: number
    totalAlbums?: number
    totalTags?: number
    [key: string]: any
  }
}
