import Compressor from 'compressorjs'
import { toast } from 'sonner'
import { uploadFile } from './file'

export interface UploadResult {
  url: string
  previewUrl: string
  imageId: string
  fileName: string
  originalKey?: string
  previewKey?: string
}

export interface UploadPreviewImageOptions {
  storage: string
  alistMountPath: string
  previewCompressQuality: number
  previewImageMaxWidthLimitSwitchOn: boolean
  previewImageMaxWidthLimit: number
  existingImageId?: string
  onProgress?: (progress: number) => void
  onStageChange?: (stage: string) => void
}

/**
 * 校验 URL 是否可访问（走服务端代理，绕开浏览器 CORS 限制）
 * @param targetUrl 目标 URL
 * @returns 是否可访问
 */
export async function verifyUrlAccessible(targetUrl: string): Promise<boolean> {
  if (!targetUrl || typeof targetUrl !== 'string') return false
  if (!/^https?:\/\//i.test(targetUrl)) return true

  try {
    const res = await fetch('/api/v1/file/verify-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: targetUrl }),
    })
    if (!res.ok) return false
    const json = await res.json()
    return json?.data?.accessible === true
  } catch {
    return false
  }
}

/**
 * 带超时的 Fetch 请求
 * @param resource 请求资源
 * @param options 请求选项
 * @param timeout 超时时间（毫秒）
 * @returns Promise<Response>
 */
export function fetchWithTimeout(
  resource: RequestInfo,
  options: RequestInit = {},
  timeout = 15000
): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('请求超时')), timeout)

    fetch(resource, options)
      .then((res) => {
        clearTimeout(timer)
        resolve(res)
      })
      .catch((err) => {
        clearTimeout(timer)
        reject(err)
      })
  })
}

/**
 * 检查图片是否重复
 * @param blurhash 模糊哈希
 * @param url 图片 URL
 * @returns 是否重复
 */
export async function checkDuplicate(
  blurhash?: string,
  url?: string
): Promise<boolean> {
  try {
    const res = await fetchWithTimeout(
      '/api/v1/images/check-duplicate',
      {
        headers: { 'Content-Type': 'application/json' },
        method: 'post',
        body: JSON.stringify({ blurhash, url }),
      },
      10000
    ).then(r => r.json())

    return res?.code === 200 && res?.data?.duplicate
  } catch {
    return false
  }
}

/**
 * 上传预览图
 * @param file 原始文件
 * @param type 上传类型
 * @param options 上传选项
 * @returns 上传结果
 */
export async function uploadPreviewImage(
  file: File,
  type: string,
  options: UploadPreviewImageOptions
): Promise<{ url: string; key?: string }> {
  return new Promise((resolve, reject) => {
    new Compressor(file, {
      quality: options.previewCompressQuality,
      checkOrientation: false,
      mimeType: 'image/webp',
      maxWidth: options.previewImageMaxWidthLimitSwitchOn && options.previewImageMaxWidthLimit > 0
        ? options.previewImageMaxWidthLimit
        : undefined,
      async success(compressedFile) {
        try {
          options.onStageChange?.('压缩预览图中')
          const res = await uploadFile(
            compressedFile as File,
            type,
            options.storage,
            options.alistMountPath,
            {
              existingImageId: options.existingImageId,
              onProgress: options.onProgress,
              onStageChange: options.onStageChange,
            }
          )

          if (res?.code === 200) {
            resolve({
              url: res?.data?.url,
              key: res?.data?.key,
            })
          } else {
            reject(new Error('Upload failed'))
          }
        } catch (e) {
          reject(e instanceof Error ? e : new Error('Upload failed'))
        }
      },
      error(err) {
        reject(err instanceof Error ? err : new Error('Compression failed'))
      },
    })
  })
}

/**
 * 获取 AList 存储列表
 */
export async function getAlistStorage(): Promise<{ mount_path: string }[]> {
  try {
    toast.info('获取 AList 目录中...')
    const res = await fetch('/api/v1/storage/alist/storages', {
      method: 'GET',
    }).then(res => res.json())

    if (res?.code === 200) {
      return res.data?.content || []
    } else {
      toast.error('获取失败')
      return []
    }
  } catch {
    toast.error('获取失败')
    return []
  }
}
