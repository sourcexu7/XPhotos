'use client'

import React, { useState, useEffect } from 'react'
import { Menu, Avatar, Dropdown, Typography, Space, Divider, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import {
  DashboardOutlined,
  UploadOutlined,
  AppstoreOutlined,
  PictureOutlined,
  SettingOutlined,
  UserOutlined,
  CloudOutlined,
  KeyOutlined,
  TagsOutlined,
  LogoutOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { authClient } from '~/lib/auth-client'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

const { Text } = Typography

interface AdminAntSidebarProps {
  collapsed?: boolean
}

export default function AdminAntSidebar({ collapsed }: AdminAntSidebarProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname() || '/admin'
  const { token } = theme.useToken()
  const [isHydrated, setIsHydrated] = useState(false)

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const mainMenuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: t('Link.dashboard'),
    },
    {
      key: '/admin/upload',
      icon: <UploadOutlined />,
      label: t('Link.upload'),
    },
    {
      key: '/admin/list',
      icon: <AppstoreOutlined />,
      label: t('Link.list'),
    },
    {
      key: '/admin/album',
      icon: <PictureOutlined />,
      label: t('Link.album'),
    },
  ]

  const settingsMenuItems = [
    {
      key: 'settings-group',
      type: 'group' as const,
      label: !collapsed && <Text type="secondary" style={{ fontSize: 12 }}>{t('Link.settings')}</Text>,
      children: [
        {
          key: '/admin/settings/preferences',
          icon: <SettingOutlined />,
          label: t('Link.preferences'),
        },
        {
          key: '/admin/settings/account',
          icon: <UserOutlined />,
          label: t('Link.account'),
        },
        {
          key: '/admin/settings/storages',
          icon: <CloudOutlined />,
          label: t('Link.storages'),
        },
        {
          key: '/admin/settings/authenticator',
          icon: <KeyOutlined />,
          label: t('Link.authenticator'),
        },
        {
          key: '/admin/settings/passkey',
          icon: <KeyOutlined />,
          label: t('Link.passkey'),
        },
        {
          key: '/admin/settings/tag',
          icon: <TagsOutlined />,
          label: t('Link.tags') || '标签管理',
        },
      ],
    },
  ]

  const onClick = ({ key }: { key: string }) => {
    if (key !== 'settings-group') {
      router.push(key)
    }
  }

  const userMenuItems = [
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: t('Login.goHome'),
      onClick: () => router.push('/'),
    },
    {
      type: 'divider' as const,
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
      onClick: async () => {
        try {
          // 调用服务端 signOut
          await authClient.signOut({ fetchOptions: { onSuccess: () => {} } })
        } catch (e) {
          console.error('logout failed', e)
        } finally {
          // 彻底清除所有认证数据
          clearAllAuthData()
          // 强制完全刷新页面
          window.location.href = '/login'
        }
      },
    },
  ]

  return (
    <div
      style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Logo 区域 */}
      <div
        style={{
          padding: collapsed ? `${token.paddingLG}px ${token.paddingSM}px` : token.paddingLG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: token.marginSM,
          transition: 'all 0.3s',
        }}
      >
        <Avatar
          shape="square"
          size={collapsed ? 32 : 40}
          style={{
            background: token.colorPrimary,
            fontSize: collapsed ? 14 : 16,
          }}
        >
          XP
        </Avatar>
        {!collapsed && (
          <Text strong style={{ fontSize: 16 }}>
            XPhotos
          </Text>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 主菜单 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isHydrated && (
          <>
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              onClick={onClick}
              items={mainMenuItems}
              style={{ border: 'none' }}
            />
            <Menu
              mode="inline"
              selectedKeys={[pathname]}
              onClick={onClick}
              items={settingsMenuItems}
              style={{ border: 'none', marginTop: token.marginMD }}
            />
          </>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 用户信息 */}
      <div
        style={{
          padding: token.paddingSM,
        }}
      >
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              padding: token.paddingXS,
              borderRadius: token.borderRadius,
              transition: 'background 0.3s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = token.colorBgTextHover
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <Avatar size={32} style={{ background: token.colorPrimary }}>
              A
            </Avatar>
            {!collapsed && (
              <Space orientation="vertical" size={0} style={{ marginLeft: token.marginXS }}>
                <Text strong style={{ fontSize: 13 }}>
                  Admin
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  admin@xphotos.com
                </Text>
              </Space>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  )
}
