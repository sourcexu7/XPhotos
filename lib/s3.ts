import { S3Client } from '@aws-sdk/client-s3'
import type { Config } from '~/types'

let s3Client: S3Client | null = null

function getConfigValue(configs: Config[], key: string): string {
  return configs.find((item) => item.config_key === key)?.config_value || ''
}

function ensureHttpsUrl(url: string): string {
  return url.includes('https://') ? url : `https://${url}`
}

export function getClient(findConfig: Config[]) {
  if (!findConfig.length) {
    console.warn('警告：无法获取 S3 配置信息，请配置相应信息。')
  }
  if (s3Client) return s3Client

  const accesskeyId = getConfigValue(findConfig, 'accesskey_id')
  const accesskeySecret = getConfigValue(findConfig, 'accesskey_secret')
  const region = getConfigValue(findConfig, 'region')
  const endpoint = getConfigValue(findConfig, 'endpoint')
  const forcePathStyle = getConfigValue(findConfig, 'force_path_style') === 'true'

  const clientConfig = {
    region,
    endpoint: ensureHttpsUrl(endpoint),
    credentials: {
      accessKeyId: accesskeyId,
      secretAccessKey: accesskeySecret,
    },
    ...(forcePathStyle && { forcePathStyle: true }),
  }

  s3Client = new S3Client(clientConfig)
  return s3Client
}
