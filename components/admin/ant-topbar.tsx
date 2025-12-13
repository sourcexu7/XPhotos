'use client'

import React, { useState, useEffect } from 'react'
import { Input, Avatar, Dropdown, Space, Badge, Button, Switch, Tooltip } from 'antd'
import { BellOutlined, SearchOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { authClient } from '~/lib/auth-client'
import { useTheme } from 'next-themes'
import { MoonOutlined, SunOutlined } from '@ant-design/icons'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

// using Input + Button inside Space.Compact instead of Input.Search

export default function AdminAntTopbar() {
  const t = useTranslations()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()

  const [searchValue, setSearchValue] = useState('')
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const onSearch = (value: string) => {
    if (!value) return
    router.push(`/admin/list?search=${encodeURIComponent(value)}`)
  }

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: t('Link.preferences'), onClick: () => router.push('/admin/settings/preferences') },
    { key: 'logout', icon: <LogoutOutlined />, label: t('Button.logout') || 'Logout', onClick: async () => {
      try {
        // 调用服务端 signOut
        await fetch('/api/v1/auth/logout', { method: 'POST' })
      } catch (e) {
        console.error('logout failed', e)
      } finally {
        // 彻底清除所有认证数据
        clearAllAuthData()
        // 强制完全刷新页面
        window.location.href = '/login'
      }
    } },
  ]

  return (
    <div style={{display: 'flex', alignItems: 'center', gap:12}}>
      <Space.Compact style={{ width: 300 }}>
        <Input
          placeholder={t('Search.placeholder') || 'Search'}
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onPressEnter={(e) => onSearch((e.target as HTMLInputElement).value)}
          allowClear
          prefix={<SearchOutlined />}
        />
        <Button onClick={() => onSearch(searchValue)} icon={<SearchOutlined />} />
      </Space.Compact>
      {isHydrated && (
        <Tooltip title={resolvedTheme === 'dark' ? (t('Button.light') || '切换至浅色') : (t('Button.dark') || '切换至深色')}>
          <Switch
            checked={resolvedTheme === 'dark'}
            checkedChildren={<MoonOutlined />}
            unCheckedChildren={<SunOutlined />}
            onChange={(checked) => setTheme(checked ? 'dark' : 'light')}
          />
        </Tooltip>
      )}
      <Badge count={0}>
        <BellOutlined style={{fontSize:18}} />
      </Badge>
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{cursor:'pointer'}}>
          <Avatar icon={<UserOutlined />} />
          <span style={{fontSize:13}}>admin</span>
        </Space>
      </Dropdown>
    </div>
  )
}
