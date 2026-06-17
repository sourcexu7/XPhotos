import { Hono } from 'hono'
import { generateCaptcha, isRateLimited, isLoginLocked } from '~/lib/captcha'

const app = new Hono()

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
    return c.json({
      code: 'RATE_LIMITED',
      message: '请求过于频繁，请稍后再试'
    }, 429)
  }
  
  // 生成验证码
  const result = await generateCaptcha(clientIp)
  
  if (!result) {
    return c.json({
      code: 'GENERATE_FAILED',
      message: '验证码生成失败'
    }, 500)
  }
  
  // 返回 SVG 图片和 ID
  return c.json({
    id: result.id,
    svg: result.svg,
  })
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
  })
})

export default app
