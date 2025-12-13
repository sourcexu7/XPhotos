import { Hono } from 'hono'
import { setCookie, deleteCookie } from 'hono/cookie'
import { db } from '~/lib/db'
import { signJWT } from '~/lib/jwt'
import bcrypt from 'bcryptjs'
import { HTTPException } from 'hono/http-exception'
import { jwtAuth } from './middleware/auth'

const app = new Hono()

app.post('/login', async (c) => {
  const { email, password } = await c.req.json()

  if (!email || !password) {
    throw new HTTPException(400, { message: 'Email and password are required' })
  }

  const user = await db.user.findUnique({
    where: { email },
    include: { accounts: true }
  })

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

export default app
