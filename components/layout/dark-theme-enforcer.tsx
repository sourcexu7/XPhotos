'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

/**
 * 主题默认策略：
 *  - 除首页（pathname === '/'）以外，所有页面默认 light（白天）主题
 *  - 首页（/）默认 dark（黑夜）主题，以突出的视觉呈现
 *  - 用户显式切换主题后，将偏好写入 `localStorage.explicitThemePref`；
 *    一旦存在用户偏好，所有页面都优先遵循用户偏好，不再按路径走默认
 *  - 配套：app/layout.tsx 中注入了一段 pre-hydration inline 脚本，
 *    在 React/next-themes 挂载之前就根据规则写好 html class，从而避免 FOUC
 *
 * 本组件职责：
 *  1. 客户端路由切换（usePathname 变化）时，若用户没有显式偏好，
 *     按新路径重新设置默认主题
 *  2. 将 next-themes 的实际主题同步到 `localStorage.theme`，
 *     防止 next-themes 与 HTML 实际 class 之间产生漂移
 *  3. 同步 `<meta name="theme-color">`（移动端地址栏颜色）
 */

const EXPLICIT_PREF_KEY = 'explicitThemePref'

function getPathDefault(pathname: string): 'dark' | 'light' {
  const cleaned = pathname?.replace(/\/+$/, '') || '/'
  return cleaned === '/' ? 'dark' : 'light'
}

function getExplicitPref(): 'dark' | 'light' | null {
  if (typeof window === 'undefined') return null
  try {
    const v = window.localStorage.getItem(EXPLICIT_PREF_KEY)
    return v === 'dark' || v === 'light' ? v : null
  } catch {
    return null
  }
}

function syncThemeColorMeta(theme: 'dark' | 'light') {
  if (typeof document === 'undefined') return
  try {
    const meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null
    if (meta) {
      meta.setAttribute('content', theme === 'dark' ? '#000000' : '#ffffff')
    }
  } catch {
    /* noop */
  }
}

export default function DarkThemeEnforcer({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { theme, setTheme, resolvedTheme } = useTheme()

  // —— 路径变化时，若无显式偏好，则应用新路径的默认主题 ——
  useEffect(() => {
    if (!pathname) return

    const explicit = getExplicitPref()
    // 对 /admin 等后台路径，永远强制 light（后台追求可读性 & 表单可读性）
    const inAdmin = pathname.startsWith('/admin')
    const pathDefault = inAdmin ? 'light' : getPathDefault(pathname)

    // 用户有明确偏好 → 用户偏好优先（除非在 admin 下，我们还是 light，保证后台可阅读）
    const target = (explicit && !inAdmin) ? explicit : pathDefault

    const current = (resolvedTheme || theme) as 'dark' | 'light' | undefined
    if (current && current !== target) {
      // 用 setTimeout 避免在 next-themes 刚初始化时的冲突写入
      window.setTimeout(() => setTheme(target), 0)
    }
    syncThemeColorMeta(target)
  }, [pathname, resolvedTheme, theme, setTheme])

  // —— 监听 theme 变化：确保 theme-color meta 与实际主题一致 ——
  useEffect(() => {
    const current = (resolvedTheme || theme) as 'dark' | 'light' | undefined
    if (current) syncThemeColorMeta(current)
  }, [resolvedTheme, theme])

  return <>{children}</>
}
