import 'server-only'

import { createClient } from 'redis'

const globalForRedis = globalThis as unknown as {
  redis: ReturnType<typeof createClient> | undefined
}

function createRedisClient() {
  const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      connectTimeout: 5000,
    },
  })

  client.on('error', (err) => {
    console.error('[Redis] client error:', err)
  })

  client.connect().catch((err) => {
    console.error('[Redis] connect failed:', err)
  })

  return client
}

export const redis = globalForRedis.redis ?? createRedisClient()

if (process.env.NODE_ENV !== 'production') {
  globalForRedis.redis = redis
} else {
  globalForRedis.redis = redis
}

/**
 * 通用缓存包装：先读缓存，miss 时执行 fn 并写入缓存。
 * 不设置 TTL，依赖 Redis maxmemory-policy=allkeys-lfu 按访问频率淘汰。
 */
export async function cacheWrap<T>(
  key: string,
  fn: () => Promise<T>,
): Promise<T> {
  try {
    const cached = await redis.get(key)
    if (cached !== null) {
      return JSON.parse(cached) as T
    }
  } catch (err) {
    console.warn('[Redis] get failed, fallback to db:', key, err)
  }

  const data = await fn()

  try {
    await redis.set(key, JSON.stringify(data))
  } catch (err) {
    console.warn('[Redis] set failed:', key, err)
  }

  return data
}

/**
 * 删除一个或多个缓存 key（写操作后主动失效）
 */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    await redis.del(keys)
  } catch (err) {
    console.warn('[Redis] del failed:', keys, err)
  }
}

/**
 * 按前缀批量删除缓存 key（使用 SCAN，避免阻塞）
 */
export async function cacheInvalidateByPattern(pattern: string): Promise<void> {
  try {
    let cursor = '0'
    do {
      const reply = await redis.scan(cursor, { MATCH: pattern, COUNT: 100 })
      cursor = String(reply.cursor)
      if (reply.keys.length > 0) {
        await redis.del(reply.keys)
      }
    } while (cursor !== '0')
  } catch (err) {
    console.warn('[Redis] scan/del failed:', pattern, err)
  }
}
