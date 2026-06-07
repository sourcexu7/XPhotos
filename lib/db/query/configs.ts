// 配置表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'
import { cacheWrap, cacheInvalidate } from '~/lib/redis'

const INFLIGHT_QUERIES = new Map<string, Promise<Config[]>>()

function configCacheKey(keys: string[]): string {
  return `configs:${keys.slice().sort().join('|')}`
}

/**
 * 根据 key 获取配置
 * @param keys key 列表
 * @return {Promise<Config[]>} 配置列表
 */
export async function fetchConfigsByKeys(keys: string[]): Promise<Config[]> {
  const redisKey = configCacheKey(keys)

  // 并发去重：同一批 keys 正在查询时复用 Promise
  const existingInflight = INFLIGHT_QUERIES.get(redisKey)
  if (existingInflight) {
    try {
      return await existingInflight
    } catch {
      // 复用失败则继续发起新请求
    }
  }

  const promise = cacheWrap<Config[]>(redisKey, async () => {
    await db.$connect().catch(() => {})
    return await db.configs.findMany({
      where: { config_key: { in: keys } },
      select: { id: true, config_key: true, config_value: true, detail: true },
    })
  }).finally(() => {
    INFLIGHT_QUERIES.delete(redisKey)
  })

  INFLIGHT_QUERIES.set(redisKey, promise)
  return await promise
}

/**
 * 根据 key 获取单个配置值
 * @param key 配置键
 * @param defaultValue 默认值
 * @return {Promise<string>} 配置值
 */
export async function fetchConfigValue(key: string, defaultValue: string = ''): Promise<string> {
  const redisKey = `config:${key}`
  const value = await cacheWrap<string | null>(redisKey, async () => {
    const config = await db.configs.findFirst({
      where: { config_key: key },
      select: { config_value: true },
    })
    return config?.config_value ?? null
  })
  return value ?? defaultValue
}

/**
 * 写操作后调用，使相关配置缓存失效
 */
export async function invalidateConfigsCache(...keys: string[]): Promise<void> {
  const redisKeys = keys.map((k) => `config:${k}`)
  // 同时清理批量 key 的复合缓存（逐一扫描不同组合开销高，直接清 single-key 缓存即可）
  await cacheInvalidate(...redisKeys)
}
