import Compressor from 'compressorjs'

export interface CompressOptions {
  /** 压缩质量 0.01-1，对应后台 preview_quality */
  quality: number
  /** 最大宽度限制，0 表示不限制，对应后台 preview_max_width_limit */
  maxWidth: number
  /** 最大宽度开关是否开启，对应后台 preview_max_width_limit_switch */
  maxWidthEnabled: boolean
  /** 输出 MIME 类型，默认 image/webp */
  mimeType?: string
}

/**
 * 客户端压缩图片（使用 compressorjs，与项目 package.json 中的 1.2.1 版本一致）
 *
 * 核心逻辑：
 * - 当 maxWidthEnabled 为 true 且 maxWidth > 0 时，限制输出图片最大宽度
 * - 使用 WebP 格式输出（体积远小于 JPEG）
 * - checkOrientation: false 跳过 EXIF 方向检测，加快压缩速度
 *
 * @param file 原始文件
 * @param options 压缩参数
 * @returns 压缩后的 Blob
 */
export function compressImage(file: File | Blob, options: CompressOptions): Promise<Blob> {
  const {
    quality,
    maxWidth,
    maxWidthEnabled,
    mimeType = 'image/webp',
  } = options

  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality,
      checkOrientation: false,
      mimeType,
      maxWidth: maxWidthEnabled && maxWidth > 0 ? maxWidth : undefined,
      success(result: Blob) {
        resolve(result)
      },
      error(err: Error) {
        reject(err)
      },
    })
  })
}

/**
 * 从后台配置中提取压缩参数
 *
 * @param configs 后台配置数组 [{ config_key, config_value }]
 * @returns CompressOptions
 */
export function getCompressOptionsFromConfigs(
  configs?: { config_key: string; config_value: string }[]
): CompressOptions {
  const get = (key: string) => configs?.find(c => c.config_key === key)?.config_value

  return {
    quality: parseFloat(get('preview_quality') || '0.6'),
    maxWidth: parseInt(get('preview_max_width_limit') || '1600') || 0,
    maxWidthEnabled: get('preview_max_width_limit_switch') === '1',
    mimeType: 'image/webp',
  }
}
