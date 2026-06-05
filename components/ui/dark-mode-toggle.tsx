'use client'

import { useState, useEffect } from 'react'
import { SunMoonIcon } from '~/components/icons/sun-moon.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip.tsx'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'

export default function DarkModeToggle() {
  const t = useTranslations()
  const { setTheme, resolvedTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  // 避免水合不匹配
  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-full opacity-0"
        aria-label="加载中"
        disabled
      >
        <SunMoonIcon size={18} />
      </button>
    )
  }

  const isDark = resolvedTheme === 'dark'
  const toggleDarkMode = () => {
    setTheme(isDark ? 'light' : 'dark')
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={toggleDarkMode}
          className="p-2 rounded-full hover:bg-muted/50 transition-colors duration-200"
          aria-label={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}
        >
          <SunMoonIcon 
            size={18} 
            className={`transition-transform duration-300 ${isDark ? 'rotate-180' : ''}`} 
          />
        </button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{isDark ? t('Theme.lightMode') : t('Theme.darkMode')}</p>
      </TooltipContent>
    </Tooltip>
  )
}