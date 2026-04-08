import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import dayjs from 'dayjs'

import {
  deleteBatchImage,
  deleteImage,
  insertImage,
  updateImage,
  updateImageShow,
  updateImageFeatured,
  updateImageAlbum,
  updateImagesSort,
  updateImagesAlbumSort,
  batchUpdateImagesAlbumSort,
  fetchAllImagesByAlbum,
  fetchImageCountByAlbum,
  resetAlbumImagesSort,
} from '~/lib/db/operate/images'

import { db } from '~/lib/db'
import type { ImageType } from '~/types'
import { HeadObjectCommand } from '@aws-sdk/client-s3'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { Config } from '~/types'
import { getClient } from '~/lib/s3'
import { getCOSClient } from '~/lib/cos'

const app = new Hono()

function toConfigMap(configs: Config[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of configs) {
    if (c.config_key) map[c.config_key] = c.config_value || ''
  }
  return map
}

function safeParseUrl(input?: string | null): URL | null {
  if (!input) return null
  try {
    return new URL(input)
  } catch {
    return null
  }
}

function getKeyFromUrl(input?: string | null): string | null {
  const u = safeParseUrl(input)
  if (!u) return null
  // pathname includes leading '/'
  const path = u.pathname.startsWith('/') ? u.pathname.slice(1) : u.pathname
  return decodeURIComponent(path)
}

async function headWithRetry(
  client: any,
  params: { Bucket: string; Key: string },
  opts?: { retries?: number; baseDelayMs?: number },
): Promise<void> {
  const retries = opts?.retries ?? 5
  const baseDelayMs = opts?.baseDelayMs ?? 150

  for (let i = 0; i < retries; i++) {
    try {
      await client.send(new HeadObjectCommand(params))
      return
    } catch (e: any) {
      const status = e?.$metadata?.httpStatusCode
      const name = e?.name || e?.Code
      // 404: object not found (or not ready yet)
      if (status === 404 || name === 'NotFound' || name === 'NoSuchKey') {
        const delay = baseDelayMs * Math.pow(2, i)
        await new Promise((r) => setTimeout(r, delay))
        continue
      }
      throw e
    }
  }

  throw new HTTPException(400, { message: `Object not found: ${params.Key}` })
}

