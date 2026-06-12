import { SignJWT, jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-should-be-long-and-random'
const key = new TextEncoder().encode(SECRET_KEY)

export async function signJWT(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d') // Token 有效期 7 天
    .sign(key)
}

export type JWTVerifyResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: 'expired' | 'invalid'; message: string }

export async function verifyJWT(token: string): Promise<JWTVerifyResult> {
  try {
    const { payload } = await jwtVerify(token, key)
    return { ok: true, payload: payload as Record<string, unknown> }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    // jose 抛出的错误类里，过期会带有 "expired" 字样
    if (msg.toLowerCase().includes('expired')) {
      return { ok: false, reason: 'expired', message: 'Token expired' }
    }
    return { ok: false, reason: 'invalid', message: 'Invalid token' }
  }
}
