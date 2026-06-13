'use client'

import { useState, useEffect } from 'react'
import { Tooltip, Button } from 'antd'
import { SunMoonIcon } from '~/components/icons/sun-moon.tsx'
import { useTranslations } from 'next-intl'
import { useTheme } from 'next-themes'
import { useUserThemeToggle } from '~/lib/theme/use-user-theme-toggle'

export default function DarkModeToggle() {
  const t = useTranslations()
  const { resolvedTheme } = useTheme()
  const { toggle } = useUserThemeToggle()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <Button
        type="text"
        shape="circle"
        aria-label="加载中"
        disabled
        style={{ opacity: 0, cursor: 'default' }}
      >
        <SunMoonIcon size={18} />
      </Button>
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <Tooltip title={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}>
      <Button
        type="text"
        shape="circle"
        onClick={toggle}
        style={{ touchAction: 'manipulation' }}
        aria-label={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}
      >
        <SunMoonIcon
          size={20}
          className={`transition-transform duration-300 ${isDark ? 'rotate-180' : ''}`}
        />
      </Button>
    </Tooltip>
  )
}
