'use client'

type RouterLike = {
  push: (href: string, options?: any) => void
}

let lastNavHref = ''
let lastNavAt = 0
const NAV_THROTTLE_MS = 300

export function safePush(router: RouterLike, href: string, options?: any) {
  // SSR 直接降级为普通 push
  if (typeof window === 'undefined') {
    router.push(href, options)
    return
  }

  const current = window.location.pathname + window.location.search
  if (current === href) {
    // 已经在目标路由上，避免重复导航
    return
  }

  const now = Date.now()
  if (href === lastNavHref && now - lastNavAt < NAV_THROTTLE_MS) {
    // 短时间内重复点击同一目的地，直接丢弃
    return
  }

  lastNavHref = href
  lastNavAt = now
  router.push(href, options)
}

