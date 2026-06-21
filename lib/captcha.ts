/**
 * 图形验证码模块
 *
 * 防爆破措施：
 * 1. 验证码有效期 5 分钟
 * 2. 每个验证码只能使用一次
 * 3. 同一 IP 每分钟最多生成 10 次验证码
 * 4. 同一 IP 登录失败 5 次后锁定 15 分钟
 *
 * 存储策略：
 * - 优先使用 Redis（配置了 REDIS_URL 且未显式禁用）
 * - Redis 不可用或未配置时，自动回退到进程内内存存储
 *   （便于单机部署 / 开发环境无 Redis 时仍能正常使用）
 */

import 'server-only'
import { createClient } from 'redis'

// 验证码配置
const CAPTCHA_CONFIG = {
  // 验证码有效期（秒）
  EXPIRE_TIME: 5 * 60,
  // 验证码长度
  LENGTH: 5,
  // 同一 IP 每分钟最大生成次数
  MAX_GENERATE_PER_MINUTE: 10,
  // 登录失败最大次数
  MAX_LOGIN_ATTEMPTS: 5,
  // 登录锁定时间（秒）
  LOCK_TIME: 15 * 60,
}

// Redis key 前缀
const CAPTCHA_KEY_PREFIX = 'captcha:'
const CAPTCHA_USED_KEY_PREFIX = 'captcha_used:'
const RATE_LIMIT_KEY_PREFIX = 'captcha_rate:'
const LOGIN_ATTEMPTS_KEY_PREFIX = 'login_attempts:'

// ============= Redis 客户端（延迟初始化） =============
let redisClient: ReturnType<typeof createClient> | null = null
let redisResolved = false // 是否已完成首次解析（成功或失败）

async function getRedisClient() {
  if (redisResolved) return redisClient

  if (!process.env.REDIS_URL || process.env.REDIS_DISABLED === 'true' || process.env.REDIS_DISABLED === '1') {
    redisResolved = true
    redisClient = null
    console.log('[Captcha] Redis disabled or REDIS_URL not configured, using in-memory store')
    return null
  }

  try {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
      socket: {
        reconnectStrategy: (retries) => Math.min(retries * 100, 3000),
        connectTimeout: 5000,
      },
    })
    redisClient.on('error', (err) => {
      console.error('[Captcha Redis] client error, falling back to in-memory store:', err?.message ?? err)
      // 出错时标记为已解析，避免每次请求都重新尝试连接，减少资源浪费
      redisResolved = true
      redisClient = null
    })
    await redisClient.connect()
    console.log('[Captcha Redis] successfully connected, using Redis for captcha storage')
    redisResolved = true
    return redisClient
  } catch (err) {
    console.error('[Captcha Redis] connect failed, falling back to in-memory store:', err instanceof Error ? err.message : err)
    console.error('[Captcha Redis] Please verify: REDIS_URL format, network connectivity, firewall rules, and password (if required)')
    redisClient = null
    redisResolved = true
    return null
  }
}

// ============= 内存存储（Redis 不可用时的回退方案） =============
interface InMemoryEntry {
  value: string
  expireAt: number // 毫秒时间戳
}

// 每个进程一个单例 Map
const inMemoryStore = new Map<string, InMemoryEntry>()

function nowMs(): number {
  return Date.now()
}

function inMemoryGet(key: string): string | null {
  const entry = inMemoryStore.get(key)
  if (!entry) return null
  if (entry.expireAt < nowMs()) {
    inMemoryStore.delete(key)
    return null
  }
  return entry.value
}

function inMemorySetEx(key: string, ttlSec: number, value: string): void {
  inMemoryStore.set(key, { value, expireAt: nowMs() + ttlSec * 1000 })
}

function inMemoryExists(key: string): boolean {
  const v = inMemoryGet(key)
  return v !== null
}

function inMemoryDel(key: string): void {
  inMemoryStore.delete(key)
}

function inMemoryIncr(key: string, ttlSec: number): number {
  const existing = inMemoryGet(key)
  if (existing === null) {
    inMemorySetEx(key, ttlSec, '1')
    return 1
  }
  const next = parseInt(existing, 10) + 1
  // 保留原剩余 TTL：不更改已存在的 expireAt
  const entry = inMemoryStore.get(key)!
  entry.value = String(next)
  return next
}

