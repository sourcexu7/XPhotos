import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { db } from '~/lib/db'
import { signJWT } from '~/lib/jwt'
import bcrypt from 'bcryptjs'
import { HTTPException } from 'hono/http-exception'
import { jwtAuth } from './middleware/auth'

const app = new Hono()

app.post('/login', async (c) => {
  const { email, password, username } = await c.req.json()
  const identifier = email || username // 支持邮箱或用户名

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
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const account = user.accounts.find(acc => acc.password)

  if (!account || !account.password) {
     throw new HTTPException(401, { message: 'Password login not supported for this user' })
  }

  const isValid = await bcrypt.compare(password, account.password)

  if (!isValid) {
    throw new HTTPException(401, { message: 'Invalid credentials' })
  }

  const token = await signJWT({
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image
  })

  setCookie(c, 'auth_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
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
  const user = c.get('user')
  return c.json({ user })
})

app.post('/change-password', jwtAuth, async (c) => {
  const { currentPassword, newPassword } = await c.req.json()
  const user = c.get('user')

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
  const user = c.get('user')

  await db.user.update({
    where: { id: user.id },
    data: { image: image || null, updatedAt: new Date() }
  })

  return c.json({ message: 'User updated successfully' })
})

export default app
