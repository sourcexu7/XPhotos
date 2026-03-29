'use client'

import { useState, useEffect } from 'react'
import { Dropdown, Space } from 'antd'
import type { MenuProps } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'

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
    
    // 刷新页面以应用新主题
    window.location.reload()
  }

  // 从 localStorage 读取用户偏好主题
  useEffect(() => {
    const savedTheme = localStorage.getItem('preferredTheme')
    if (savedTheme) {
      setTheme(savedTheme)
    }
  }, [])

  const currentThemeLabel = themes.find(t => t.value === theme)?.label || themes[0].label

  const menuItems: MenuProps['items'] = themes.map(themeOption => ({
    key: themeOption.value,
    label: themeOption.label,
    onClick: () => handleThemeChange(themeOption.value)
  }))

  return (
    <Dropdown menu={{ items: menuItems }} placement="bottomRight">
      <a onClick={(e) => e.preventDefault()} className="cursor-pointer select-none ant-menu-title-content">
        <Space>
          <span style={{ fontSize: '14px' }}>{currentThemeLabel}</span>
          <DownOutlined style={{ fontSize: '12px' }} />
        </Space>
      </a>
    </Dropdown>
  )
}