function inMemoryTtl(key: string): number {
  const entry = inMemoryStore.get(key)
  if (!entry) return -2
  const remain = entry.expireAt - nowMs()
  if (remain <= 0) return -1
  return Math.ceil(remain / 1000)
}

function inMemoryExpire(key: string, ttlSec: number): boolean {
  const entry = inMemoryStore.get(key)
  if (!entry) return false
  entry.expireAt = nowMs() + ttlSec * 1000
  return true
}

// 统一存储接口
async function storeGet(key: string): Promise<string | null> {
  const client = await getRedisClient()
  if (client) return client.get(key)
  return inMemoryGet(key)
}

async function storeSetEx(key: string, ttlSec: number, value: string): Promise<void> {
  const client = await getRedisClient()
  if (client) {
    await client.setEx(key, ttlSec, value)
    return
  }
  inMemorySetEx(key, ttlSec, value)
}

async function storeExists(key: string): Promise<boolean> {
  const client = await getRedisClient()
  if (client) {
    const n = await client.exists(key)
    return n > 0
  }
  return inMemoryExists(key)
}

async function storeDel(key: string): Promise<void> {
  const client = await getRedisClient()
  if (client) {
    await client.del(key)
    return
  }
  inMemoryDel(key)
}

async function storeIncr(key: string, ttlSec: number): Promise<number> {
  const client = await getRedisClient()
  if (client) {
    const exists = await client.exists(key)
    if (exists) return client.incr(key)
    await client.setEx(key, ttlSec, '1')
    return 1
  }
  return inMemoryIncr(key, ttlSec)
}

async function storeTtl(key: string): Promise<number> {
  const client = await getRedisClient()
  if (client) return client.ttl(key)
  return inMemoryTtl(key)
}

async function storeExpire(key: string, ttlSec: number): Promise<void> {
  const client = await getRedisClient()
  if (client) {
    await client.expire(key, ttlSec)
    return
  }
  inMemoryExpire(key, ttlSec)
}

/**
 * 生成随机验证码字符串
 */
function generateCaptchaText(length: number): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // 排除易混淆字符 I, O, 0, 1, L
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

/**
 * 生成 SVG 验证码图片
 */
