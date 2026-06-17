// 配置表

'use server'

import { db } from '~/lib/db'
import { cacheInvalidateByPattern } from '~/lib/redis'

/**
 * 更新 S3 配置
 * @param configs 配置信息
 */
export async function updateS3Config(configs: Record<string, unknown>) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'accesskey_id' THEN ${configs.accesskeyId?.toString().trim()}
       WHEN config_key = 'accesskey_secret' THEN ${configs.accesskeySecret?.toString().trim()}
       WHEN config_key = 'region' THEN ${configs.region?.toString().trim()}
       WHEN config_key = 'endpoint' THEN ${configs.endpoint?.toString().trim()}
       WHEN config_key = 'bucket' THEN ${configs.bucket?.toString().trim()}
       WHEN config_key = 'storage_folder' THEN ${configs.storageFolder?.toString().trim()}
       WHEN config_key = 'force_path_style' THEN ${configs.forcePathStyle?.toString().trim()}
       WHEN config_key = 's3_force_server_upload' THEN ${configs.s3ForceServerUpload?.toString().trim()}
       WHEN config_key = 's3_cdn' THEN ${configs.s3Cdn?.toString().trim()}
       WHEN config_key = 's3_cdn_url' THEN ${configs.s3CdnUrl?.toString().trim()}
       WHEN config_key = 's3_direct_download' THEN ${configs.s3DirectDownload?.toString().trim()}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket', 'storage_folder', 'force_path_style', 's3_force_server_upload', 's3_cdn', 's3_cdn_url', 's3_direct_download');
  `
}

/**
 * 更新腾讯云 COS 配置
 * @param configs 配置信息
 */
export async function updateCOSConfig(configs: Record<string, unknown>) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'cos_secret_id' THEN ${configs.cosSecretId?.toString().trim()}
       WHEN config_key = 'cos_secret_key' THEN ${configs.cosSecretKey?.toString().trim()}
       WHEN config_key = 'cos_region' THEN ${configs.cosRegion?.toString().trim()}
       WHEN config_key = 'cos_endpoint' THEN ${configs.cosEndpoint?.toString().trim()}
       WHEN config_key = 'cos_bucket' THEN ${configs.cosBucket?.toString().trim()}
       WHEN config_key = 'cos_storage_folder' THEN ${configs.cosStorageFolder?.toString().trim()}
       WHEN config_key = 'cos_force_path_style' THEN ${configs.cosForcePathStyle?.toString().trim()}
       WHEN config_key = 'cos_cdn' THEN ${configs.cosCdn?.toString().trim()}
       WHEN config_key = 'cos_cdn_url' THEN ${configs.cosCdnUrl?.toString().trim()}
       WHEN config_key = 'cos_direct_download' THEN ${configs.cosDirectDownload?.toString().trim()}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN (
      'cos_secret_id',
      'cos_secret_key',
      'cos_region',
      'cos_endpoint',
      'cos_bucket',
      'cos_storage_folder',
      'cos_force_path_style',
      'cos_cdn',
      'cos_cdn_url',
      'cos_direct_download'
    );
  `
}

/**
 * 更新 AList 配置
 * @param configs 配置信息
 */
