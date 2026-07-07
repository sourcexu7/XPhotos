// 按业务前缀清理 Redis 缓存（XPhotos 专用，避免 FLUSHALL 误伤其他业务）
import { createClient } from 'redis'

const REDIS_URL = process.env.REDIS_URL || 'redis://:756357Wx.@1.15.172.217:6379/0'
const REDIS_PASSWORD = process.env.REDIS_PASSWORD

// XPhotos 业务使用的缓存 key 前缀（来自 lib/db/query/* 与 server/*）
const PATTERNS = [
  'images:*',
  'albums:*',
  'tags:*',
  'configs:*',
  'public:*',
  'guides:*',
  'guide:*',
]

async function main() {
  const client = createClient({
    url: REDIS_URL,
    password: REDIS_PASSWORD,
    socket: { connectTimeout: 10000 },
  })

  client.on('error', (err) => {
    console.warn('[Redis] client error:', err?.message ?? err)
  })

  try {
    await client.connect()
  } catch (err) {
    console.error('连接 Redis 失败:', err instanceof Error ? err.message : err)
    process.exit(1)
  }

  console.log(`已连接 Redis: ${REDIS_URL.replace(/\/\/:[^@]+@/, '\/\/:***@')}`)

  // 清理前先看一下各前缀的 key 数量（便于对比）
  for (const pattern of PATTERNS) {
    let cursor = '0'
    let countBefore = 0
    do {
      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 })
      cursor = String(reply.cursor)
      countBefore += reply.keys.length
    } while (cursor !== '0')
    console.log(`  [清理前] ${pattern} => ${countBefore} 个 key`)
  }

  let total = 0
  for (const pattern of PATTERNS) {
    let cursor = '0'
    let count = 0
    do {
      const reply = await client.scan(cursor, { MATCH: pattern, COUNT: 100 })
      cursor = String(reply.cursor)
      if (reply.keys.length > 0) {
        count += reply.keys.length
        await client.del(reply.keys)
      }
    } while (cursor !== '0')
    console.log(`  [已清理] ${pattern} => 删除 ${count} 个 key`)
    total += count
  }

  console.log(`\n共清理 ${total} 个 XPhotos 业务 key，完成。`)
  await client.quit()
}

main().catch((err) => {
  console.error('执行失败:', err)
  process.exit(1)
})
