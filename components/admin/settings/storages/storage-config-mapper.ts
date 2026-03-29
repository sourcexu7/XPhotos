import type { Config } from '~/types'
import { normalizeStorageFolder } from '~/lib/utils/storage'

export function configsToValues(configs: Config[] | undefined): Record<string, any> {
  const values: Record<string, any> = {}
  for (const c of configs || []) {
    if (!c?.config_key) continue
    const k = c.config_key
    const v = c.config_value ?? ''
    if (v === 'true') values[k] = true
    else if (v === 'false') values[k] = false
    else values[k] = v
  }
  return values
}

export function valuesToConfigs(values: Record<string, any>, base: Config[] | undefined): Config[] {
  const next: Config[] = (base || []).map((c) => {
    const k = c.config_key
    if (!k) return c
    if (!(k in values)) return c
    const v = values[k]
    return {
      ...c,
      config_value: typeof v === 'boolean' ? (v ? 'true' : 'false') : (v ?? '').toString(),
    }
  })
  return next
}

export function normalizeStorageValues(storageType: 's3' | 'cos' | 'r2' | 'alist', values: Record<string, any>): { ok: boolean; values: Record<string, any>; message?: string } {
  const next = { ...values }

  if (storageType === 's3') {
    const required = ['accesskey_id', 'accesskey_secret', 'region', 'endpoint', 'bucket']
    const missing = required.filter((k) => !next[k])
    if (missing.length) return { ok: false, values: next, message: `缺少必要配置：${missing.join(', ')}` }

    if (next.endpoint && !/^https:\/\//i.test(next.endpoint)) {
      next.endpoint = `https://${String(next.endpoint).replace(/^https?:\/\//i, '')}`
    }

    next.storage_folder = normalizeStorageFolder(next.storage_folder)

    if (next.s3_cdn && !next.s3_cdn_url) {
      return { ok: false, values: next, message: '已开启 S3 CDN，请填写 CDN URL' }
    }
    if (!next.s3_cdn) next.s3_cdn_url = ''

    return { ok: true, values: next }
  }

  if (storageType === 'cos') {
    const required = ['cos_secret_id', 'cos_secret_key', 'cos_region', 'cos_endpoint', 'cos_bucket']
    const missing = required.filter((k) => !next[k])
    if (missing.length) return { ok: false, values: next, message: `缺少必要配置：${missing.join(', ')}` }

    if (next.cos_endpoint && !/^https:\/\//i.test(next.cos_endpoint)) {
      next.cos_endpoint = `https://${String(next.cos_endpoint).replace(/^https?:\/\//i, '')}`
    }

    next.cos_storage_folder = normalizeStorageFolder(next.cos_storage_folder)

    if (next.cos_cdn && !next.cos_cdn_url) {
      return { ok: false, values: next, message: '已开启 COS CDN，请填写 CDN URL' }
    }
    if (!next.cos_cdn) next.cos_cdn_url = ''

    return { ok: true, values: next }
  }

  if (storageType === 'r2') {
    const required = ['r2_accesskey_id', 'r2_accesskey_secret', 'r2_account_id', 'r2_bucket']
    const missing = required.filter((k) => !next[k])
    if (missing.length) return { ok: false, values: next, message: `缺少必要配置：${missing.join(', ')}` }

    next.r2_storage_folder = normalizeStorageFolder(next.r2_storage_folder)
    return { ok: true, values: next }
  }

  if (storageType === 'alist') {
    const required = ['alist_url', 'alist_token']
    const missing = required.filter((k) => !next[k])
    if (missing.length) return { ok: false, values: next, message: `缺少必要配置：${missing.join(', ')}` }

    return { ok: true, values: next }
  }

  return { ok: true, values: next }
}

