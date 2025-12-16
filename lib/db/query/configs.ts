// 配置表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'

// 优化点: 为常用配置结果增加轻量缓存，减少重复 DB 查询
const CONFIG_CACHE = new Map<string, { data: Config[]; expiresAt: number }>()
const CONFIG_TTL = 60_000
// 并发去重：当相同 key 的查询正在进行时，复用同一个 Promise，避免短时间内触发大量相同的 DB 请求
const INFLIGHT_QUERIES = new Map<string, Promise<Config[]>>()

/**
 * 根据 key 获取配置
 * @param keys key 列表
 * @return {Promise<Config[]>} 配置列表
 */
export async function fetchConfigsByKeys(keys: string[]): Promise<Config[]> {
  const cacheKey = keys.slice().sort().join('|')
  const now = Date.now()
  const cached = CONFIG_CACHE.get(cacheKey)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  // 如果其他并发调用正在查询相同的 keys，直接复用该 Promise
  const existingInflight = INFLIGHT_QUERIES.get(cacheKey)
  if (existingInflight) {
    try {
      return await existingInflight
    } catch (e) {
      // 如果复用的请求失败，继续向下发起新的请求
    }
  }

  const promise = (async () => {
    try {
      const data = await db.configs.findMany({
        where: {
          config_key: {
            in: keys,
          },
        },
        select: {
          id: true,
          config_key: true,
          config_value: true,
          detail: true,
        },
      })

      CONFIG_CACHE.set(cacheKey, { data, expiresAt: now + CONFIG_TTL })
      return data
    } catch (error) {
      console.error('Failed to fetch configs:', error)
      return []
    } finally {
      INFLIGHT_QUERIES.delete(cacheKey)
    }
  })()

  INFLIGHT_QUERIES.set(cacheKey, promise)
  return await promise
}

/**
 * 根据 key 获取单个配置值
 * @param key 配置键
 * @param defaultValue 默认值
 * @return {Promise<string>} 配置值
 */
export async function fetchConfigValue(key: string, defaultValue: string = ''): Promise<string> {
  // 优先尝试从缓存中读取单键值，降低 DB 访问频率
  const cachedKey = key
  const now = Date.now()
  for (const [cacheKey, entry] of CONFIG_CACHE.entries()) {
    if (cacheKey.split('|').includes(cachedKey) && entry.expiresAt > now) {
      const found = entry.data.find(i => i.config_key === key)
      if (found) return found.config_value || defaultValue
    }
  }

  // 回退到单条查询
  try {
    const config = await db.configs.findFirst({
      where: { config_key: key },
      select: { config_value: true }
    })
    return config?.config_value || defaultValue
  } catch (error) {
    console.error('Failed to fetch config value:', error)
    return defaultValue
  }
}
