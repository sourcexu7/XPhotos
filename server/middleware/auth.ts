import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJWT } from '~/lib/jwt'
import { HTTPException } from 'hono/http-exception'

export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  let token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null

  if (!token) {
    token = getCookie(c, 'auth_token')
  }

  if (!token) {
    throw new HTTPException(401, { message: 'Unauthorized: No token provided' })
  }

  const payload = await verifyJWT(token)

  if (!payload) {
    throw new HTTPException(401, { message: 'Unauthorized: Invalid token' })
  }

  c.set('user', payload)

  await next()
}
