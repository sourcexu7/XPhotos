import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { db } from '~/lib/db'
import { signJWT } from '~/lib/jwt'
import bcrypt from 'bcryptjs'
import { HTTPException } from 'hono/http-exception'
import { jwtAuth } from './middleware/auth'
import { isLoginLocked, recordLoginFailure, clearLoginAttempts, verifyCaptcha } from '~/lib/captcha'

const app = new Hono()

// 获取客户端 IP（与 captcha 路由保持同一套取值逻辑）
function getClientIp(c: any): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
         c.req.header('x-real-ip') ||
         'unknown'
}

// 验证码失败原因 → 对外错误码（前端据此映射 i18n 文案）
function captchaErrorCode(reason?: string): string {
  switch (reason) {
    case 'empty': return 'CAPTCHA_REQUIRED'
    case 'used': return 'CAPTCHA_USED'
    case 'expired': return 'CAPTCHA_EXPIRED'
    case 'mismatch': return 'CAPTCHA_MISMATCH'
    default: return 'CAPTCHA_VERIFY_FAILED'
  }
}

app.post('/login', async (c) => {
  const { email, password, username, captchaId, captchaCode } = await c.req.json()
  const identifier = email || username // 支持邮箱或用户名
  const clientIp = getClientIp(c)

  if (!identifier || !password) {
    throw new HTTPException(400, { message: 'Username/Email and password are required' })
  }

  // 登录锁定检查：同一 IP 连续失败 5 次锁定 15 分钟（防爆破）
  const lockStatus = await isLoginLocked(clientIp)
  if (lockStatus.locked) {
    return c.json({
      message: 'LOGIN_LOCKED',
      remainingTime: lockStatus.remainingTime ?? 0,
    }, 429, { 'Cache-Control': 'no-store' })
  }

  // 验证码校验：先于密码校验，一次性使用（校验通过即作废，防重放）
  const captchaResult = await verifyCaptcha(
    String(captchaId ?? '').trim(),
    String(captchaCode ?? '').trim(),
  )
  if (!captchaResult.valid) {
    return c.json({
      message: captchaErrorCode(captchaResult.reason),
    }, 400, { 'Cache-Control': 'no-store' })
  }

  // 尝试通过邮箱或用户名查找用户
  let user = await db.user.findUnique({
    where: { email: identifier },
    include: { accounts: true }
  })

  // 如果通过邮箱没找到，尝试通过用户名查找
  if (!user) {
    user = await db.user.findUnique({
      where: { name: identifier },
      include: { accounts: true }
    })
  }

  if (!user) {
    await recordLoginFailure(clientIp)
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const account = user.accounts.find(acc => acc.password)

  if (!account || !account.password) {
    await recordLoginFailure(clientIp)
     throw new HTTPException(401, { message: 'Password login not supported for this user' })
  }

  const isValid = await bcrypt.compare(password, account.password)

  if (!isValid) {
    await recordLoginFailure(clientIp)
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  // 登录成功：清除该 IP 的失败记录
  await clearLoginAttempts(clientIp)

  const token = await signJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image
  })

  setCookie(c, 'auth_token', token, {
    httpOnly: true,    
    sameSite: 'Lax',
    maxAge: 60 * 60 * 24 * 7,
    path: '/'
  })

  return c.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image
    },
    token
  })
})

app.post('/logout', (c) => {
  deleteCookie(c, 'auth_token')
  return c.json({ message: 'Logged out successfully' })
})

app.get('/me', jwtAuth, (c) => {
  const user = (c.var as any).user as { id: string }
  return c.json({ user })
})

app.post('/change-password', jwtAuth, async (c) => {
  const { currentPassword, newPassword } = await c.req.json()
  const user = (c.var as any).user as { id: string }

  if (!currentPassword || !newPassword) {
    throw new HTTPException(400, { message: 'Current password and new password are required' })
  }

  if (newPassword.length < 8) {
    throw new HTTPException(400, { message: 'New password must be at least 8 characters' })
  }

  const dbUser = await db.user.findUnique({
    where: { id: user.id },
    include: { accounts: true }
  })

  if (!dbUser) {
    throw new HTTPException(404, { message: 'User not found' })
  }

  const account = dbUser.accounts.find(acc => acc.password)

  if (!account || !account.password) {
    throw new HTTPException(400, { message: 'Password account not found' })
  }

  const isValid = await bcrypt.compare(currentPassword, account.password)

  if (!isValid) {
    throw new HTTPException(401, { message: 'Current password is incorrect' })
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10)

  await db.account.update({
    where: { id: account.id },
    data: { password: hashedPassword, updatedAt: new Date() }
  })

  return c.json({ message: 'Password updated successfully' })
})

app.post('/update-user', jwtAuth, async (c) => {
  const { image } = await c.req.json()
  const user = (c.var as any).user as { id: string }

  await db.user.update({
    where: { id: user.id },
    data: { image: image || null, updatedAt: new Date() }
  })

  return c.json({ message: 'User updated successfully' })
})

export default app
