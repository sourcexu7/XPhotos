import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

function getKey() {
  const SECRET_KEY = process.env.JWT_SECRET || ''
  if (!SECRET_KEY) {
    throw new Error('JWT_SECRET environment variable is required')
  }
  return new TextEncoder().encode(SECRET_KEY)
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/admin')) {
    const token = request.cookies.get('auth_token')?.value

    if (!token) {
      const url = new URL('/login', request.url)
      url.searchParams.set('callbackUrl', encodeURI(request.url))
      return NextResponse.redirect(url)
    }

    try {
      await jwtVerify(token, getKey())
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
