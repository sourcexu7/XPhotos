import 'server-only'

import { createClient } from 'redis'

type RedisClient = ReturnType<typeof createClient>

const REDIS_DISABLED =
  process.env.REDIS_DISABLED === 'true' ||
  process.env.REDIS_DISABLED === '1' ||
  !process.env.REDIS_URL

const globalForRedis = globalThis as unknown as {
  redis: RedisClient | undefined
  redisConnecting: boolean
}

function makeClient(): RedisClient {
  const client = createClient({
    url: process.env.REDIS_URL,
    password: process.env.REDIS_PASSWORD,
    socket: {
      reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
      connectTimeout: 5000,
    },
  })
  client.on('error', (err) => {
    // 只记录，绝不抛异常，避免未处理的 AggregateError 让进程/worker 退出
    console.warn('[Redis] client error (falling back to no-cache):', err?.message ?? err)
  })
  return client
}

// 延迟连接：只在第一次实际使用时才建立连接
// 构建阶段（next build）import 此模块不触发任何网络请求
async function getClient(): Promise<RedisClient | null> {
  if (REDIS_DISABLED) return null
  if (!globalForRedis.redis) {
    globalForRedis.redis = makeClient()
  }
  const client = globalForRedis.redis
  if (!client.isOpen && !client.isReady) {
    try {
      await client.connect()
    } catch (err) {
      console.warn('[Redis] connect failed, fallback to no-cache:', err?.message ?? err)
      return null
    }
  }
  return client
}

/**
 * 通用缓存包装：先读缓存，miss 时执行 fn 并写入。
 * 不设 TTL，依赖 allkeys-lfu 按访问频率淘汰。
 * Redis 不可用时静默 fallback，不影响正常请求。
 */
export async function cacheWrap<T>(key: string, fn: () => Promise<T>): Promise<T> {
  try {
    const client = await getClient()
    if (client) {
      const cached = await client.get(key)
      if (cached !== null) return JSON.parse(cached) as T
    }
  } catch (err) {
    console.warn('[Redis] get failed, fallback to db:', key, err?.message ?? err)
  }

  const data = await fn()

  try {
    const client = await getClient()
    if (client) await client.set(key, JSON.stringify(data))
  } catch (err) {
    console.warn('[Redis] set failed:', key, err?.message ?? err)
  }

  return data
}

/**
 * 删除一个或多个缓存 key（写操作后主动失效）
 */
export async function cacheInvalidate(...keys: string[]): Promise<void> {
  if (keys.length === 0) return
  try {
    const client = await getClient()
    if (client) await client.del(keys)
  } catch (err) {
    console.warn('[Redis] del failed:', keys, err?.message ?? err)
  }
}

/**
 * 按前缀批量删除缓存 key（SCAN，避免阻塞）
 */
export async function cacheInvalidateByPattern(pattern: string): Promise<void> {
  try {
    const client = await getClient()
    if (!client) return
    let cursor = '0'
    do {
      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 })
      cursor = String(reply.cursor)
      if (reply.keys.length > 0) {
        await client.del(reply.keys)
      }
    } while (cursor !== '0')
  } catch (err) {
    console.warn('[Redis] scan/del failed:', pattern, err?.message ?? err)
  }
}
