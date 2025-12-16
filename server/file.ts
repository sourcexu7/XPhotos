import 'server-only'

import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { alistUpload } from '~/lib/file-upload'
import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { Config } from '~/types'
import { getR2Client } from '~/lib/r2'
import { generatePresignedUrl } from '~/lib/s3api'
import { getClient } from '~/lib/s3'
import { db } from '~/lib/db'
import { PutObjectCommand } from '@aws-sdk/client-s3'
import { createId } from '@paralleldrive/cuid2'

const app = new Hono()

// ========================= 通用工具函数 =========================
// 优化点: 将 Config[] 转为简单的 key->value 映射，避免多次 configs.find(...)
function toConfigMap(configs: Config[]): Record<string, string> {
  const map: Record<string, string> = {}
  for (const c of configs) {
    if (c.config_key) {
      map[c.config_key] = c.config_value || ''
    }
  }
  return map
}

// 优化点: 统一规范化 storage_folder，避免重复 if 逻辑
function normalizeStorageFolder(raw?: string | null): string {
  if (!raw) return ''
  if (raw === '/') return ''
  return raw.endsWith('/') ? raw.slice(0, -1) : raw
}

// 优化点: 复用 S3 公开 URL 拼接逻辑
function buildS3PublicUrl(cfg: Record<string, string>, key: string): string {
  const bucket = cfg['bucket'] || ''
  const endpoint = (cfg['endpoint'] || '').replace(/\/$/, '')
  const useCdn = cfg['s3_cdn'] === 'true'
  const cdnUrl = (cfg['s3_cdn_url'] || '').replace(/\/$/, '')
  const forcePathStyle = cfg['force_path_style'] === 'true'

  const base = useCdn && cdnUrl ? cdnUrl : endpoint
  if (useCdn && cdnUrl) {
    return `${base}/${key}`
  }
  if (forcePathStyle) {
    return `${base}/${bucket}/${key}`
  }
  return `${base.replace('https://', 'https://' + bucket + '.')}/${key}`
}

// 生成预签名 URL
app.post('/presigned-url', async (c) => {
  try {
    const { filename, contentType, type = '/', storage } = await c.req.json()
    if (!filename) {
      throw new HTTPException(400, { message: 'Filename is required' })
    }
    if (!storage) {
      throw new HTTPException(400, { message: 'Storage type is required' })
    }

    switch (storage) {
      case 'r2': {
        // 获取 R2 配置
        const configs = await fetchConfigsByKeys([
          'r2_accesskey_id',
          'r2_accesskey_secret',
          'r2_account_id',
          'r2_bucket',
          'r2_storage_folder',
          'r2_public_domain',
        ])
        const cfg = toConfigMap(configs) // 优化点: 统一转为 map，减少重复 find

        const bucket = cfg['r2_bucket'] || ''
        const storageFolder = normalizeStorageFolder(cfg['r2_storage_folder'])
        const typeSegment = type && type !== '/' ? String(type).slice(1) : ''
        const parts = [storageFolder, typeSegment].filter(Boolean)
        const prefix = parts.length ? parts.join('/') : ''
        const filePath = prefix ? `${prefix}/${filename}` : filename

        const client = getR2Client(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath,
          },
        })
      }

      case 's3': {
        const configs = await fetchConfigsByKeys([
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
          's3_force_server_upload',
        ])
        const cfg = toConfigMap(configs)
        const forceServer = cfg['s3_force_server_upload'] === 'true'
        if (forceServer) {
          return c.json({ code: 286, data: { serverUpload: true } })
        }

        const requiredKeys = ['accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket']
        for (const k of requiredKeys) {
          if (!cfg[k]) {
            throw new HTTPException(400, { message: `S3 config ${k} is required` })
          }
        }

        const bucket = cfg['bucket']
        const storageFolder = normalizeStorageFolder(cfg['storage_folder'])
        const typeSegment = type && type !== '/' ? type.replace(/^\//, '') : ''
        const parts = [storageFolder, typeSegment].filter(Boolean)
        const prefix = parts.length ? parts.join('/') : ''
        const filePath = prefix ? `${prefix}/${filename}` : filename

        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(
          client as unknown as Record<string, unknown>,
          bucket,
          filePath,
          contentType,
          'put',
        )

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath,
          },
        })
      }

      default:
        throw new HTTPException(400, { message: 'Unsupported storage type' })
    }
  } catch (e: unknown) {
    const msg = (e && e.message) ? e.message : 'Failed to generate presigned URL'
    throw new HTTPException(500, { message: msg, cause: e })
  }
})

