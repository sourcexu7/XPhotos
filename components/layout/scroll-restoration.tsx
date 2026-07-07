'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

/**
 * 滚动位置记忆：
 * - 用户在列表页滚动时保存 scrollY 到 sessionStorage
 * - 回到该页时恢复该位置；/preview/ 等页面强制 回到顶部
 *
 * 关键：仅在「同一页面返回/前进时才恢复
 */
export default function ScrollRestoration() {
  const pathname = usePathname()
  const savedKeyRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    // ========== 1) 进 /preview/ 页面：永远滚动到顶部，不恢复 ==========
    const isPreview = pathname.startsWith('/preview/')

    if (isPreview) {
      // 先清掉任何可能残留的滚动锁定
      document.documentElement.style.overflow = ''
      document.body.style.overflow = ''

      const restore = () => {
        try {
          // 用 instant 绕过 CSS scroll-behavior:smooth，避免动画期间阻塞触摸滚动
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        } catch {}
      }
      // 下一帧执行两次，避免 React 布局完成后再执行一次
      requestAnimationFrame(() => {
        requestAnimationFrame(restore)
      })

      // 不监听滚动，避免保存 0 到 sessionStorage
      savedKeyRef.current = null
      return
    }

    // ========== 2) 非 preview 页：保存 & 恢复 ==========
    const key = `scroll:${pathname}`
    savedKeyRef.current = key

    const saved = Number(sessionStorage.getItem(key))
    if (!Number.isNaN(saved) && saved > 0) {
      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: saved, left: 0, behavior: 'instant' })
        } catch {}
      })
    } else {
      requestAnimationFrame(() => {
        try {
          window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
        } catch {}
      })
    }

    let raf = 0
    const onScroll = () => {
      if (raf) return
      raf = window.requestAnimationFrame(() => {
        raf = 0
        sessionStorage.setItem(key, String(window.scrollY || 0))
      })
    }
    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
      // 卸载/离开页面时保存最后一次滚动位置（避免路由切换前的位置）
      try {
        sessionStorage.setItem(key, String(window.scrollY || 0))
      } catch {}
    }
  }, [pathname])

  return null
}
