'use client'

import React, { useState, useEffect } from 'react'
import { Menu, Dropdown, Typography, Divider, theme, Avatar } from 'antd'
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
  TagsOutlined,
  LogoutOutlined,
  HomeOutlined,
  BarChartOutlined,
  BookOutlined,
  PieChartOutlined,
  GlobalOutlined,
  RobotOutlined,
  CameraOutlined,
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
  const [userHovered, setUserHovered] = useState(false)
  const { data: session } = authClient.useSession()

  useEffect(() => {
    setIsHydrated(true)
  }, [])

  const menuItems = [
    {
      key: '/admin',
      icon: <DashboardOutlined />,
      label: t('Link.dashboard'),
    },
    {
      key: '/admin/data-overview',
      icon: <PieChartOutlined />,
      label: t('Link.dataOverview'),
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
      key: '/admin/analytics',
      icon: <BarChartOutlined />,
      label: t('Link.analytics'),
    },
    {
      key: '/admin/album',
      icon: <PictureOutlined />,
      label: t('Link.album'),
    },
    {
      key: '/admin/guides',
      icon: <BookOutlined />,
      label: t('Link.guides'),
    },
    {
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
          key: '/admin/settings/tag',
          icon: <TagsOutlined />,
          label: t('Link.tags'),
        },
        {
          key: '/admin/settings/storages',
          icon: <CloudOutlined />,
          label: t('Link.storages'),
        },
        {
          key: '/admin/settings/ai-model',
          icon: <RobotOutlined />,
          label: t('Link.aiModel'),
        },
      ],
    },
  ]

  const onClick = ({ key }: { key: string }) => {
    router.push(key)
  }

  const userMenuItems = [
    {
      key: 'preferences',
      icon: <SettingOutlined />,
      label: t('Settings.title'),
      onClick: () => router.push('/admin/settings/preferences'),
    },
    {
      key: 'home',
      icon: <HomeOutlined />,
      label: t('Login.goHome'),
      onClick: () => router.push('/'),
    },
    { type: 'divider' as const },
    {
      key: 'language',
      icon: <GlobalOutlined />,
      label: t('Settings.language'),
      onClick: () => {
        const currentLang = document.documentElement.lang
        const newLang = currentLang === 'zh' ? 'en' : 'zh'
        document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`
        window.location.reload()
      },
    },
    { type: 'divider' as const },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: t('Login.logout'),
      danger: true,
      onClick: async () => {
        try {
          await authClient.signOut({ fetchOptions: { onSuccess: () => {} } })
        } catch (e) {
          console.error('logout failed', e)
        } finally {
          clearAllAuthData()
          window.location.href = '/login'
        }
      },
    },
  ]

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo 区域 */}
      <div
        style={{
          padding: collapsed ? `${token.paddingLG}px ${token.paddingSM}px` : token.paddingLG,
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'flex-start',
          gap: token.marginSM,
          transition: `all ${token.motionDurationMid}`,
        }}
      >
        <CameraOutlined style={{ fontSize: 20, color: token.colorPrimary }} />
        {!collapsed && (
          <Text strong style={{ fontSize: 16 }}>
            XPhotos
          </Text>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 统一菜单 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {isHydrated && (
          <Menu
            mode="inline"
            selectedKeys={[pathname]}
            onClick={onClick}
            items={menuItems}
            style={{ border: 'none' }}
          />
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 用户信息 */}
      <div style={{ padding: token.paddingSM }}>
        <Dropdown menu={{ items: userMenuItems }} placement="topLeft" trigger={['click']}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: collapsed ? 'center' : 'flex-start',
              cursor: 'pointer',
              padding: token.paddingXS,
              borderRadius: token.borderRadius,
              transition: `background-color ${token.motionDurationMid}`,
              gap: token.paddingSM,
              background: userHovered ? token.colorBgTextHover : 'transparent',
            }}
            onMouseEnter={() => setUserHovered(true)}
            onMouseLeave={() => setUserHovered(false)}
            role="button"
            tabIndex={0}
            aria-label={session?.user?.name || t('Admin.fallbackName')}
          >
            <Avatar
              size={collapsed ? 32 : 40}
              icon={<UserOutlined />}
              style={{ backgroundColor: token.colorPrimary }}
            />
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3 }}>
                <Text strong style={{ fontSize: token.fontSize }}>
                  {session?.user?.name || t('Admin.fallbackName')}
                </Text>
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                  {session?.user?.email || t('Admin.fallbackEmail')}
                </Text>
              </div>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  )
}
