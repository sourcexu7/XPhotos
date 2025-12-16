// 配置表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'

// 优化点: 为常用配置结果增加轻量缓存，减少重复 DB 查询
const CONFIG_CACHE = new Map<string, { data: Config[]; expiresAt: number }>()
const CONFIG_TTL = 60_000

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
  }
}

/**
 * 根据 key 获取单个配置值
 * @param key 配置键
 * @param defaultValue 默认值
 * @return {Promise<string>} 配置值
 */
export async function fetchConfigValue(key: string, defaultValue: string = ''): Promise<string> {
  const config = await db.configs.findFirst({
    where: {
      config_key: key
    },
    select: {
      config_value: true
    }
  })
  return config?.config_value || defaultValue
}