app.post('/upload', async (c) => {
  const formData = await c.req.formData()

  const file = formData.get('file')
  const storage = formData.get('storage')
  const type = formData.get('type')
  const mountPath = formData.get('mountPath') || ''

  if (!storage) {
    throw new HTTPException(400, { message: 'Storage type is required' })
  }

  switch (storage.toString()) {
    case 'alist':
      try {
        const result = await alistUpload(file as Blob, type as string, mountPath as string)
        return Response.json({ code: 200, data: result })
      } catch (e) {
        throw new HTTPException(500, { message: 'Failed', cause: e })
      }

    case 's3': {
      try {
        if (!file) {
          throw new HTTPException(400, { message: 'File missing for S3 upload' })
        }

        const blob = file as Blob
        const configs = await fetchConfigsByKeys([
          'accesskey_id',
          'accesskey_secret',
          'region',
          'endpoint',
          'bucket',
          'storage_folder',
          'force_path_style',
          's3_cdn',
          's3_cdn_url',
        ])
        const cfg = toConfigMap(configs)

        const requiredKeys = ['accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket']
        for (const k of requiredKeys) {
          if (!cfg[k]) {
            throw new HTTPException(400, { message: `S3 config ${k} is required` })
          }
        }

        const bucket = cfg['bucket']
        const storageFolder = normalizeStorageFolder(cfg['storage_folder'])
        const typeSegment = type && type !== '/' ? String(type).replace(/^\//, '') : ''
        const parts = [storageFolder, typeSegment].filter(Boolean)
        const prefix = parts.length ? parts.join('/') : ''

        const imageId = createId()
        const rawName = (blob as any).name || 'upload.bin'
        const ext = rawName.includes('.') ? rawName.split('.').pop() : 'bin'
        const newFileName = `${imageId}.${ext}`
        const key = prefix ? `${prefix}/${newFileName}` : newFileName

        const client = getClient(configs)
        const buf = Buffer.from(await blob.arrayBuffer())
        await client.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buf,
            ContentType: (blob as any).type || undefined,
          }),
        )

        const url = buildS3PublicUrl(cfg, key) // 优化点: 复用统一的 URL 拼接逻辑

        return Response.json({
          code: 200,
          data: {
            url,
            imageId,
            fileName: newFileName,
            key,
          },
        })
      } catch (e) {
        throw new HTTPException(500, { message: 'S3 server upload failed', cause: e })
      }
    }

    default:
      throw new HTTPException(500, { message: 'storage not support' })
  }
})

app.post('/getObjectUrl', async (c) => {
  const { storage, key } = await c.req.json()

  switch (storage) {
    case 's3': {
      const configs = await fetchConfigsByKeys([
        'accesskey_id',
        'accesskey_secret',
        'region',
        'endpoint',
        'bucket',
        'force_path_style',
        's3_cdn',
        's3_cdn_url',
        's3_direct_download',
      ])
      const cfg = toConfigMap(configs)
      const bucket = cfg['bucket'] || ''
      const direct = cfg['s3_direct_download'] === 'true'

      if (!direct) {
        // 返回预签名 GET 链接，适用于私有桶
        try {
          const client = getClient(configs)
          const signed = await generatePresignedUrl(
            client as unknown as Record<string, unknown>,
            bucket,
            key,
            '',
            'get',
          )
          return Response.json({ code: 200, data: signed })
        } catch (e) {
          throw new HTTPException(500, { message: 'Failed to sign S3 GET URL', cause: e })
        }
      }

      // 直接拼接公开访问 URL（需要对象对公网可读或经 CDN 暴露）
      const url = buildS3PublicUrl(cfg, key)
      return Response.json({ code: 200, data: url })
    }

    case 'r2': {
      // 获取 R2 配置
      const configs = await fetchConfigsByKeys([
        'r2_accesskey_id',
        'r2_accesskey_secret',
        'r2_account_id',
        'r2_bucket',
        'r2_storage_folder',
        'r2_public_domain',
      ])

      const r2PublicDomain = configs.find((item: Config) => item.config_key === 'r2_public_domain')?.config_value || ''

      return Response.json({
        code: 200, data: `${r2PublicDomain}/${key}`
      })
    }
  }
})

// 删除存储中的对象
app.post('/delete', async (c) => {
  try {
    const { storage, key } = await c.req.json()
    if (!storage || !key) {
      throw new HTTPException(400, { message: 'storage 和 key 均必填' })
    }
    switch (storage) {
      case 's3': {
        const configs = await fetchConfigsByKeys(['accesskey_id','accesskey_secret','region','endpoint','bucket'])
        const bucket = configs.find((i: Config) => i.config_key === 'bucket')?.config_value || ''
        if (!bucket) throw new HTTPException(400, { message: 'S3 bucket 未配置' })
        const client = getClient(configs)
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        return Response.json({ code: 200, message: 'deleted' })
      }
      case 'r2': {
        const configs = await fetchConfigsByKeys(['r2_account_id','r2_accesskey_id','r2_accesskey_secret','r2_bucket'])
        const client = getR2Client(configs)
        const bucket = configs.find((i: Config) => i.config_key === 'r2_bucket')?.config_value || ''
        const { DeleteObjectCommand } = await import('@aws-sdk/client-s3')
        await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }))
        return Response.json({ code: 200, message: 'deleted' })
      }
      default:
        throw new HTTPException(400, { message: 'Unsupported storage type' })
    }
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed to delete object', cause: e })
  }
})

export default app