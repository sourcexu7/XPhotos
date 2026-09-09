import { Hono } from 'hono'
import { generateCaptcha, isRateLimited, isLoginLocked } from '~/lib/captcha'

const app = new Hono()

// 验证码接口禁止任何缓存：确保每次请求都是全新验证码，已用/过期状态实时生效
const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
  Pragma: 'no-cache',
}

// 获取客户端 IP
function getClientIp(c: any): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
         c.req.header('x-real-ip') ||
         'unknown'
}

/**
 * 生成验证码
 * GET /api/v1/captcha
 */
app.get('/', async (c) => {
  const clientIp = getClientIp(c)
  
  // 检查是否被限制
  if (await isRateLimited(clientIp)) {
    console.log(`[Captcha] Rate limited for IP ${clientIp}`)
    return c.json({
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后再试'
    }, 429, NO_STORE_HEADERS)
  }

  // 生成验证码
  const startTime = Date.now()
  const result = await generateCaptcha(clientIp)
  const duration = Date.now() - startTime

  if (!result) {
    console.error(`[Captcha] Generate FAILED for IP ${clientIp} after ${duration}ms`)
    return c.json({
      code: 'GENERATE_FAILED',
      message: '验证码生成失败，请稍后重试'
    }, 500, NO_STORE_HEADERS)
  }

  console.log(`[Captcha] Generated new captcha (id=${result.id.substring(0,8)}..., ip=${clientIp}, duration=${duration}ms)`)

  // 返回 SVG 图片和 ID
  return c.json({
    id: result.id,
    svg: result.svg,
  }, 200, NO_STORE_HEADERS)
})

/**
 * 检查登录锁定状态
 * GET /api/v1/captcha/lock-status
 */
app.get('/lock-status', async (c) => {
  const clientIp = getClientIp(c)
  const lockStatus = await isLoginLocked(clientIp)
  
  return c.json({
    locked: lockStatus.locked,
    remainingTime: lockStatus.remainingTime,
  }, 200, NO_STORE_HEADERS)
})

export default app
