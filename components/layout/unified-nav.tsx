'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Menu, Affix, theme } from 'antd'
import type { MenuProps } from 'antd'
import { HomeOutlined, AppstoreOutlined, CompassOutlined, BgColorsOutlined, SettingOutlined, UserOutlined, GithubOutlined, BulbOutlined } from '@ant-design/icons'
import type { AlbumType } from '~/types'
import { useTranslations } from 'next-intl'
import Command from '~/components/layout/command'
import { authClient } from '~/server/auth/auth-client'
import { useTheme } from 'next-themes'

interface UnifiedNavProps {
  albums: AlbumType[]
  currentAlbum?: string
  currentTheme?: string
  siteTitle?: string
}

export default function UnifiedNav({
  albums,
  currentAlbum = '/',
  currentTheme = '2',
  siteTitle = 'PicImpact',
}: UnifiedNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [themeState, setThemeState] = useState(currentTheme)
  const [mounted, setMounted] = useState(false)
  const [openKeys, setOpenKeys] = useState<string[]>([])
  const router = useRouter()
  const { token } = theme.useToken()
  const t = useTranslations()
  const { data: session } = authClient.useSession()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 32)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    if (!mounted) return
    const userTheme = localStorage.getItem('preferredTheme')
    if (userTheme) {
      setThemeState(userTheme)
    } else {
      // 默认使用瀑布流主题
      setThemeState('2')
      localStorage.setItem('preferredTheme', '2')
    }
  }, [mounted])

  // 主题选项：删除默认主题，只保留单列和瀑布流
  const themes = [
    { value: '1', label: t('Theme.indexSimpleStyle') },
    { value: '2', label: t('Theme.indexWaterfallStyle') },
  ]

  const handleThemeChange = (newTheme: string) => {
    setThemeState(newTheme)
    localStorage.setItem('preferredTheme', newTheme)
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: newTheme }))
    window.location.reload()
  }

  const themeMenuItems: MenuProps['items'] = themes.map(themeOption => ({
    key: themeOption.value,
    label: themeOption.label,
    onClick: () => {
      setOpenKeys([])
      handleThemeChange(themeOption.value)
    }
  }))

  // 设置下拉菜单（不包含相册项）
  const settingsMenuItems: MenuProps['items'] = [
    session ? {
      key: 'dashboard',
      icon: <SettingOutlined />,
      label: t('Link.dashboard'),
      onClick: () => {
        setOpenKeys([])
        router.push('/admin')
      },
    } : {
      key: 'login',
      icon: <UserOutlined />,
      label: t('Login.signIn'),
      onClick: () => {
        setOpenKeys([])
        router.push('/login')
      },
    },
    {
      key: 'theme-toggle',
      icon: <BulbOutlined />,
      label: t(resolvedTheme === 'light' ? 'Button.dark' : 'Button.light'),
      onClick: () => {
        setOpenKeys([])
        setTheme(resolvedTheme === 'light' ? 'dark' : 'light')
      },
    },
    {
      key: 'github',
      icon: <GithubOutlined />,
      label: 'GitHub',
      onClick: () => {
        setOpenKeys([])
        window.open('https://github.com/besscroft/PicImpact', '_blank')
      },
    },
  ]

  // 构建菜单项
  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页',
      onClick: () => router.push('/'),
    },
    {
      key: 'albums',
      icon: <AppstoreOutlined />,
      label: '相册',
      children: albums
        .filter((album) => album.album_value !== '/')
        .map((album) => ({
          key: album.album_value,
          label: album.name,
          onClick: () => {
            setOpenKeys([])
            router.push(album.album_value)
          },
        })),
    },
    {
      key: 'divider-1',
      type: 'divider',
      style: { margin: '0 8px' }
    },
    {
      key: 'theme-selector',
      icon: <BgColorsOutlined />,
      label: '主题',
      children: themeMenuItems,
      style: { marginLeft: 'auto' }
    },
    {
      key: 'settings',
      icon: <CompassOutlined />,
      label: '设置',
      children: settingsMenuItems,
    },
  ]

  // 确定当前选中的菜单项
  const selectedKeys = [currentAlbum === '/' ? '/' : currentAlbum]

  return (
    <>
      <Affix offsetTop={0}>
        <nav
          style={{
            background: `${token.colorBgContainer}ee`,
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            boxShadow: isScrolled ? token.boxShadowSecondary : token.boxShadowTertiary,
            borderBottom: `1px solid ${token.colorBorderSecondary}`,
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          <div
            style={{
              maxWidth: 1400,
              margin: '0 auto',
              padding: '0 8px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                height: 48,
              }}
            >
              {/* 左侧 Logo */}
              <Link
                href="/"
                style={{
                  flexShrink: 0,
                  padding: '4px 8px 4px 0',
                  textDecoration: 'none',
                }}
              >
                <span
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    background: 'linear-gradient(135deg, #1677ff 0%, #722ed1 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                  }}
                >
                  {siteTitle}
                </span>
              </Link>

              {/* 统一菜单：始终显示 */}
              <div style={{ flex: 1, overflow: 'hidden' }}>
                <Menu
                  mode="horizontal"
                  selectedKeys={selectedKeys}
                  openKeys={openKeys}
                  onOpenChange={(keys) => setOpenKeys(keys)}
                  items={menuItems}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    minWidth: 0,
                    flex: 'auto',
                    fontSize: '13px',
                    lineHeight: '48px',
                  }}
                  className="compact-nav-menu"
                />
              </div>
            </div>
          </div>
        </nav>
      </Affix>

      <Command data={albums} />
    </>
  )
}
