import type { ComponentType, CSSProperties } from 'react'
import dayjs from 'dayjs'
import type { ImageType } from '~/types'
import { CameraIcon } from '~/components/icons/camera'
import { TelescopeIcon } from '~/components/icons/telescope'
import { ClockIcon } from '~/components/icons/clock'
import { ApertureIcon } from '~/components/icons/aperture'
import { TimerIcon } from '~/components/icons/timer'
import { CrosshairIcon } from '~/components/icons/crosshair'
import { GaugeIcon } from '~/components/icons/gauge'
import { ExpandIcon } from '~/components/icons/expand'
import { CompassIcon } from '~/components/icons/compass'

export type ExifField =
  | 'camera'
  | 'lens'
  | 'date'
  | 'aperture'
  | 'shutter'
  | 'focalLength'
  | 'iso'
  | 'resolution'
  | 'location'

export type ExifRow = { field: ExifField; value: string }

export type ExifIconComponent = ComponentType<{
  size?: number
  className?: string
  style?: CSSProperties
}>

/** 各 EXIF 字段对应的图标（预览页与单列主题共用） */
export const EXIF_FIELD_ICONS: Record<ExifField, ExifIconComponent> = {
  camera: CameraIcon,
  lens: TelescopeIcon,
  date: ClockIcon,
  aperture: ApertureIcon,
  shutter: TimerIcon,
  focalLength: CrosshairIcon,
  iso: GaugeIcon,
  resolution: ExpandIcon,
  location: CompassIcon,
}

/**
 * EXIF 拍摄时间统一格式化为 YYYY-MM-DD
 * 兼容 "YYYY:MM:DD HH:mm:ss"（EXIF 标准）与常规 "YYYY-MM-DD" 格式
 */
export function formatShootDate(raw: string): string {
  const normalized = raw.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
  const parsed = dayjs(normalized)
  return parsed.isValid() ? parsed.format('YYYY-MM-DD') : raw
}

/**
 * 从图片数据构建统一的 EXIF 展示行（补全单位、统一格式）
 * 预览页与单列主题共用，保证两处字段集与展示格式一致
 */
export function buildExifRows(
  exif: ImageType['exif'],
  img: Pick<ImageType, 'width' | 'height' | 'lat' | 'lon'>,
): ExifRow[] {
  const rows: ExifRow[] = []

  const cam = exif?.make ? `${exif.make} ${exif.model ?? ''}`.trim() : (exif?.model ?? '')
  if (cam) rows.push({ field: 'camera', value: cam })
  if (exif?.lens_model) rows.push({ field: 'lens', value: String(exif.lens_model) })
  if (exif?.data_time) rows.push({ field: 'date', value: formatShootDate(String(exif.data_time)) })
  if (exif?.f_number != null && exif.f_number !== '') {
    const raw = String(exif.f_number)
    rows.push({ field: 'aperture', value: raw.startsWith('f/') ? raw : `f/${raw}` })
  }
  if (exif?.exposure_time) rows.push({ field: 'shutter', value: String(exif.exposure_time) })
  if (exif?.focal_length != null && exif.focal_length !== '') {
    const raw = String(exif.focal_length)
    rows.push({ field: 'focalLength', value: /mm$/i.test(raw) ? raw : `${raw}mm` })
  }
  if (exif?.iso_speed_rating) rows.push({ field: 'iso', value: String(exif.iso_speed_rating) })
  if (img.width && img.height) {
    rows.push({ field: 'resolution', value: `${img.width} × ${img.height}` })
  }
  if (img.lat != null && img.lon != null) {
    rows.push({ field: 'location', value: `${img.lat}, ${img.lon}` })
  }

  return rows
}
