'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, Dropdown, Space, Tooltip, Button } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, BulbOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useUserThemeToggle } from '~/lib/theme/use-user-theme-toggle'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

export default function AdminAntTopbar() {
  const t = useTranslations()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { toggle } = useUserThemeToggle()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: t('Link.preferences'), onClick: () => router.push('/admin/settings/preferences') },
    { key: 'logout', icon: <LogoutOutlined />, label: t('Button.logout'), onClick: async () => {
      try {
        await fetch('/api/v1/auth/logout', { method: 'POST' })
      } catch (e) {
        console.error('logout failed', e)
      } finally {
        clearAllAuthData()
        window.location.href = '/login'
      }
    } },
  ]

  const isDark = resolvedTheme === 'dark'

  return (
    <Space size="middle" align="center">
      {mounted ? (
        <Tooltip title={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}>
          <Button
            type="text"
            shape="circle"
            icon={<BulbOutlined />}
            onClick={toggle}
            aria-label={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}
          />
        </Tooltip>
      ) : (
        <Button type="text" shape="circle" disabled style={{ opacity: 0, cursor: 'default' }} aria-label="加载中">
          <BulbOutlined />
        </Button>
      )}

      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Avatar
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
        />
      </Dropdown>
    </Space>
  )
}
