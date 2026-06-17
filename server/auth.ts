import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { db } from '~/lib/db'
import { signJWT } from '~/lib/jwt'
import bcrypt from 'bcryptjs'
import { HTTPException } from 'hono/http-exception'
import { jwtAuth } from './middleware/auth'
import {
  verifyCaptcha,
  isLoginLocked,
  recordLoginFailure,
  clearLoginAttempts,
  getCaptchaConfig,
} from '~/lib/captcha'

const CAPTCHA_CONFIG = getCaptchaConfig()

const app = new Hono()

// 获取客户端 IP
function getClientIp(c: any): string {
  return c.req.header('x-forwarded-for')?.split(',')[0]?.trim() ||
         c.req.header('x-real-ip') ||
         'unknown'
}

app.post('/login', async (c) => {
  const { email, password, username, captchaId, captchaCode } = await c.req.json()
  const identifier = email || username // 支持邮箱或用户名
  const clientIp = getClientIp(c)

  // 检查是否被锁定
  const lockStatus = await isLoginLocked(clientIp)
  if (lockStatus.locked) {
    throw new HTTPException(429, {
      message: `登录失败次数过多，请 ${Math.ceil((lockStatus.remainingTime || 0) / 60)} 分钟后再试`
    })
  }

  // 验证验证码
  if (!captchaId || !captchaCode) {
    throw new HTTPException(400, { message: '请输入验证码' })
  }

  const captchaResult = await verifyCaptcha(captchaId, captchaCode)
  if (!captchaResult.valid) {
    throw new HTTPException(400, { message: captchaResult.reason || '验证码错误' })
  }

  if (!identifier || !password) {
    throw new HTTPException(400, { message: 'Username/Email and password are required' })
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
    // 记录失败
    await recordLoginFailure(clientIp)
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const account = user.accounts.find(acc => acc.password)

  if (!account || !account.password) {
     throw new HTTPException(401, { message: 'Password login not supported for this user' })
  }

  const isValid = await bcrypt.compare(password, account.password)

  if (!isValid) {
    // 记录失败
    const result = await recordLoginFailure(clientIp)
    if (result.locked) {
      throw new HTTPException(429, {
        message: `登录失败次数过多，账户已被锁定 ${Math.ceil(CAPTCHA_CONFIG.lockTime / 60)} 分钟`
      })
    }
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  // 登录成功，清除失败记录
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
