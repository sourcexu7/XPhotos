import ExifReader from 'exifreader'
import type { ExifType } from '~/types'
import { createId } from '@paralleldrive/cuid2'

/**
 * 解析图片中的 exif 信息
 * @param file 文件（支持 File/ArrayBuffer），仅用于本地解析，不做上传
 */
export async function exifReader(file: ArrayBuffer | SharedArrayBuffer | Buffer | File) {
  const buffer = file instanceof File ? await file.arrayBuffer() : file
  const tags = await ExifReader.load(buffer)
  
  // 处理 EXIF 日期格式 (YYYY:MM:DD HH:mm:ss) 转换为标准格式 (YYYY-MM-DD HH:mm:ss)
  let dateTime = tags?.DateTimeOriginal?.description || tags?.DateTime?.description || ''
  if (dateTime && typeof dateTime === 'string') {
    // EXIF 日期格式通常是 "YYYY:MM:DD HH:mm:ss"，需要转换为 "YYYY-MM-DD HH:mm:ss"
    dateTime = dateTime.replace(/^(\d{4}):(\d{2}):(\d{2})/, '$1-$2-$3')
  }

  const exifObj: ExifType = {
    make: tags?.Make?.description || '',
    model: tags?.Model?.description || '',
    bits: tags?.['Bits Per Sample']?.description || '',
    data_time: dateTime, // 与数据库字段保持一致
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
  onStageChange?: (stage: string) => void
  existingImageId?: string
}

interface UploadResponse {
  code: number
  data: {
    url: string
    imageId: string
    fileName: string
    key?: string
  }
}

/**
 * 上传 object 到对应的存储
 * @param file 文件 object 流
 * @param type 上传类型 '' | '/preview'
 * @param storage storage 存储类型
 * @param mountPath 文件挂载路径（目前只有 alist 用得到）
 * @param options 上传选项，包括 existingImageId 用于复用已有的 imageId
 */
export async function uploadFile(
  file: File,
  type: string,
  storage: string,
  mountPath: string,
  options?: UploadOptions
): Promise<UploadResponse> {
  if (!file || !file.name) {
    throw new Error('Invalid file')
  }
  if (!storage) {
    throw new Error('Storage type is required')
  }
  const imageId = options?.existingImageId || createId()
  const ext = file.name.split('.').pop()
  const fileName = file.name
  const newFileName = `${imageId}.${ext}`
  const newFile = new File([file], newFileName, { type: file.type })

  if (storage === 'alist') {
    return await uploadViaAList(newFile, type, storage, mountPath, imageId, fileName, options)
  }

  return await uploadViaPresignedUrl(newFile, type, storage, options, imageId, fileName)
}

async function uploadViaAList(
  file: File,
  type: string,
  storage: string,
  mountPath: string,
  imageId: string,
  fileName: string,
  options?: UploadOptions
): Promise<UploadResponse> {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('storage', storage)
  formData.append('type', type)
  if (mountPath) {
    formData.append('mountPath', mountPath)
  }

  options?.onStageChange?.('上传中')

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    xhr.open('POST', '/api/v1/file/upload', true)
    xhr.withCredentials = true
    xhr.setRequestHeader('Accept', 'application/json')

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && options?.onProgress) {
        const percent = Math.round((event.loaded / event.total) * 100)
        try {
          options.onProgress(percent)
        } catch (e) {
        }
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText)
          if (json?.code === 200) {
            options?.onProgress?.(100)
            options?.onStageChange?.('完成')
            resolve({
              code: 200,
              data: { url: json.data, imageId, fileName },
            })
          } else {
            reject(new Error(json?.message || 'Upload failed'))
          }
        } catch (e) {
          reject(new Error('Failed to parse response'))
        }
      } else {
        reject(new Error(`Upload failed with status: ${xhr.status}`))
      }
    }

    xhr.onerror = () => {
      reject(new Error('Upload failed'))
    }

    xhr.send(formData)
  })
}

