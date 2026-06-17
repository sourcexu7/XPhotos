/**
 * 图形验证码模块
 * 
 * 防爆破措施：
 * 1. 验证码有效期 5 分钟
 * 2. 每个验证码只能使用一次
 * 3. 同一 IP 每分钟最多生成 10 次验证码
 * 4. 同一 IP 登录失败 5 次后锁定 15 分钟
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

// Redis 客户端（延迟初始化）
let redisClient: ReturnType<typeof createClient> | null = null

async function getRedisClient() {
  if (!redisClient && process.env.REDIS_URL) {
    redisClient = createClient({
      url: process.env.REDIS_URL,
      password: process.env.REDIS_PASSWORD,
    })
    redisClient.on('error', (err) => {
      console.warn('[Captcha Redis] error:', err?.message ?? err)
    })
    try {
      await redisClient.connect()
    } catch (err) {
      console.warn('[Captcha Redis] connect failed:', err)
      redisClient = null
    }
  }
  return redisClient
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
    const client = await getRedisClient()
    if (!client) return false
    const count = await client.get(key)
    if (count && parseInt(count) >= CAPTCHA_CONFIG.MAX_GENERATE_PER_MINUTE) {
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
    const client = await getRedisClient()
    if (!client) return
    const exists = await client.exists(key)
    if (exists) {
      await client.incr(key)
    } else {
      await client.setEx(key, 60, '1')
    }
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
    const client = await getRedisClient()
    if (!client) return { locked: false }
    const ttl = await client.ttl(key)
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
    const client = await getRedisClient()
    if (!client) return { attempts: 0, locked: false }
    
    const exists = await client.exists(key)
    let attempts = 1
    
    if (exists) {
      attempts = await client.incr(key)
    } else {
      await client.setEx(key, CAPTCHA_CONFIG.LOCK_TIME, '1')
    }
    
    // 如果达到最大失败次数，设置锁定
    if (attempts >= CAPTCHA_CONFIG.MAX_LOGIN_ATTEMPTS) {
      // 重置过期时间为锁定时间
      await client.expire(key, CAPTCHA_CONFIG.LOCK_TIME)
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
    const client = await getRedisClient()
    if (client) await client.del(key)
  } catch {
    // ignore
  }
}

/**
 * 生成验证码并存储
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
  
  // 存储验证码
  const key = CAPTCHA_KEY_PREFIX + id
  try {
    const client = await getRedisClient()
    if (!client) return null
    await client.setEx(key, CAPTCHA_CONFIG.EXPIRE_TIME, text.toUpperCase())
    await incrementGenerateCount(ip)
    return { id, svg }
  } catch {
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
    const client = await getRedisClient()
    if (!client) return { valid: false, reason: '验证服务不可用' }
    
    // 检查是否已使用
    const used = await client.exists(usedKey)
    if (used) {
      return { valid: false, reason: '验证码已使用' }
    }
    
    // 获取存储的验证码
    const storedCode = await client.get(key)
    if (!storedCode) {
      return { valid: false, reason: '验证码已过期' }
    }
    
    // 验证
    if (storedCode.toUpperCase() === code.toUpperCase()) {
      // 标记为已使用
      await client.setEx(usedKey, CAPTCHA_CONFIG.EXPIRE_TIME, '1')
      // 删除原验证码
      await client.del(key)
      return { valid: true }
    }
    
    return { valid: false, reason: '验证码错误' }
  } catch {
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
