'use client'

import { useState, useEffect } from 'react'
import { Avatar, Dropdown, Space } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { authClient } from '~/lib/auth-client'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

// using Input + Button inside Space.Compact instead of Input.Search

export default function AdminAntTopbar() {
  const t = useTranslations()
  const router = useRouter()

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: t('Link.preferences'), onClick: () => router.push('/admin/settings/preferences') },
    { key: 'logout', icon: <LogoutOutlined />, label: t('Button.logout'), onClick: async () => {
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
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{cursor:'pointer'}}>
          <Avatar icon={<UserOutlined />} />
        </Space>
      </Dropdown>
    </div>
  )
}