export function generateCaptchaSvg(text: string): string {
  const width = 120
  const height = 40
  
  // 生成随机颜色
  const randomColor = (min: number, max: number): string => {
    const r = Math.floor(Math.random() * (max - min) + min)
    const g = Math.floor(Math.random() * (max - min) + min)
    const b = Math.floor(Math.random() * (max - min) + min)
    return `rgb(${r},${g},${b})`
  }
  
  // 生成干扰线
  let lines = ''
  for (let i = 0; i < 4; i++) {
    const x1 = Math.floor(Math.random() * width)
    const y1 = Math.floor(Math.random() * height)
    const x2 = Math.floor(Math.random() * width)
    const y2 = Math.floor(Math.random() * height)
    lines += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${randomColor(100, 200)}" stroke-width="1"/>`
  }
  
  // 生成噪点
  let dots = ''
  for (let i = 0; i < 50; i++) {
    const x = Math.floor(Math.random() * width)
    const y = Math.floor(Math.random() * height)
    dots += `<circle cx="${x}" cy="${y}" r="1" fill="${randomColor(100, 200)}"/>`
  }
  
  // 生成文字
  let textElements = ''
  const colors = ['#333', '#444', '#555', '#666']
  for (let i = 0; i < text.length; i++) {
    const x = 20 + i * 20
    const y = 25 + Math.floor(Math.random() * 10 - 5)
    const rotate = Math.floor(Math.random() * 30 - 15)
    const color = colors[Math.floor(Math.random() * colors.length)]
    textElements += `<text x="${x}" y="${y}" fill="${color}" font-size="20" font-weight="bold" font-family="Arial, sans-serif" transform="rotate(${rotate} ${x} ${y})">${text[i]}</text>`
  }
  
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <rect width="100%" height="100%" fill="#f0f0f0"/>
    ${lines}
    ${dots}
    ${textElements}
  </svg>`
}

/**
 * 检查 IP 是否被限制生成验证码
 */
export async function isRateLimited(ip: string): Promise<boolean> {
  const key = RATE_LIMIT_KEY_PREFIX + ip
  try {
    const count = await storeGet(key)
    if (count && parseInt(count, 10) >= CAPTCHA_CONFIG.MAX_GENERATE_PER_MINUTE) {
      return true
    }
    return false
  } catch {
    return false
  }
}

/**
 * 记录验证码生成次数
 */
async function incrementGenerateCount(ip: string): Promise<void> {
  const key = RATE_LIMIT_KEY_PREFIX + ip
  try {
    await storeIncr(key, 60)
  } catch {
    // ignore
  }
}

/**
 * 检查 IP 是否被锁定（登录失败次数过多）
 */
export async function isLoginLocked(ip: string): Promise<{ locked: boolean; remainingTime?: number }> {
  const key = LOGIN_ATTEMPTS_KEY_PREFIX + ip
  try {
    const ttl = await storeTtl(key)
    if (ttl > 0) {
      return { locked: true, remainingTime: ttl }
    }
    return { locked: false }
  } catch {
    return { locked: false }
  }
}

/**
 * 记录登录失败次数
 */
export async function recordLoginFailure(ip: string): Promise<{ attempts: number; locked: boolean }> {
  const key = LOGIN_ATTEMPTS_KEY_PREFIX + ip
  try {
    const attempts = await storeIncr(key, CAPTCHA_CONFIG.LOCK_TIME)

    if (attempts >= CAPTCHA_CONFIG.MAX_LOGIN_ATTEMPTS) {
      await storeExpire(key, CAPTCHA_CONFIG.LOCK_TIME)
      return { attempts, locked: true }
    }

    return { attempts, locked: false }
  } catch {
    return { attempts: 0, locked: false }
  }
}

/**
 * 清除登录失败记录（登录成功后调用）
 */
export async function clearLoginAttempts(ip: string): Promise<void> {
  const key = LOGIN_ATTEMPTS_KEY_PREFIX + ip
  try {
    await storeDel(key)
  } catch {
    // ignore
  }
}

/**
 * 生成验证码并存储
 *
 * 注意：此函数保证总是尝试生成验证码；仅当 isRateLimited 命中或存储失败时才返回 null。
 */
export async function generateCaptcha(ip: string): Promise<{ id: string; svg: string } | null> {
  // 检查是否被限制
  if (await isRateLimited(ip)) {
    return null
  }

  // 生成验证码
  const id = Math.random().toString(36).substring(2, 15)
  const text = generateCaptchaText(CAPTCHA_CONFIG.LENGTH)
  const svg = generateCaptchaSvg(text)

  // 存储验证码（Redis 或内存存储，二者之一）
  const key = CAPTCHA_KEY_PREFIX + id
  try {
    await storeSetEx(key, CAPTCHA_CONFIG.EXPIRE_TIME, text.toUpperCase())
    await incrementGenerateCount(ip)
    return { id, svg }
  } catch (err) {
    console.warn('[Captcha] generate failed:', err instanceof Error ? err.message : err)
    return null
  }
}

/**
 * 验证验证码
 */
export async function verifyCaptcha(id: string, code: string): Promise<{ valid: boolean; reason?: string }> {
  if (!id || !code) {
    return { valid: false, reason: '验证码不能为空' }
  }

  const key = CAPTCHA_KEY_PREFIX + id
  const usedKey = CAPTCHA_USED_KEY_PREFIX + id

  try {
    const used = await storeExists(usedKey)
    if (used) {
      return { valid: false, reason: '验证码已使用' }
    }

    const storedCode = await storeGet(key)
    if (!storedCode) {
      return { valid: false, reason: '验证码已过期' }
    }

    if (storedCode.toUpperCase() === code.toUpperCase()) {
      await storeSetEx(usedKey, CAPTCHA_CONFIG.EXPIRE_TIME, '1')
      await storeDel(key)
      return { valid: true }
    }

    return { valid: false, reason: '验证码错误' }
  } catch (err) {
    console.warn('[Captcha] verify failed:', err instanceof Error ? err.message : err)
    return { valid: false, reason: '验证失败' }
  }
}

/**
 * 获取验证码配置信息（用于前端显示）
 */
export function getCaptchaConfig() {
  return {
    length: CAPTCHA_CONFIG.LENGTH,
    expireTime: CAPTCHA_CONFIG.EXPIRE_TIME,
    maxAttempts: CAPTCHA_CONFIG.MAX_LOGIN_ATTEMPTS,
    lockTime: CAPTCHA_CONFIG.LOCK_TIME,
  }
}
