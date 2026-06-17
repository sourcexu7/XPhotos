import 'server-only'
import { GetObjectCommand } from '@aws-sdk/client-s3'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import { getClient } from '~/lib/s3'
import type { Config, ImageType } from '~/types'
import { Readable } from 'stream'

function detectStorageByUrl(url: string): 's3' | 'alist' | 'local' {
  if (!url) return 's3' // Default
  const lower = url.toLowerCase()
  if (lower.includes('alist')) {
    // A simple check, might need refinement
    return 'alist'
  }
  if (lower.startsWith('/')) {
    return 'local'
  }
  return 's3'
}

function getKeyFromImage(image: { id: string; url: string; original_key?: string | null }): string | null {
  if (image.original_key) {
    return image.original_key.startsWith('/') ? image.original_key.slice(1) : image.original_key
  }
  try {
    const url = new URL(image.url)
    return decodeURIComponent(url.pathname.slice(1))
  } catch (e) {
    console.error(`Invalid URL for image ID ${image.id}: ${image.url}`)
    return null
  }
}

export async function streamImage(imageMeta: ImageType): Promise<{ stream: Readable; exif: null }> {
  if (!imageMeta.url) {
    throw new Error(`Image ${imageMeta.id} has no URL`)
  }
  const url = imageMeta.url
  const storageType = detectStorageByUrl(url)

  // For non-S3 storage, we buffer the whole file
  if (storageType !== 's3') {
    console.warn(`Buffering download for storage type: ${storageType}`)
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Failed to fetch image from ${url}`)
    const buffer = Buffer.from(await response.arrayBuffer())
    const stream = new Readable()
    stream.push(buffer)
    stream.push(null)
    // NOTE: EXIF reading is disabled for simplicity and stability in this version
    return { stream, exif: null }
  }

  // S3 true streaming logic
  const key = getKeyFromImage({ id: imageMeta.id, url, original_key: imageMeta.original_key })
  if (!key) {
    throw new Error(`Could not determine file key for image ID ${imageMeta.id}`)
  }

  const configs = await fetchConfigsByKeys([
    'accesskey_id',
    'accesskey_secret',
    'region',
    'endpoint',
    'bucket',
  ])

  const toConfigMap = (configs: Config[]) =>
    configs.reduce(
      (map, c) => {
        if (c.config_key) map[c.config_key] = c.config_value || ''
        return map
      },
      {} as Record<string, string>,
    )

  const configMap = toConfigMap(configs)

  const client = getClient(configs)
  const bucket = configMap['bucket']

  if (!client || !bucket) {
    throw new Error(`Storage client or bucket not configured for ${storageType}`)
  }

  const command = new GetObjectCommand({ Bucket: bucket, Key: key })
  const response = await client.send(command)

  if (!response.Body || !(response.Body instanceof Readable)) {
    throw new Error('S3 response body is not a readable stream.')
  }

  // Directly return the stream from S3
  // NOTE: EXIF reading is disabled for simplicity and stability in this version
  return { stream: response.Body, exif: null }
}