async function uploadViaPresignedUrl(
  file: File,
  type: string,
  storage: string,
  options: UploadOptions | undefined,
  imageId: string,
  fileName: string
): Promise<UploadResponse> {
  options?.onStageChange?.('获取上传地址')
  
  const presignedResponse = await fetch('/api/v1/file/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      type,
      storage,
    }),
  })
  const isJson1 = presignedResponse.headers.get('content-type')?.includes('application/json')
  const presignedJson = isJson1 ? await presignedResponse.json().catch(async () => ({ code: presignedResponse.status })) : null
  if (!presignedJson) {
    const text = await presignedResponse.text().catch(() => '')
    throw new Error(text || `Failed to get presigned URL (status: ${presignedResponse.status})`)
  }

  if (presignedJson?.code === 286) {
    options?.onStageChange?.('服务器上传中')
    const formData = new FormData()
    formData.append('file', file)
    formData.append('storage', storage)
    formData.append('type', type)
    const resp = await fetch('/api/v1/file/upload', { method: 'POST', body: formData, credentials: 'include', headers: { Accept: 'application/json' } })
    const isJson = resp.headers.get('content-type')?.includes('application/json')
    const json = isJson ? await resp.json().catch(async () => ({ code: resp.status })) : null
    if (!json || json.code !== 200) {
      const text = await resp.text().catch(() => '')
      throw new Error(text || 'Server fallback upload failed')
    }
    options?.onProgress?.(100)
    return {
      code: 200,
      data: { url: json.data?.url, imageId, fileName, key: json.data?.key },
    }
  }

  if (presignedJson?.code !== 200) {
    const msg = presignedJson?.message || `Failed to get presigned URL (code: ${presignedJson?.code})`
    throw new Error(msg)
  }

  const { presignedUrl, key } = presignedJson.data

  options?.onStageChange?.('上传中')
  
  try {
    await uploadWithProgress(presignedUrl, file, options)
  } catch (e) {
    options?.onStageChange?.('重试上传中')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('storage', storage)
      formData.append('type', type)
      const resp = await fetch('/api/v1/file/upload', { method: 'POST', body: formData, credentials: 'include', headers: { Accept: 'application/json' } })
      const isJson = resp.headers.get('content-type')?.includes('application/json')
      const json = isJson ? await resp.json().catch(async () => ({ code: resp.status })) : null
      if (!json || json.code !== 200) {
        const text = await resp.text().catch(() => '')
        throw new Error(text || 'Server fallback upload failed')
      }
      options?.onProgress?.(100)
      return {
        code: 200,
        data: { url: json.data?.url, imageId, fileName, key: json.data?.key },
      }
    } catch (fallbackErr) {
      throw e instanceof Error ? e : new Error('Upload failed')
    }
  }

  options?.onStageChange?.('获取访问地址')
  
  const getObjectResponse = await fetch('/api/v1/file/getObjectUrl', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, storage }),
  })
  const isJson2 = getObjectResponse.headers.get('content-type')?.includes('application/json')
  const objectJson = isJson2 ? await getObjectResponse.json().catch(async () => ({ code: getObjectResponse.status })) : null
  if (!objectJson) {
    const text = await getObjectResponse.text().catch(() => '')
    throw new Error(text || `Failed to get object URL (status: ${getObjectResponse.status})`)
  }

  if (objectJson?.code !== 200) {
    const msg = objectJson?.message || `Failed to get object URL (code: ${objectJson?.code})`
    throw new Error(msg)
  }

  options?.onProgress?.(100)
  options?.onStageChange?.('完成')

  return {
    code: 200,
    data: { url: objectJson.data, imageId, fileName, key },
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
        const msg = xhr.responseText || xhr.statusText || `Upload failed with status: ${xhr.status}`
        reject(new Error(msg))
      }
    }

    xhr.onerror = () => {
      const status = xhr.status
      const statusText = xhr.statusText
      const responseText = xhr.responseText
      const msg = [
        'Upload failed',
        status ? `status: ${status}` : '',
        statusText ? `statusText: ${statusText}` : '',
        responseText ? `response: ${responseText}` : '',
      ].filter(Boolean).join(' | ')
      reject(new Error(msg))
    }
    xhr.send(file)
  })
}
