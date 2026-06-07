// Core type definitions for the XPhotos application
// NOTE: Types use optional fields to be compatible with various database/API patterns.

export interface ImageType {
  id: string
  image_name?: string
  url?: string
  preview_url?: string
  video_url?: string
  blurhash?: string
  width?: number
  height?: number
  title?: string
  detail?: string
  type?: number
  show?: number
  show_on_mainpage?: number
  featured?: number
  sort?: number
  created_at?: Date | string
  updated_at?: Date | string
  labels?: any
  exif?: any
  album_value?: string
  album_name?: string
  album_license?: string
  album_image_sorting?: number
  album_sort?: number
  album_random_show?: number
  album?: string
  count?: number
  del?: number
  lon?: number
  lat?: number
  original_key?: string
  preview_key?: string
  video_key?: string
}

export interface Config {
  id: string
  config_key: string
  config_value: string | null
  detail: string | null
  updated_at?: Date | string | null
  created_at?: Date | string | null
}

export interface AlbumType {
  id?: string
  name: string
  album_value: string
  cover?: string | null
  show?: number
  sort?: number
  random_show?: number
  theme?: number | string
  image_sorting?: number
  license?: string | null
  del?: number
  detail?: string | null
  created_at?: Date | string | null
  updated_at?: Date | string | null
  count?: number
  total?: number
  show_total?: number
}

export interface TagType {
  id: string
  name: string
  category?: string | null
  parentId?: string | null
  created_at?: Date | string | null
  updated_at?: Date | string | null
}

export interface ExifType {
  make?: string | null
  model?: string | null
  lens_model?: string | null
  exposure_time?: string | null
  f_number?: string | number | null
  iso_speed_rating?: string | number | null
  focal_length?: string | number | null
  datetime_original?: string | null
  data_time?: string | null
  bits?: number | null
  exposure_program?: string | null
  lens_specification?: string | null
  exposure_mode?: string | null
  cfa_pattern?: string | null
  color_space?: string | null
  white_balance?: string | null
  gps_latitude?: number | null
  gps_longitude?: number | null
  [key: string]: any
}
