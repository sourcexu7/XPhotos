import 'server-only'

import { fetchConfigsByKeys } from '~/lib/db/query/configs'
import type { Config } from '~/types'
import { Hono } from 'hono'
import { HTTPException } from 'hono/http-exception'
import { updateAListConfig, updateCustomInfo, updateR2Config, updateS3Config } from '~/lib/db/operate/configs'

import { fetchTagsList, fetchTagsTree, fetchTagsByCategory } from '~/lib/db/query/tags'
import { createTag, updateTag, deleteTag, deleteTagAndChildren } from '~/lib/db/operate/tags'
import { moveTag, validateTagMove } from '~/lib/services/tag-move-service'
import { checkAndFixImageTagCompleteness } from '~/lib/services/image-tag-sync-service'
import { getClient } from '~/lib/s3'
import { HeadBucketCommand, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'

const app = new Hono()

// tags 相关接口
app.get('/tags/get', async (c) => {
  try {
    const tree = c.req.query('tree')
    const parent = c.req.query('parent')
    if (tree === 'true') {
      const data = await fetchTagsTree()
      return c.json({ code: 200, data })
    }
    if (parent) {
      const data = await fetchTagsByCategory(String(parent))
      return c.json({ code: 200, data })
    }
    const data = await fetchTagsList()
    return c.json({ code: 200, data })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.post('/tags/add', async (c) => {
  try {
    const payload = await c.req.json()
    // payload may include parentName for creating child tags under a parent (uses existing `category` field for compatibility)
    const res = await createTag(payload)
    return c.json({ code: 200, data: res })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.put('/tags/update/:id', async (c) => {
  try {
    const id = c.req.param('id')
    const payload = await c.req.json()
    const res = await updateTag(id, payload)
    return c.json({ code: 200, data: res })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

// 标签移动接口（带验证和图片标签同步）
app.post('/tags/move', async (c) => {
  try {
    const { tagId, targetParentId } = await c.req.json()
    
    if (!tagId) {
      throw new HTTPException(400, { message: '标签ID不能为空' })
    }

    // 验证移动操作
    const validation = await validateTagMove(tagId, targetParentId ?? null)
    if (!validation.valid) {
      return c.json({ code: 400, message: validation.error })
    }

    // 执行移动
    const result = await moveTag(tagId, targetParentId ?? null)
    
    if (!result.success) {
      return c.json({ code: 400, message: result.error })
    }

    return c.json({ code: 200, data: result.tag, message: '移动成功' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

// 历史图片标签补全检查接口
app.post('/tags/check-completeness', async (c) => {
  try {
    const { batchSize } = await c.req.json()
    const result = await checkAndFixImageTagCompleteness(batchSize ?? 100)
    return c.json({ code: 200, data: result })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.delete('/tags/delete/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await deleteTag(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

// 原子性删除父标签及其子标签（事务）
app.delete('/tags/delete-with-children/:id', async (c) => {
  try {
    const id = c.req.param('id')
    await deleteTagAndChildren(id)
    return c.json({ code: 200, message: 'Success' })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

app.get('/get-custom-info', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'custom_title',
      'custom_favicon_url',
      'custom_author',
      'rss_feed_id',
      'rss_user_id',
      'custom_index_style',
      'custom_index_download_enable',
      'preview_max_width_limit',
      'preview_max_width_limit_switch',
      'preview_quality',
      'umami_host',
      'umami_analytics',
      'max_upload_files',
      'custom_index_origin_enable',
      'admin_images_per_page',
      // 新增：「关于我」前台展示配置
      'about_intro',
      'about_gallery_images_full',
      'about_ins_url',
      'about_xhs_url',
      'about_weibo_url',
         'about_github_url',
         'about_gallery_images',
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching custom info:', error)
    throw new HTTPException(500, { message: 'Failed to fetch custom info', cause: error })
  }
})

app.get('/r2-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'r2_accesskey_id',
    'r2_accesskey_secret',
    'r2_account_id',
    'r2_bucket',
    'r2_storage_folder',
    'r2_public_domain',
    'r2_direct_download'
  ])
  return c.json(data)
})

app.get('/s3-info', async (c) => {
  const data = await fetchConfigsByKeys([
    'accesskey_id',
    'accesskey_secret',
    'region',
    'endpoint',
    'bucket',
    'storage_folder',
    'force_path_style',
    's3_force_server_upload',
    's3_cdn',
    's3_cdn_url',
    's3_direct_download'
  ])
  return c.json(data)
})

// 轻量验证 S3 配置是否可操作存储桶
app.get('/validate-s3', async (c) => {
  try {
    const keys = [
      'accesskey_id',
      'accesskey_secret',
      'region',
      'endpoint',
      'bucket',
      'storage_folder',
      'force_path_style',
    ]
    const configs = await fetchConfigsByKeys(keys)
    const getVal = (k: string) => configs.find((i: Config) => i.config_key === k)?.config_value || ''

    const accesskeyId = getVal('accesskey_id')
    const accesskeySecret = getVal('accesskey_secret')
    const region = getVal('region')
    const endpoint = getVal('endpoint')
    const bucket = getVal('bucket')
    let storageFolder = getVal('storage_folder')

    if (!accesskeyId || !accesskeySecret || !region || !endpoint || !bucket) {
      throw new HTTPException(400, { message: 'S3 配置不完整，缺少必要字段' })
    }

    // 规范 storageFolder
    if (storageFolder === '/') storageFolder = ''
    if (storageFolder.endsWith('/')) storageFolder = storageFolder.slice(0,-1)

    const client = getClient(configs)
    const checks: Record<string, string> = {}

    // 1) HeadBucket
    try {
      await client.send(new HeadBucketCommand({ Bucket: bucket }))
      checks.headBucket = 'ok'
    } catch (e: unknown) {
      checks.headBucket = `error: ${e?.name || e?.message || 'unknown'}`
    }

    // 2) PutObject 一个小测试文件
    const keyPrefix = storageFolder ? `${storageFolder}/` : ''
    const testKey = `${keyPrefix}picimpact-validate-${Date.now()}.txt`
    try {
      await client.send(new PutObjectCommand({ Bucket: bucket, Key: testKey, Body: 'picimpact-validation', ContentType: 'text/plain' }))
      checks.putObject = 'ok'
    } catch (e: unknown) {
      checks.putObject = `error: ${e?.name || e?.message || 'unknown'}`
    }

    // 3) GetObject 读取刚写入的内容
    try {
      await client.send(new GetObjectCommand({ Bucket: bucket, Key: testKey }))
      checks.getObject = 'ok'
    } catch (e: unknown) {
      checks.getObject = `error: ${e?.name || e?.message || 'unknown'}`
    }

    // 4) DeleteObject 删除测试文件
    try {
      await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: testKey }))
      checks.deleteObject = 'ok'
    } catch (e: unknown) {
      checks.deleteObject = `error: ${e?.name || e?.message || 'unknown'}`
    }

    return c.json({ code: 200, data: { bucket, endpoint, testKey, checks } })
  } catch (e: unknown) {
    const msg = e?.message || 'S3 配置验证失败'
    throw new HTTPException(e?.status || 500, { message: msg, cause: e })
  }
})

app.get('/get-admin-config', async (c) => {
  try {
    const data = await fetchConfigsByKeys([
      'admin_images_per_page'
    ])
    return c.json(data)
  } catch (error) {
    console.error('Error fetching admin config:', error)
    throw new HTTPException(500, { message: 'Failed to fetch admin config', cause: error })
  }
})

app.put('/update-alist-info', async (c) => {
  const query = await c.req.json()

  const alistUrl = query?.find((item: Config) => item.config_key === 'alist_url').config_value
  const alistToken = query?.find((item: Config) => item.config_key === 'alist_token').config_value

  const data = await updateAListConfig({ alistUrl, alistToken })
  return c.json(data)
})

app.put('/update-r2-info', async (c) => {
  const query = await c.req.json()

  const r2AccesskeyId = query?.find((item: Config) => item.config_key === 'r2_accesskey_id').config_value
  const r2AccesskeySecret = query?.find((item: Config) => item.config_key === 'r2_accesskey_secret').config_value
  const r2AccountId = query?.find((item: Config) => item.config_key === 'r2_account_id').config_value
  const r2Bucket = query?.find((item: Config) => item.config_key === 'r2_bucket').config_value
  const r2StorageFolder = query?.find((item: Config) => item.config_key === 'r2_storage_folder').config_value
  const r2PublicDomain = query?.find((item: Config) => item.config_key === 'r2_public_domain').config_value
  const r2DirectDownload = query?.find((item: Config) => item.config_key === 'r2_direct_download').config_value

  const data = await updateR2Config({ r2AccesskeyId, r2AccesskeySecret, r2AccountId, r2Bucket, r2StorageFolder, r2PublicDomain, r2DirectDownload })
  return c.json(data)
})

app.put('/update-s3-info', async (c) => {
  const query = await c.req.json()

  const accesskeyId = query?.find((item: Config) => item.config_key === 'accesskey_id').config_value
  const accesskeySecret = query?.find((item: Config) => item.config_key === 'accesskey_secret').config_value
  const region = query?.find((item: Config) => item.config_key === 'region').config_value
  const endpoint = query?.find((item: Config) => item.config_key === 'endpoint').config_value
  const bucket = query?.find((item: Config) => item.config_key === 'bucket').config_value
  const storageFolder = query?.find((item: Config) => item.config_key === 'storage_folder').config_value
  const forcePathStyle = query?.find((item: Config) => item.config_key === 'force_path_style').config_value
  const s3ForceServerUpload = query?.find((item: Config) => item.config_key === 's3_force_server_upload')?.config_value
  const s3Cdn = query?.find((item: Config) => item.config_key === 's3_cdn').config_value
  const s3CdnUrl = query?.find((item: Config) => item.config_key === 's3_cdn_url').config_value
  const s3DirectDownload = query?.find((item: Config) => item.config_key === 's3_direct_download').config_value

  const data = await updateS3Config({ accesskeyId, accesskeySecret, region, endpoint, bucket, storageFolder, forcePathStyle, s3ForceServerUpload, s3Cdn, s3CdnUrl, s3DirectDownload })
  return c.json(data)
})

app.put('/update-custom-info', async (c) => {
  const query = await c.req.json() satisfies {
    title: string
    customFaviconUrl: string
    customAuthor: string
    feedId: string
    userId: string
    customIndexStyle?: number
    customIndexDownloadEnable: boolean
    enablePreviewImageMaxWidthLimit: boolean
    previewImageMaxWidth: number
    previewQuality: number
    umamiHost: string
    umamiAnalytics: string
    maxUploadFiles: number
    customIndexOriginEnable: boolean
    adminImagesPerPage: number
    // 新增：「关于我」前台展示配置
    aboutIntro?: string
    aboutInsUrl?: string
    aboutXhsUrl?: string
    aboutWeiboUrl?: string
    aboutGithubUrl?: string
    // 新增：关于我画廊图片数组（数组字符串）- 向后兼容，存储预览图URL数组
    aboutGalleryImages?: string[]
    // 新增：关于我画廊图片完整数据（包含原图和预览图）
    aboutGalleryImagesFull?: Array<{ original: string; preview: string }>
  }
  try {
    await updateCustomInfo(query)
    return c.json({
      code: 200,
      message: 'Success'
    })
  } catch (e) {
    throw new HTTPException(500, { message: 'Failed', cause: e })
  }
})

export default app
