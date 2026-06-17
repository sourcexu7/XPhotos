import { SignJWT, jwtVerify } from 'jose'

let cachedKey: Uint8Array | null = null

function getKey(): Uint8Array {
  if (cachedKey) return cachedKey
  const SECRET_KEY = process.env.JWT_SECRET || ''
  if (!SECRET_KEY) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  cachedKey = new TextEncoder().encode(SECRET_KEY)
  return cachedKey
}

export async function signJWT(payload: Record<string, unknown>) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getKey())
}

export type JWTVerifyResult =
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; reason: 'expired' | 'invalid'; message: string }

export async function verifyJWT(token: string): Promise<JWTVerifyResult> {
  try {
    const { payload } = await jwtVerify(token, getKey())
    return { ok: true, payload: payload as Record<string, unknown> }
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error)
    if (msg.toLowerCase().includes('expired')) {
      return { ok: false, reason: 'expired', message: 'Token expired' }
    }
    return { ok: false, reason: 'invalid', message: 'Invalid token' }
  }
}
