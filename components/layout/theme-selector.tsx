'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select'
import { ChevronDown } from 'lucide-react'

interface ThemeSelectorProps {
  currentTheme: string
}

export default function ThemeSelector({ currentTheme }: ThemeSelectorProps) {
  const t = useTranslations('Theme')
  const [theme, setTheme] = useState(currentTheme)

  const themes = [
    { value: '0', label: t('indexDefaultStyle') },
    { value: '1', label: t('indexSimpleStyle') },
    { value: '2', label: t('indexWaterfallStyle') },
  ]

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme)
    
    // 保存到 localStorage
    localStorage.setItem('preferredTheme', newTheme)
    
    // 触发自定义事件通知其他组件主题已更改
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }))
    
    // 刷新页面以应用新主题（保持原有行为）
    window.location.reload()
  }

  // 从 localStorage 读取用户偏好主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('preferredTheme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className="w-[140px] h-9 border-border/50 bg-background/50 hover:bg-accent/50 transition-colors focus:ring-primary/30">
        <SelectValue placeholder="选择主题" />
      </SelectTrigger>
      <SelectContent className="border-border/50 bg-popover/95 backdrop-blur-md">
        {themes.map((themeOption) => (
          <SelectItem 
            key={themeOption.value} 
            value={themeOption.value}
            className="cursor-pointer focus:bg-accent/50"
          >
            <span className="text-sm">{themeOption.label}</span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
