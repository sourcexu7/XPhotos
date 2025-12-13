import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

const SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key-should-be-long-and-random';
const key = new TextEncoder().encode(SECRET_KEY);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 检查是否访问 /admin 开头的路径
  if (pathname.startsWith('/admin')) {
    // 获取用户 Token (自动读取 Cookie)
    const token = request.cookies.get('auth_token')?.value;

    // 如果未登录，重定向到登录页
    if (!token) {
      const url = new URL('/login', request.url);
      url.searchParams.set('callbackUrl', encodeURI(request.url));
      return NextResponse.redirect(url);
    }

    try {
      await jwtVerify(token, key);
    } catch (error) {
      // Token 无效
      const url = new URL('/login', request.url);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  // 匹配器：仅匹配 /admin 开头的路径，避免影响其他页面
  matcher: ['/admin/:path*'],
};
