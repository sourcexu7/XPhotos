import { NextRequest, NextResponse } from 'next/server'
import { getSessionCookie } from 'better-auth/cookies'

const COOKIE_PREFIX = 'pic-impact'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  const sessionCookie = getSessionCookie(request, {
    cookiePrefix: COOKIE_PREFIX
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