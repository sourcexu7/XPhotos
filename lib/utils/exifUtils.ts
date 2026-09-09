import ExifReader from 'exifreader'
import { exifReader } from './file'
import type { ExifType } from '~/types'

/**
 * 从 EXIF 数据中提取 GPS 信息
 * @param tags EXIF 标签
 * @returns GPS 坐标
 */
export function extractGpsFromExif(tags: any): { lat: string; lon: string } {
  return {
    lat: tags?.GPSLatitude?.description || '',
    lon: tags?.GPSLongitude?.description || '',
  }
}

/**
 * 应用参考 EXIF 数据
 * @param refFile 参考文件
 * @param targetExif 目标 EXIF 数据
 * @returns 合并后的 EXIF 数据
 */
export async function applyReferenceExif(
  refFile: File,
  targetExif: Partial<ExifType>
): Promise<Partial<ExifType>> {
  const { exifObj } = await exifReader(refFile)
  return {
    ...targetExif,
    ...exifObj,
  }
}

/**
 * 获取图片尺寸（优先从 EXIF 读取）
 * @param file 图片文件
 * @returns 图片尺寸
 */
export async function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  try {
    const tags = await ExifReader.load(file)
    const exifWidth = Number(tags?.PixelXDimension?.value ?? tags?.ImageWidth?.value ?? 0)
    const exifHeight = Number(tags?.PixelYDimension?.value ?? tags?.ImageLength?.value ?? 0)

    if (exifWidth > 0 && exifHeight > 0) {
      return { width: exifWidth, height: exifHeight }
    }
  } catch {
    // Fallback to browser decoding
  }

  // Fallback 到浏览器解码
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
      img.onerror = () => resolve({ width: 0, height: 0 })
      if (typeof e.target?.result === 'string') img.src = e.target.result
      else resolve({ width: 0, height: 0 })
    }
    reader.onerror = () => resolve({ width: 0, height: 0 })
    reader.readAsDataURL(file)
  })
}
