'use client'

import React from 'react'
import { Avatar, Dropdown, Space } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { clearAllAuthData } from '~/lib/utils/auth-utils'
import DarkModeToggle from '~/components/ui/dark-mode-toggle'

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
      {/* 黑夜模式切换按钮 */}
      <DarkModeToggle />
      
      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Space style={{cursor:'pointer'}}>
          <Avatar icon={<UserOutlined />} />
        </Space>
      </Dropdown>
    </div>
  )
}
