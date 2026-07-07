import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { getClient } from '~/lib/s3'
import { fetchImageByIdAndAuth } from '~/lib/db/query/images'
import type { Config } from '~/types'
import { generatePresignedUrl } from '~/lib/s3api'

const app = new Hono()

app.get('/:id', async (c) => {
  const id = c.req.param('id')
  const storage = c.req.query('storage')

  if (!storage) {
    throw new HTTPException(400, { message: 'Missing storage parameter' })
  }

  try {
    // 从数据库获取图片信息
    const imageData = await fetchImageByIdAndAuth(id)
    if (!imageData) {
      throw new HTTPException(404, { message: 'Image not found' })
    }

    const imageUrl = imageData.url
    const imageName = imageData.image_name
    if (!imageUrl) {
      throw new HTTPException(404, { message: 'Image URL not found' })
    }

    // 提取文件名
    const filename = imageName || decodeURIComponent(imageUrl.split('/').pop() || 'download.jpg')

    // 尝试直接下载原图链接（优先策略）
    // 如果原图URL是可直接访问的（如CDN、Alist等），直接返回
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      if (response.ok) {
        // URL可直接访问，直接返回图片流
        const streamResponse = await fetch(imageUrl)
        const blob = await streamResponse.blob()
        return new Response(blob, {
          headers: {
            'Content-Type': streamResponse.headers.get('Content-Type') || 'application/octet-stream',
            'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"; filename*=UTF-8''${encodeURIComponent(filename)}`
          }
        })
      }
    } catch {
      // HEAD请求失败，可能是私有存储，继续尝试预签名方式
    }

    // 处理 URL 格式，提取 key
    let key: string
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      const urlMatch = imageUrl.match(/^https?:\/\/[^\/]+(\/.*)$/)
      if (urlMatch) {
        key = urlMatch[1].slice(1)
      } else {
        key = imageUrl
      }
    } else {
      key = imageUrl
    }

    switch (storage) {
      case 's3': {
        const configs = await fetchConfigsByKeys([
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
        ])
        const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''

        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      case 'r2': {
        const configs = await fetchConfigsByKeys([
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_region',
          'r2_endpoint',
          'r2_bucket',
          'storage_folder',
        ])
        const bucket = configs.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''

        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        
        const r2Configs = {
          accesskeyId: configs.find((item: Config) => item.config_key === 'r2_accesskey_id')?.config_value || '',
          accesskeySecret: configs.find((item: Config) => item.config_key === 'r2_accesskey_secret')?.config_value || '',
          region: configs.find((item: Config) => item.config_key === 'r2_region')?.config_value || '',
          endpoint: configs.find((item: Config) => item.config_key === 'r2_endpoint')?.config_value || '',
          bucket: bucket,
          forcePathStyle: true,
        }
        const client = getClient(r2Configs as any)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      case 'cos': {
        const configs = await fetchConfigsByKeys([
          'cos_secret_id',
          'cos_secret_key',
          'cos_region',
          'cos_endpoint',
          'cos_bucket',
          'cos_storage_folder',
        ])
        const bucket = configs.find((item: Config) => item.config_key === 'cos_bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'cos_storage_folder')?.config_value || ''

        const filePath = key.startsWith(storageFolder) ? key : `${storageFolder}${key}`
        
        const cosConfigs = {
          accesskeyId: configs.find((item: Config) => item.config_key === 'cos_secret_id')?.config_value || '',
          accesskeySecret: configs.find((item: Config) => item.config_key === 'cos_secret_key')?.config_value || '',
          region: configs.find((item: Config) => item.config_key === 'cos_region')?.config_value || '',
          endpoint: configs.find((item: Config) => item.config_key === 'cos_endpoint')?.config_value || '',
          bucket: bucket,
          forcePathStyle: true,
        }
        const client = getClient(cosConfigs as any)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, '')

        return c.json({
          url: presignedUrl,
          filename: encodeURIComponent(filename)
        })
      }
      case 'alist':
      default: {
        // Alist 或其他未知存储类型，直接返回原图URL
        return c.json({
          url: imageUrl,
          filename: encodeURIComponent(filename)
        })
      }
    }
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to process download', cause: e })
  }
})

export default app