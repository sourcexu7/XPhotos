// 配置表

'use server'

import { db } from '~/lib/db'
import type { Config } from '~/types'

/**
 * 根据 key 获取配置
 * @param keys key 列表
 * @return {Promise<Config[]>} 配置列表
 */
export async function fetchConfigsByKeys(keys: string[]): Promise<Config[]> {
  try {
    return await db.configs.findMany({
      where: {
        config_key: {
          in: keys
        }
      },
      select: {
        id: true,
        config_key: true,
        config_value: true,
        detail: true
      }
    })
  } catch (error) {
    console.error('Failed to fetch configs, retrying...', error)
    try {
      return await db.configs.findMany({
        where: {
          config_key: {
            in: keys
          }
        },
        select: {
          id: true,
          config_key: true,
          config_value: true,
          detail: true
        }
      })
    } catch (retryError) {
      console.error('Retry failed, returning empty config:', retryError)
      return []
    }
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
