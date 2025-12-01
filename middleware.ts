import { NextRequest, NextResponse } from 'next/server'

const COOKIE_PREFIX = 'pic-impact'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  // Edge Runtime 中禁止使用 Node.js API 与非 Edge 兼容库（如 better-auth/cookies）
  // 这里仅通过检测带有前缀的会话 Cookie 是否存在来做最小鉴权门禁
  const cookies = request.cookies.getAll()
  // 识别真实会话 Cookie：前缀匹配 + 包含 session，排除 cache/refresh 等
  const sessionCookie = cookies.find((c) => {
    const name = c.name.toLowerCase()
    if (!name.startsWith(COOKIE_PREFIX)) return false
    if (!name.includes('session')) return false
    if (name.includes('cache') || name.includes('refresh')) return false
    return true
  })

  // API v1 路由需要认证
  if (pathname.startsWith('/api/v1') && !sessionCookie) {
    return Response.json(
      { success: false, message: 'authentication failed' },
      { status: 401 }
    )
  }

  // Admin 路由需要认证
  if (pathname.startsWith('/admin') && !sessionCookie) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // 已登录用户访问登录页，重定向到首页
  if (sessionCookie && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|manifest.json|robots.txt|icons/|fonts/).*)',
    '/admin/:path*',
    '/api/v1/:path*',
  ],
}