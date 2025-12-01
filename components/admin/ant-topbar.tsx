'use client'

import React, { useState } from 'react'
import { Input, Avatar, Dropdown, Space, Badge, Button } from 'antd'
import { BellOutlined, SearchOutlined, UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { authClient } from '~/server/auth/auth-client'

// using Input + Button inside Space.Compact instead of Input.Search

export default function AdminAntTopbar() {
  const t = useTranslations()
  const router = useRouter()

  const [searchValue, setSearchValue] = useState('')
  const onSearch = (value: string) => {
    if (!value) return
    router.push(`/admin/list?search=${encodeURIComponent(value)}`)
  }

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: t('Link.preferences'), onClick: () => router.push('/admin/settings/preferences') },
    { key: 'logout', icon: <LogoutOutlined />, label: t('Button.logout') || 'Logout', onClick: async () => {
      try {
        await authClient.signOut()
      } catch {
        // eslint-disable-next-line no-console
        console.error('logout failed')
      } finally {
        location.replace('/login')
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