async function verifyImageObjectsExist(image: any) {
  const urls: { field: string; url?: string }[] = [
    { field: 'url', url: image?.url },
    { field: 'preview_url', url: image?.preview_url },
    { field: 'video_url', url: image?.video_url },
  ].filter((x) => !!x.url)

  if (urls.length === 0) return

  const hasCos = urls.some((x) => (x.url || '').includes('cos'))
  const hasS3 = !hasCos // fallback

  // heuristic routing based on config endpoints
  const s3Configs = await fetchConfigsByKeys(['endpoint', 'bucket', 'accesskey_id', 'accesskey_secret', 'region', 'force_path_style'])
  const cosConfigs = await fetchConfigsByKeys(['cos_endpoint', 'cos_bucket', 'cos_secret_id', 'cos_secret_key', 'cos_region', 'cos_force_path_style'])

  const s3Cfg = toConfigMap(s3Configs)
  const cosCfg = toConfigMap(cosConfigs)

  const s3Endpoint = s3Cfg['endpoint'] || ''
  const cosEndpoint = cosCfg['cos_endpoint'] || ''

  for (const item of urls) {
    const key = getKeyFromUrl(item.url)
    if (!key) {
      throw new HTTPException(400, { message: `Invalid ${item.field} url` })
    }

    const urlStr = item.url || ''

    // decide storage by matching endpoint
    const useCos = cosEndpoint && urlStr.includes(cosEndpoint.replace(/^https?:\/\//, ''))
    const useS3 = !useCos && (s3Endpoint ? urlStr.includes(s3Endpoint.replace(/^https?:\/\//, '')) : true)

    if (useCos) {
      const bucket = cosCfg['cos_bucket']
      if (!bucket) throw new HTTPException(400, { message: 'COS bucket not configured' })
      const client = getCOSClient(cosConfigs)
      await headWithRetry(client, { Bucket: bucket, Key: key })
      continue
    }

    if (useS3) {
      const bucket = s3Cfg['bucket']
      if (!bucket) throw new HTTPException(400, { message: 'S3 bucket not configured' })
      const client = getClient(s3Configs)
      await headWithRetry(client, { Bucket: bucket, Key: key })
      continue
    }

    // if neither matched, still try S3 as default
    const bucket = s3Cfg['bucket']
    if (!bucket) throw new HTTPException(400, { message: 'S3 bucket not configured' })
    const client = getClient(s3Configs)
    await headWithRetry(client, { Bucket: bucket, Key: key })
  }
}

function validateImageData(data: Partial<ImageType>) {
  if (!data.url) {
    throw new HTTPException(400, { message: 'Image link cannot be empty' })
  }
  if (!data.height || data.height <= 0) {
    throw new HTTPException(400, { message: 'Image height must be greater than 0' })
  }
  if (!data.width || data.width <= 0) {
    throw new HTTPException(400, { message: 'Image width must be greater than 0' })
  }
}

app.post('/add', async (c) => {
  const body = await c.req.json<ImageType & { client_image_id?: string }>()
  if (!body) {
    throw new HTTPException(400, { message: 'Missing body' })
  }

  const image: ImageType = {
    ...body,
    id: body.client_image_id || (body as any).id,
    image_name: (body as any).image_name,
  } as any

  validateImageData(image)

  if (!image.album) throw new HTTPException(400, { message: 'album is required' })
  if (!image.id) throw new HTTPException(400, { message: 'client_image_id is required' })
  if (!image.image_name) throw new HTTPException(400, { message: 'image_name is required' })

  try {
    if ((image as any)?.exif?.data_time && !dayjs((image as any).exif.data_time).isValid()) {
      ;(image as any).exif.data_time = ''
    }

    // 入库前强校验：确保存储对象真实存在，避免“返回链接但桶里缺文件”
    await verifyImageObjectsExist(image as any)

    const res = await insertImage(image)
    return c.json({ code: 200, data: res })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to add image', cause: e })
  }
})

app.post('/check-duplicate', async (c) => {
  try {
    const { blurhash, url } = await c.req.json<{ blurhash?: string; url?: string }>()

    if (!blurhash && !url) {
      return c.json({ code: 200, data: { duplicate: false } })
    }

    const where = blurhash ? { blurhash } : { url: String(url) }

    const existing = await db.images.findFirst({
      where: {
        ...where,
        del: 0,
      },
      select: { id: true },
    })

    return c.json({
      code: 200,
      data: {
        duplicate: !!existing,
        id: existing?.id,
      },
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/batch-delete', async (c) => {
  try {
    const body = await c.req.json<unknown>()

    const ids = Array.isArray(body)
      ? body
      : body && typeof body === 'object' && Array.isArray((body as any).ids)
          ? (body as any).ids
          : null

    if (!ids || ids.length === 0) {
      throw new HTTPException(400, { message: 'ids is required' })
    }

    const strIds = (ids as unknown[]).map((id: unknown) => String(id)).filter(Boolean)
    if (strIds.length === 0) {
      throw new HTTPException(400, { message: 'ids is required' })
    }

    await deleteBatchImage(strIds)

    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to delete images', cause: e })
  }
})

app.delete('/delete/:id', async (c) => {
  try {
    const { id } = c.req.param()
    await deleteImage(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to delete image', cause: e })
  }
})

app.put('/update', async (c) => {
  const image = await c.req.json<ImageType>()
  validateImageData(image)

  try {
    await updateImage(image)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image', cause: e })
  }
})

app.put('/update-show', async (c) => {
  try {
    const image = await c.req.json<{ id: string; show: number }>()
    const data = await updateImageShow(image.id, image.show)
    return c.json(data)
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image show status', cause: e })
  }
})

app.put('/update-featured', async (c) => {
  try {
    const image = await c.req.json<{ id?: string; imageId?: string; featured: number }>()
    const data = await updateImageFeatured(image.imageId || (image.id as string), image.featured)
    return c.json({ code: 200, data })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image featured status', cause: e })
  }
})

app.put('/update-Album', async (c) => {
  try {
    const image = await c.req.json<{ imageId: string; albumId: string }>()
    await updateImageAlbum(image.imageId, image.albumId)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to update image album', cause: e })
  }
})

app.put('/update-sort', async (c) => {
  try {
    const body = await c.req.json<{ orders?: unknown }>()
    const orders: unknown = body?.orders

    if (
      !Array.isArray(orders) ||
      !orders.every(
        (o) =>
          o &&
          typeof o === 'object' &&
          typeof (o as any).id === 'string' &&
          typeof (o as any).sort === 'number',
      )
    ) {
      throw new HTTPException(400, { message: 'Invalid payload for update-sort' })
    }

    await updateImagesSort(orders as { id: string; sort: number }[])
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to update image sort', cause: e })
  }
})

app.put('/album-sort', async (c) => {
  try {
    const body = await c.req.json<{ albumValue?: string; orders?: unknown }>()
    const { albumValue, orders } = body

    if (!albumValue || typeof albumValue !== 'string') {
      throw new HTTPException(400, { message: 'albumValue is required' })
    }

    if (
      !Array.isArray(orders) ||
      !orders.every(
        (o) =>
          o &&
          typeof o === 'object' &&
          typeof (o as any).imageId === 'string' &&
          typeof (o as any).sort === 'number',
      )
    ) {
      throw new HTTPException(400, { message: 'Invalid payload for album-sort' })
    }

    await updateImagesAlbumSort(albumValue, orders as { imageId: string; sort: number }[])
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to update album image sort', cause: e })
  }
})

app.put('/batch-album-sort', async (c) => {
  try {
    const body = await c.req.json<{
      albumValue?: string
      operation?: 'moveToTop' | 'moveToBottom' | 'moveToPosition'
      imageIds?: string[]
      targetPosition?: number
    }>()

    const { albumValue, operation, imageIds, targetPosition } = body

    if (!albumValue || typeof albumValue !== 'string') {
      throw new HTTPException(400, { message: 'albumValue is required' })
    }

    if (!operation || !['moveToTop', 'moveToBottom', 'moveToPosition'].includes(operation)) {
      throw new HTTPException(400, { message: 'Invalid operation' })
    }

    if (!Array.isArray(imageIds) || imageIds.length === 0) {
      throw new HTTPException(400, { message: 'imageIds is required and must be a non-empty array' })
    }

    await batchUpdateImagesAlbumSort(albumValue, operation, imageIds, targetPosition)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to batch update album image sort', cause: e })
  }
})

app.get('/album-images/:albumValue', async (c) => {
  try {
    const { albumValue } = c.req.param()

    if (!albumValue) {
      throw new HTTPException(400, { message: 'albumValue is required' })
    }

    const images = await fetchAllImagesByAlbum(albumValue)
    return c.json({ code: 200, data: images })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to fetch album images', cause: e })
  }
})

app.get('/album-image-count/:albumValue', async (c) => {
  try {
    const { albumValue } = c.req.param()

    if (!albumValue) {
      throw new HTTPException(400, { message: 'albumValue is required' })
    }

    const count = await fetchImageCountByAlbum(albumValue)
    return c.json({ code: 200, data: { count } })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to fetch album image count', cause: e })
  }
})

app.post('/reset-album-sort/:albumValue', async (c) => {
  try {
    const { albumValue } = c.req.param()

    if (!albumValue) {
      throw new HTTPException(400, { message: 'albumValue is required' })
    }

    await resetAlbumImagesSort(albumValue)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    if (e instanceof HTTPException) throw e
    throw new HTTPException(500, { message: 'Failed to reset album image sort', cause: e })
  }
})

export default app
