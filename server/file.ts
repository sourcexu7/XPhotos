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

        const bucket = configs.find((item: Config) => item.config_key === 'r2_bucket')?.config_value || ''
        const storageFolder = configs.find((item: Config) => item.config_key === 'r2_storage_folder')?.config_value || ''

        // 构建文件路径
        const filePath = storageFolder && storageFolder !== '/'
          ? type && type !== '/' ? `${storageFolder}${type}/${filename}` : `${storageFolder}/${filename}`
          : type && type !== '/' ? `${type.slice(1)}/${filename}` : `${filename}`

        const client = getR2Client(configs)
        const presignedUrl = await generatePresignedUrl(client, bucket, filePath, contentType, 'put')

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath
          }
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
        const forceServer = (configs.find((i: Config) => i.config_key === 's3_force_server_upload')?.config_value || '') === 'true'
        if (forceServer) {
          return c.json({ code: 286, data: { serverUpload: true } })
        }
        const requiredKeys = ['accesskey_id','accesskey_secret','region','endpoint','bucket']
        for (const k of requiredKeys) {
          const v = configs.find((item: Config) => item.config_key === k)?.config_value || ''
          if (!v) {
            throw new HTTPException(400, { message: `S3 config ${k} is required` })
          }
        }
        const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
        let storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''
        // normalize storageFolder to avoid trailing slash issues
        if (storageFolder === '/') storageFolder = ''
        if (storageFolder.endsWith('/')) storageFolder = storageFolder.slice(0, -1)

        const typeSegment = (type && type !== '/') ? `${type.replace(/^\//,'')}` : ''
        const parts = [storageFolder, typeSegment].filter(Boolean)
        const prefix = parts.length ? parts.join('/') : ''
        const filePath = prefix ? `${prefix}/${filename}` : `${filename}`

        const client = getClient(configs)
        const presignedUrl = await generatePresignedUrl(client as any, bucket, filePath, contentType, 'put')

        return c.json({
          code: 200,
          data: {
            presignedUrl,
            key: filePath
          }
        })
      }

      default:
        throw new HTTPException(400, { message: 'Unsupported storage type' })
    }
  } catch (e: any) {
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

  if (storage) {
    switch (storage.toString()) {
      case 'alist':
        return await alistUpload(file, type, mountPath)
          .then((result: string | undefined) => {
            return Response.json({
              code: 200, data: result
            })
          })
          .catch(e => {
            throw new HTTPException(500, { message: 'Failed', cause: e })
          })
      case 's3': {
        try {
          if (!(file instanceof File)) {
            throw new HTTPException(400, { message: 'File missing for S3 upload' })
          }
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

          const requiredKeys = ['accesskey_id','accesskey_secret','region','endpoint','bucket']
          for (const k of requiredKeys) {
            const v = configs.find((item: Config) => item.config_key === k)?.config_value || ''
            if (!v) {
              throw new HTTPException(400, { message: `S3 config ${k} is required` })
            }
          }

          const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
          let storageFolder = configs.find((item: Config) => item.config_key === 'storage_folder')?.config_value || ''
          if (storageFolder === '/') storageFolder = ''
          if (storageFolder.endsWith('/')) storageFolder = storageFolder.slice(0, -1)

          const typeSegment = (type && type !== '/') ? `${String(type).replace(/^\//,'')}` : ''
          const parts = [storageFolder, typeSegment].filter(Boolean)
          const prefix = parts.length ? parts.join('/') : ''

          const imageId = createId()
          const name = (file as File).name || 'upload.bin'
          const ext = name.includes('.') ? name.split('.').pop() : 'bin'
          const newFileName = `${imageId}.${ext}`
          const key = prefix ? `${prefix}/${newFileName}` : `${newFileName}`

          const client = getClient(configs)
          const buf = Buffer.from(await (file as File).arrayBuffer())
          await client.send(new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buf,
            ContentType: (file as File).type || undefined,
          }))

          // 构造可访问 URL（与 getObjectUrl 逻辑一致）
          const endpoint = configs.find((item: Config) => item.config_key === 'endpoint')?.config_value || ''
          const forcePathStyle = (configs.find((item: Config) => item.config_key === 'force_path_style')?.config_value || '') === 'true'
          const useCdn = (configs.find((item: Config) => item.config_key === 's3_cdn')?.config_value || '') === 'true'
          const cdnUrl = configs.find((item: Config) => item.config_key === 's3_cdn_url')?.config_value || ''

          const base = useCdn && cdnUrl ? cdnUrl.replace(/\/$/, '') : endpoint.replace(/\/$/, '')
          const url = useCdn && cdnUrl
            ? `${base}/${key}`
            : forcePathStyle
              ? `${base}/${bucket}/${key}`
              : `${base.replace('https://', 'https://'+bucket+'.')}/${key}`

          return Response.json({
            code: 200,
            data: {
              url,
              imageId,
              fileName: newFileName,
              key,
            }
          })
        } catch (e) {
          throw new HTTPException(500, { message: 'S3 server upload failed', cause: e })
        }
      }
      default:
        throw new HTTPException(500, { message: 'storage not support' })
    }
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
      const bucket = configs.find((item: Config) => item.config_key === 'bucket')?.config_value || ''
      const endpoint = configs.find((item: Config) => item.config_key === 'endpoint')?.config_value || ''
      const forcePathStyle = (configs.find((item: Config) => item.config_key === 'force_path_style')?.config_value || '') === 'true'
      const useCdn = (configs.find((item: Config) => item.config_key === 's3_cdn')?.config_value || '') === 'true'
      const cdnUrl = configs.find((item: Config) => item.config_key === 's3_cdn_url')?.config_value || ''
      const direct = (configs.find((item: Config) => item.config_key === 's3_direct_download')?.config_value || '') === 'true'

      if (!direct) {
        // 返回预签名 GET 链接，适用于私有桶
        try {
          const client = getClient(configs)
          const signed = await generatePresignedUrl(client as any, bucket, key, '', 'get')
          return Response.json({ code: 200, data: signed })
        } catch (e) {
          throw new HTTPException(500, { message: 'Failed to sign S3 GET URL', cause: e })
        }
      }

      // 直接拼接公开访问 URL（需要对象对公网可读或经 CDN 暴露）
      const base = useCdn && cdnUrl ? cdnUrl.replace(/\/$/, '') : endpoint.replace(/\/$/, '')
      const url = useCdn && cdnUrl
        ? `${base}/${key}`
        : forcePathStyle
          ? `${base}/${bucket}/${key}`
          : `${base.replace('https://', 'https://'+bucket+'.')}/${key}`

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