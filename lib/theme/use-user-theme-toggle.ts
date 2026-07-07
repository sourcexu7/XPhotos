'use client'

import { useCallback } from 'react'
import { useTheme } from 'next-themes'

/**
 * 用户主动切换主题的统一入口。
 *
 * 区别于按路径的默认策略（由 DarkThemeEnforcer 控制）：
 *  - 用户主动点击"切换明/暗"按钮时，把新主题同时写到：
 *    1. next-themes 的 `setTheme` —— 真正切换页面主题
 *    2. localStorage 的 `explicitThemePref` —— 标记"用户已表态"，
 *       之后所有页面都以用户偏好为准，不再根据路径自动切换
 *
 * 若需要"清除用户偏好、恢复按路径默认"的行为，调用 `clearUserPreference()`。
 */

const EXPLICIT_PREF_KEY = 'explicitThemePref'

export function setUserPreference(value: 'dark' | 'light') {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(EXPLICIT_PREF_KEY, value)
  } catch {
    /* noop */
  }
}

export function clearUserPreference() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(EXPLICIT_PREF_KEY)
  } catch {
    /* noop */
  }
}

/** 同步浏览器 meta[name="theme-color"]，用于移动端地址栏颜色 */
function syncMeta(theme: 'dark' | 'light') {
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

export function useUserThemeToggle() {
  const { resolvedTheme, setTheme, theme } = useTheme()

  const toggle = useCallback(() => {
    const current = (resolvedTheme || theme) as 'dark' | 'light' | undefined
    const next: 'dark' | 'light' = current === 'dark' ? 'light' : 'dark'
    setUserPreference(next)
    setTheme(next)
    syncMeta(next)
  }, [resolvedTheme, theme, setTheme])

  const setUserTheme = useCallback(
    (next: 'dark' | 'light') => {
      setUserPreference(next)
      setTheme(next)
      syncMeta(next)
    },
    [setTheme],
  )

  return { toggle, setUserTheme }
}
