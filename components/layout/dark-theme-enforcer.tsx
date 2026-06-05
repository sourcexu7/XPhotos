'use client'

import { useEffect } from 'react'
import { usePathname } from 'next/navigation'
import { useTheme } from 'next-themes'

interface DarkThemeEnforcerProps {
  children: React.ReactNode
}

export default function DarkThemeEnforcer({ children }: DarkThemeEnforcerProps) {
  const pathname = usePathname()
  const { setTheme, resolvedTheme } = useTheme()

  useEffect(() => {
    // 每次进入首页时强制设置深色主题
    if (pathname === '/' && resolvedTheme && resolvedTheme !== 'dark') {
      setTheme('dark')
    }
  }, [pathname, resolvedTheme, setTheme])

  return children
}