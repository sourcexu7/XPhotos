import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-should-be-long-and-random'
const key = new TextEncoder().encode(SECRET_KEY)

const GLOBAL_LIMIT = Number(process.env.RATE_LIMIT_GLOBAL || 60) // 每分钟全局默认限制
const SENSITIVE_LIMIT = Number(process.env.RATE_LIMIT_SENSITIVE || 20) // 敏感接口默认限制
const WINDOW_MS = 60_000
const IP_WHITELIST = (process.env.RATE_LIMIT_WHITELIST || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

type Counter = {
  count: number
  resetAt: number
}

const globalBuckets = new Map<string, Counter>()
const sensitiveBuckets = new Map<string, Counter>()

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0]?.trim() || 'unknown'
  }
  const realIp = req.headers.get('x-real-ip')
  if (realIp) return realIp
  // Next.js 在部分环境下提供 ip 字段
  // @ts-ignore
  if (req.ip) return (req as any).ip as string
  return 'unknown'
}

function isSensitivePath(pathname: string): boolean {
  if (pathname.startsWith('/api/v1/auth')) return true
  if (pathname.startsWith('/api/v1/file')) return true
  if (pathname.startsWith('/api/v1/images')) return true
  if (pathname.startsWith('/api/v1/albums')) return true
  if (pathname.startsWith('/api/v1/settings')) return true
  if (pathname.startsWith('/api/v1/analytics')) return true
  if (pathname.startsWith('/admin')) return true
  return false
}

function checkRateLimit(map: Map<string, Counter>, keyStr: string, limit: number) {
  const now = Date.now()
  const bucket = map.get(keyStr)

  if (!bucket || bucket.resetAt <= now) {
    map.set(keyStr, { count: 1, resetAt: now + WINDOW_MS })
    return { allowed: true, remaining: limit - 1, resetAt: now + WINDOW_MS }
  }

  if (bucket.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: bucket.resetAt }
  }

  bucket.count += 1
  return { allowed: true, remaining: limit - bucket.count, resetAt: bucket.resetAt }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const ip = getClientIp(request)

  const isWhitelisted = IP_WHITELIST.includes(ip)

  // 速率限制（白名单直接跳过）
  if (!isWhitelisted) {
    // 全局限制
    const globalKey = `${ip}:global`
    const globalResult = checkRateLimit(globalBuckets, globalKey, GLOBAL_LIMIT)

    if (!globalResult.allowed) {
      const res = NextResponse.json(
        { message: 'Too Many Requests, please slow down.' },
        { status: 429 },
      )
      res.headers.set('Retry-After', Math.ceil((globalResult.resetAt - Date.now()) / 1000).toString())
      return res
    }

    // 敏感接口强化限制
    if (isSensitivePath(pathname)) {
      const sensitiveKey = `${ip}:sensitive`
      const sensitiveResult = checkRateLimit(sensitiveBuckets, sensitiveKey, SENSITIVE_LIMIT)

      if (!sensitiveResult.allowed) {
        const res = NextResponse.json(
          { message: 'Too Many Requests on sensitive endpoint, please retry later.' },
          { status: 429 },
        )
        res.headers.set(
          'Retry-After',
          Math.ceil((sensitiveResult.resetAt - Date.now()) / 1000).toString(),
        )
        return res
      }
    }
  }

  // 后台鉴权：仅 /admin 开头
  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    try {
      await jwtVerify(token, key)
    } catch {
      const url = new URL('/login', request.url)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
