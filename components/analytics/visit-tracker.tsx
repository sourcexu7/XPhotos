'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'

function getPageType(pathname: string): string {
  if (pathname === '/' || pathname.startsWith('/home')) return 'home'
  if (pathname.startsWith('/albums') || pathname.startsWith('/covers')) return 'gallery'
  if (pathname.startsWith('/preview') || pathname.startsWith('/theme')) return 'album'
  if (pathname.startsWith('/admin')) return 'admin'
  return 'other'
}

export function VisitTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    if (!pathname) return

    const controller = new AbortController()
    const path = searchParams?.toString()
      ? `${pathname}?${searchParams.toString()}`
      : pathname

    // 轻量上报一次访问，不阻塞页面
    fetch('/api/v1/public/visit-log', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        path,
        pageType: getPageType(pathname),
      }),
      signal: controller.signal,
      keepalive: true,
    }).catch(() => {
      // 静默失败，避免影响用户体验
    })

    return () => {
      controller.abort()
    }
  }, [pathname, searchParams])

  return null
}