export async function updateAListConfig(configs: Record<string, unknown>) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'alist_url' THEN ${configs.alistUrl}
       WHEN config_key = 'alist_token' THEN ${configs.alistToken}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('alist_url', 'alist_token');
  `
}

/**
 * 更新自定义信息
 * @param payload 自定义信息
 */
export async function updateCustomInfo(payload: {
  title: string
  customFaviconUrl: string
  customAuthor: string
  feedId: string
  userId: string
  customIndexStyle?: number
  customIndexDownloadEnable: boolean
  customIndexCopyLinkEnable: boolean
  customIndexCopyDirectLinkEnable: boolean
  customIndexCopyShareLinkEnable: boolean
  enablePreviewImageMaxWidthLimit: boolean
  previewImageMaxWidth: number
  previewQuality: number
  umamiHost: string
  umamiAnalytics: string
  maxUploadFiles: number
  customIndexOriginEnable: boolean
  adminImagesPerPage: number
  defaultStorage?: string
  // 新增：前台语言切换按钮显示配置
  customIndexLanguageToggle?: boolean
  // 新增：前台「关于我」配置
  aboutIntro?: string
  aboutInsUrl?: string
  aboutXhsUrl?: string
  aboutWeiboUrl?: string
  aboutGithubUrl?: string
  // 新增：关于我画廊图片数组（数组字符串）- 向后兼容，存储预览图URL数组
  aboutGalleryImages?: string[]
  // 新增：关于我画廊图片完整数据（包含原图和预览图）
  aboutGalleryImagesFull?: Array<{ original: string; preview: string }>
  // 新增：头像 URL
  aboutAvatarUrl?: string
}) {
  const configUpdates: { key: string; value: string }[] = []

  // 字符串类字段：只有真正提供了非空值才写入
  const stringFields: Array<[string, string | undefined]> = [
    ['custom_title', payload.title],
    ['custom_favicon_url', payload.customFaviconUrl],
    ['custom_author', payload.customAuthor],
    ['rss_feed_id', payload.feedId],
    ['rss_user_id', payload.userId],
    ['umami_host', payload.umamiHost],
    ['umami_analytics', payload.umamiAnalytics],
  ]
  for (const [key, value] of stringFields) {
    if (typeof value === 'string') {
      configUpdates.push({ key, value })
    }
  }

  // 布尔类字段：只有显式为 boolean 才写入（避免把 undefined 转成 'false'）
  if (typeof payload.customIndexDownloadEnable === 'boolean') {
    configUpdates.push({ key: 'custom_index_download_enable', value: payload.customIndexDownloadEnable ? 'true' : 'false' })
  }
  if (typeof payload.customIndexCopyLinkEnable === 'boolean') {
    configUpdates.push({ key: 'custom_index_copy_link_enable', value: payload.customIndexCopyLinkEnable ? 'true' : 'false' })
  }
  if (typeof payload.customIndexCopyDirectLinkEnable === 'boolean') {
    configUpdates.push({ key: 'custom_index_copy_direct_link_enable', value: payload.customIndexCopyDirectLinkEnable ? 'true' : 'false' })
  }
  if (typeof payload.customIndexCopyShareLinkEnable === 'boolean') {
    configUpdates.push({ key: 'custom_index_copy_share_link_enable', value: payload.customIndexCopyShareLinkEnable ? 'true' : 'false' })
  }
  if (typeof payload.customIndexLanguageToggle === 'boolean') {
    configUpdates.push({ key: 'custom_index_language_toggle', value: payload.customIndexLanguageToggle ? 'true' : 'false' })
  }
  if (typeof payload.enablePreviewImageMaxWidthLimit === 'boolean') {
    configUpdates.push({ key: 'preview_max_width_limit_switch', value: payload.enablePreviewImageMaxWidthLimit ? '1' : '0' })
  }
  if (typeof payload.customIndexOriginEnable === 'boolean') {
    configUpdates.push({ key: 'custom_index_origin_enable', value: payload.customIndexOriginEnable ? 'true' : 'false' })
  }

  // 数字类字段：Number.isFinite 才写入，避免 undefined.toString() 抛错
  if (typeof payload.customIndexStyle === 'number' && Number.isFinite(payload.customIndexStyle)) {
    configUpdates.push({ key: 'custom_index_style', value: payload.customIndexStyle.toString() })
  }
  if (typeof payload.maxUploadFiles === 'number' && Number.isFinite(payload.maxUploadFiles)) {
    configUpdates.push({ key: 'max_upload_files', value: payload.maxUploadFiles.toString() })
  }
  if (typeof payload.adminImagesPerPage === 'number' && Number.isFinite(payload.adminImagesPerPage)) {
    configUpdates.push({ key: 'admin_images_per_page', value: payload.adminImagesPerPage.toString() })
  }
  if (typeof payload.previewImageMaxWidth === 'number' && payload.previewImageMaxWidth > 0) {
    configUpdates.push({ key: 'preview_max_width_limit', value: payload.previewImageMaxWidth.toString() })
  }
  if (typeof payload.previewQuality === 'number' && payload.previewQuality > 0) {
    configUpdates.push({ key: 'preview_quality', value: payload.previewQuality.toString() })
  }
  if (payload.defaultStorage && typeof payload.defaultStorage === 'string') {
    configUpdates.push({ key: 'default_storage', value: payload.defaultStorage })
  }

  // 新增：「关于我」相关配置（仅在有值时写入）
  if (payload.aboutIntro) {
    configUpdates.push({
      key: 'about_intro',
      value: payload.aboutIntro,
    })
  }
  if (payload.aboutInsUrl) {
    configUpdates.push({
      key: 'about_ins_url',
      value: payload.aboutInsUrl,
    })
  }
  if (payload.aboutXhsUrl) {
    configUpdates.push({
      key: 'about_xhs_url',
      value: payload.aboutXhsUrl,
    })
  }
  if (payload.aboutWeiboUrl) {
    configUpdates.push({
      key: 'about_weibo_url',
      value: payload.aboutWeiboUrl,
    })
  }
  if (payload.aboutGithubUrl) {
    configUpdates.push({
      key: 'about_github_url',
      value: payload.aboutGithubUrl,
    })
  }

  // 新增：关于我画廊图片数组（以 JSON 存储）- 向后兼容，存储预览图URL数组
  if (payload.aboutGalleryImages && Array.isArray(payload.aboutGalleryImages)) {
    try {
      const json = JSON.stringify(payload.aboutGalleryImages)
      configUpdates.push({ key: 'about_gallery_images', value: json })
    } catch (e) {
      // ignore serialization errors
    }
  }
  
  // 新增：关于我画廊图片完整数据（包含原图和预览图）
  if (payload.aboutGalleryImagesFull && Array.isArray(payload.aboutGalleryImagesFull)) {
    try {
      const json = JSON.stringify(payload.aboutGalleryImagesFull)
      configUpdates.push({ key: 'about_gallery_images_full', value: json })
    } catch (e) {
      // ignore serialization errors
    }
  }

  // 新增：头像 URL
  if (payload.aboutAvatarUrl) {
    configUpdates.push({
      key: 'about_avatar_url',
      value: payload.aboutAvatarUrl,
    })
  }

  // 优化点：使用 upsert，确保新配置项不存在时自动创建，避免 update 抛错
  await db.$transaction(
    configUpdates.map((config) =>
      db.configs.upsert({
        where: { config_key: config.key },
        create: {
          config_key: config.key,
          config_value: config.value,
        },
        update: {
          config_value: config.value,
          updatedAt: new Date(),
        },
      })
    )
  )

  // 清除配置相关的缓存，确保前端能读取到最新配置
  await cacheInvalidateByPattern('configs:*')
}
