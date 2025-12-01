import ExifReader from 'exifreader'
import type { ExifType } from '~/types'
import { createId } from '@paralleldrive/cuid2'

/**
 * 解析图片中的 exif 信息
 * @param file 文件
 */
export async function exifReader(file: ArrayBuffer | SharedArrayBuffer | Buffer) {
  const tags = await ExifReader.load(file)
  
  const exifObj: ExifType = {
    make: tags?.Make?.description || '',
    model: tags?.Model?.description || '',
    bits: tags?.['Bits Per Sample']?.description || '',
    data_time:
      tags?.DateTimeOriginal?.description || tags?.DateTime?.description || '',
    exposure_time: tags?.ExposureTime?.description || '',
    f_number: tags?.FNumber?.description || '',
    exposure_program: tags?.ExposureProgram?.description || '',
    iso_speed_rating: tags?.ISOSpeedRatings?.description || '',
    focal_length: tags?.FocalLength?.description || '',
    lens_specification: tags?.LensSpecification?.description || '',
    lens_model: tags?.LensModel?.description || '',
    exposure_mode: tags?.ExposureMode?.description || '',
    // @ts-expect-error CFAPattern is not included in the ExifReader types
    cfa_pattern: tags?.CFAPattern?.description || '',
    color_space: tags?.ColorSpace?.description || '',
    white_balance: tags?.WhiteBalance?.description || '',
  }

  return { tags, exifObj }
}

interface UploadOptions {
  onProgress?: (p: number) => void
}

interface UploadResponse {
  code: number
  data: {
    url: string
    imageId: string
    fileName: string
  }
}

/**
 * 上传 object 到对应的存储
 * @param file 文件 object 流
 * @param type 上传类型 '' | '/preview'
 * @param storage storage 存储类型
 * @param mountPath 文件挂载路径（目前只有 alist 用得到）
 */
export async function uploadFile(
  file: File,
  type: string,
  storage: string,
  mountPath: string,
  options?: UploadOptions
): Promise<UploadResponse> {
  const imageId = createId()
  const ext = file.name.split('.').pop()
  const fileName = file.name
  const newFileName = `${imageId}.${ext}`
  const newFile = new File([file], newFileName, { type: file.type })

  // AList 使用传统上传方式
  if (storage === 'alist') {
    return await uploadViaAList(newFile, type, storage, mountPath, imageId, fileName)
  }

  // 预签名 URL 上传方式
  return await uploadViaPresignedUrl(newFile, type, storage, options, imageId, fileName)
}

async function uploadViaAList(
  file: File,
  type: string,
  storage: string,
  mountPath: string,
  imageId: string,
  fileName: string
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('storage', storage)
  formData.append('type', type)
  if (mountPath) {
    formData.append('mountPath', mountPath)
  }

  const res = await fetch('/api/v1/file/upload', {
    method: 'POST',
    body: formData,
    credentials: 'include',
    headers: { Accept: 'application/json' },
  }).then((res) => res.json())

  if (res?.code === 200) {
    return {
      code: 200,
      data: { url: res.data, imageId, fileName },
    }
  }
  throw new Error('Upload failed')
}

async function uploadViaPresignedUrl(
  file: File,
  type: string,
  storage: string,
  options: UploadOptions | undefined,
  imageId: string,
  fileName: string
): Promise<UploadResponse> {
  // 获取预签名 URL
  const presignedResponse = await fetch('/api/v1/file/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      type,
      storage,
    }),
  }).then((res) => res.json())

  if (presignedResponse?.code !== 200) {
    throw new Error('Failed to get presigned URL')
  }

  const { presignedUrl, key } = presignedResponse.data

  // 使用 XHR 上传并跟踪进度
  await uploadWithProgress(presignedUrl, file, options)

  // 获取对象 URL
  const getObjectResponse = await fetch('/api/v1/file/getObjectUrl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, storage }),
  }).then((res) => res.json())

  if (getObjectResponse?.code !== 200) {
    throw new Error('Failed to get object URL')
  }

  options?.onProgress?.(100)

  return {
    code: 200,
    data: { url: getObjectResponse.data, imageId, fileName },
  }
}

function uploadWithProgress(
  url: string,
  file: File,
  options?: UploadOptions
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('PUT', url, true)
    xhr.withCredentials = false
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        try {
          options.onProgress(percent)
        } catch (e) {
          // Ignore progress callback errors
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve()
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload failed'))
    xhr.send(file)
  })
}
