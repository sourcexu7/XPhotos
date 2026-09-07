/** 根据图片 URL 特征推断存储类型 */
export function detectStorageType(url: string): string {
  if (url.includes('r2')) return 'r2'
  if (url.includes('cos')) return 'cos'
  if (url.includes('alist')) return 'alist'
  return 's3'
}

/**
 * 通过下载接口获取图片 Blob 与文件名
 * 优先读取服务端 JSON 返回的 filename，其次响应头 Content-Disposition
 * 预览页与单列主题共用，保证下载文件名逻辑一致
 */
export async function downloadImageFile(
  id: string,
  imageUrl: string,
): Promise<{ blob: Blob; filename: string }> {
  let response = await fetch(`/api/public/download/${id}?storage=${detectStorageType(imageUrl)}`)
  const contentType = response.headers.get('content-type')
  let filename = 'download.jpg'

  if (contentType?.includes('application/json')) {
    const data = await response.json()
    filename = decodeURIComponent(data.filename || filename)
    response = await fetch(data.url)
  } else {
    const cd = response.headers.get('content-disposition')
    if (cd) {
      const m = cd.match(/filename="([^"]+)"/)
      if (m) filename = decodeURIComponent(m[1])
    }
  }

  const blob = await response.blob()
  return { blob, filename }
}

/** 触发浏览器保存 Blob 文件 */
export function saveBlobToDevice(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  window.setTimeout(() => window.URL.revokeObjectURL(url), 0)
}
