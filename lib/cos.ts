import { S3Client } from '@aws-sdk/client-s3'
import type { Config } from '~/types'

let cosClient: S3Client | null = null

function getConfigValue(configs: Config[], key: string): string {
  return configs.find((item) => item.config_key === key)?.config_value || ''
}

function ensureHttpsUrl(url: string): string {
  if (!url) return ''
  return url.includes('https://') ? url : `https://${url.replace(/^https?:\/\//i, '')}`
}

export function getCOSClient(findConfig: Config[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 COS 配置信息，请配置相应信息。')
  }
  if (cosClient) return cosClient

  const secretId = getConfigValue(findConfig, 'cos_secret_id')
  const secretKey = getConfigValue(findConfig, 'cos_secret_key')
  const region = getConfigValue(findConfig, 'cos_region')
  const endpoint = getConfigValue(findConfig, 'cos_endpoint')
  const forcePathStyle = getConfigValue(findConfig, 'cos_force_path_style') === 'true'

  const clientConfig = {
    region,
    endpoint: ensureHttpsUrl(endpoint),
    credentials: {
      accessKeyId: secretId,
      secretAccessKey: secretKey,
    },
    ...(forcePathStyle && { forcePathStyle: true }),
  }

  cosClient = new S3Client(clientConfig)
  return cosClient
}

