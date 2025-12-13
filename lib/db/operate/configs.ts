// 配置表

'use server'

import { db } from '~/lib/db'

/**
 * 更新 S3 配置
 * @param configs 配置信息
 */
export async function updateS3Config(configs: any) {
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
 * 更新 R2 配置
 * @param configs 配置信息
 */
export async function updateR2Config(configs: any) {
  return await db.$executeRaw`
    UPDATE "public"."configs"
    SET config_value = CASE
       WHEN config_key = 'r2_accesskey_id' THEN ${configs.r2AccesskeyId}
       WHEN config_key = 'r2_accesskey_secret' THEN ${configs.r2AccesskeySecret}
       WHEN config_key = 'r2_account_id' THEN ${configs.r2AccountId}
       WHEN config_key = 'r2_bucket' THEN ${configs.r2Bucket}
       WHEN config_key = 'r2_storage_folder' THEN ${configs.r2StorageFolder}
       WHEN config_key = 'r2_public_domain' THEN ${configs.r2PublicDomain}
       WHEN config_key = 'r2_direct_download' THEN ${configs.r2DirectDownload}
       ELSE 'N&A'
    END,
        updated_at = NOW()
    WHERE config_key IN ('r2_accesskey_id', 'r2_accesskey_secret', 'r2_account_id', 'r2_bucket', 'r2_storage_folder', 'r2_public_domain', 'r2_direct_download');
  `
}

/**
 * 更新 AList 配置
 * @param configs 配置信息
 */
export async function updateAListConfig(configs: any) {
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
  customIndexStyle: number
  customIndexDownloadEnable: boolean
  enablePreviewImageMaxWidthLimit: boolean
  previewImageMaxWidth: number
  previewQuality: number
  umamiHost: string
  umamiAnalytics: string
  maxUploadFiles: number
  customIndexOriginEnable: boolean
  adminImagesPerPage: number
}) {
  const configUpdates = [
    { key: 'custom_title', value: payload.title },
    { key: 'custom_favicon_url', value: payload.customFaviconUrl },
    { key: 'custom_author', value: payload.customAuthor },
    { key: 'rss_feed_id', value: payload.feedId },
    { key: 'rss_user_id', value: payload.userId },
    { key: 'umami_host', value: payload.umamiHost },
    { key: 'umami_analytics', value: payload.umamiAnalytics },
    { key: 'custom_index_style', value: payload.customIndexStyle.toString() },
    {
      key: 'custom_index_download_enable',
      value: payload.customIndexDownloadEnable ? 'true' : 'false',
    },
    {
      key: 'preview_max_width_limit_switch',
      value: payload.enablePreviewImageMaxWidthLimit ? '1' : '0',
    },
    { key: 'max_upload_files', value: payload.maxUploadFiles.toString() },
    {
      key: 'custom_index_origin_enable',
      value: payload.customIndexOriginEnable ? 'true' : 'false',
    },
    {
      key: 'admin_images_per_page',
      value: payload.adminImagesPerPage.toString(),
    },
  ]

  // 添加可选配置
  if (payload.previewImageMaxWidth > 0) {
    configUpdates.push({
      key: 'preview_max_width_limit',
      value: payload.previewImageMaxWidth.toString(),
    })
  }
  if (payload.previewQuality > 0) {
    configUpdates.push({
      key: 'preview_quality',
      value: payload.previewQuality.toString(),
    })
  }

  await db.$transaction(
    configUpdates.map((config) =>
      db.configs.update({
        where: { config_key: config.key },
        data: {
          config_value: config.value,
          updatedAt: new Date(),
        },
      })
    )
  )
}
