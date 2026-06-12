import { Context, Next } from 'hono'
import { getCookie } from 'hono/cookie'
import { verifyJWT } from '~/lib/jwt'

/**
 * JWT 鉴权中间件。
 * 未通过鉴权时直接返回结构化的 JSON，不再抛 HTTPException，
 * 便于前端根据 code 做差异化处理（跳转登录 / 提示重新登录等）。
 */
export async function jwtAuth(c: Context, next: Next) {
  const authHeader = c.req.header('Authorization')
  const token = authHeader?.startsWith('Bearer ')
    ? authHeader.slice(7)
    : (getCookie(c, 'auth_token') ?? null)

  if (!token) {
    return c.json(
      { code: 'AUTH_TOKEN_MISSING', message: '未登录，请先登录后再操作' },
      401,
    )
  }

  const result = await verifyJWT(token)

  if (!result.ok) {
    if (result.reason === 'expired') {
      return c.json(
        { code: 'AUTH_TOKEN_EXPIRED', message: '登录已过期，请重新登录' },
        401,
      )
    }
    return c.json(
      { code: 'AUTH_TOKEN_INVALID', message: '登录凭证无效，请重新登录' },
      401,
    )
  }

  c.set('user', result.payload)

  await next()
}
