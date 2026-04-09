'use client'

import { useState, useEffect } from 'react'
import { SunMoonIcon } from '~/components/icons/sun-moon.tsx'
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip.tsx'
import { useTranslations } from 'next-intl'

export default function DarkModeToggle() {
  const t = useTranslations()
  const [isDark, setIsDark] = useState(false)

  // 初始化深色模式状态
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode')
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const initialMode = savedMode ? savedMode === 'true' : systemPrefersDark
    setIsDark(initialMode)
    if (initialMode) {
      document.documentElement.classList.add('dark')
    }
  }, [])

  // 监听系统主题变化
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedMode = localStorage.getItem('darkMode')
      if (!savedMode) {
        setIsDark(e.matches)
        if (e.matches) {
          document.documentElement.classList.add('dark')
        } else {
          document.documentElement.classList.remove('dark')
        }
      }
    }
    
    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [])

  // 切换深色模式
  const toggleDarkMode = () => {
    const newMode = !isDark
    setIsDark(newMode)
    
    // 更新 DOM 类
    if (newMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    // 保存到 localStorage
    localStorage.setItem('darkMode', newMode.toString())
    
    // 触发自定义事件
    window.dispatchEvent(new CustomEvent('darkModeChanged', { detail: newMode }))
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