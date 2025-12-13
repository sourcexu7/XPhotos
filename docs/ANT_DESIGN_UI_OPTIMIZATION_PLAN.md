# PicImpact Ant Design UI 优化计划

## 📋 项目概述

本文档详细说明了基于 Ant Design 设计规范对 PicImpact 摄影网站的 UI 优化方案。

### 当前技术栈
- Next.js 15.5.3
- React 19.1.1
- Ant Design 6.0.0
- @ant-design/pro-components 2.8.10
- Tailwind CSS 4.1.12

---

## 🎯 优化目标

1. **设计一致性**：全面采用 Ant Design 设计语言，统一视觉风格
2. **用户体验**：提升交互流畅度和视觉层次感
3. **响应式设计**：优化移动端和桌面端体验
4. **暗色模式**：完善暗色主题支持
5. **性能优化**：保持现有功能的同时提升加载速度

---

## 📊 Ant Design 设计原则分析

### 核心设计理念
- **自然**：遵循自然交互规律
- **确定性**：明确的操作反馈
- **意义**：合理的信息层级
- **生长性**：灵活的扩展能力

### 设计 Token 体系
- **间距系统**：8px 基础单位（8, 16, 24, 32）
- **圆角规范**：2px（小）、4px（中）、8px（大）
- **阴影层级**：Box Shadow Token System
- **色彩系统**：品牌色、功能色、中性色

---

## 🔍 当前项目分析

### 优点
✅ 已集成 Ant Design 6.0 和 Pro Components  
✅ 后台管理基本使用了 Ant Design 组件  
✅ 有暗色模式支持基础  

### 存在问题
❌ **布局间距不统一**：部分使用 inline style，未遵循 8px 栅格系统  
❌ **样式混合**：Tailwind + Ant Design + 内联样式混用  
❌ **暗色模式不完善**：部分组件在暗色模式下样式异常  
❌ **缺少视觉层次**：卡片、分割线、阴影使用不规范  
❌ **响应式不足**：移动端体验有待优化  
❌ **主题配置分散**：未使用 ConfigProvider 统一配置  

---

## 📝 详细优化方案

### 第一阶段：主题与色彩系统统一（1-2天）

#### 1.1 配置 Ant Design 主题 Token

**文件**：`app/layout.tsx`

**优化内容**：
- 添加 `ConfigProvider` 统一配置主题
- 定义品牌色、功能色、圆角、间距等 Token
- 配置暗色模式算法

**代码示例**：
```tsx
import { ConfigProvider, theme } from 'antd'
import zhCN from 'antd/locale/zh_CN'

const customTheme = {
  token: {
    colorPrimary: '#1677ff',
    borderRadius: 8,
    fontSize: 14,
    // 8px 栅格系统
    marginXS: 8,
    marginSM: 12,
    margin: 16,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
  },
  algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
}

<ConfigProvider theme={customTheme} locale={zhCN}>
  {children}
</ConfigProvider>
```

#### 1.2 统一色彩变量

**文件**：`app/globals-antd.css`

**优化内容**：
- 移除重复的颜色定义
- 使用 Ant Design CSS Variables
- 完善暗色模式颜色映射

---

### 第二阶段：后台布局优化（2-3天）

#### 2.1 优化管理后台主布局

**文件**：`components/admin/ant-layout.tsx`

**当前问题**：
- 使用 inline style，不便维护
- 间距不符合 8px 栅格
- 缺少过渡动画
- Header 高度不规范

**优化方案**：

```tsx
'use client'

import React from 'react'
import { Layout, theme, Grid } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import AdminAntSidebar from './ant-sidebar'
import AdminAntTopbar from './ant-topbar'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

export default function AdminAntLayout({ children }: { children: React.ReactNode }) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const [collapsed, setCollapsed] = React.useState<boolean>(!screens.lg)

  React.useEffect(() => {
    setCollapsed(!screens.lg)
  }, [screens.lg])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={setCollapsed}
        width={260}
        breakpoint="lg"
        style={{
          background: token.colorBgContainer,
          boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
        }}
      >
        <AdminAntSidebar collapsed={collapsed} />
      </Sider>
      
      <Layout>
        <Header
          style={{
            padding: `0 ${token.paddingLG}px`,
            background: token.colorBgContainer,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64, // Ant Design 标准 Header 高度
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: token.margin }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                cursor: 'pointer',
                fontSize: 18,
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = token.colorPrimary}
              onMouseLeave={(e) => e.currentTarget.style.color = 'inherit'}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>
          <AdminAntTopbar />
        </Header>

        <Content style={{ margin: token.marginLG }}>
          <div
            style={{
              padding: token.paddingLG,
              minHeight: 360,
              background: token.colorBgContainer,
              borderRadius: token.borderRadiusLG,
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
```

**改进点**：
- ✅ 使用 `theme.useToken()` 获取设计 Token
- ✅ 添加 Box Shadow 增强层次感
- ✅ 统一间距使用 Token
- ✅ Header 高度标准化为 64px
- ✅ 添加 hover 交互效果
- ✅ Content 添加圆角

---

#### 2.2 优化侧边栏

**文件**：`components/admin/ant-sidebar.tsx`

**当前问题**：
- Logo 区域样式简陋
- 菜单项间距不规范
- 缺少分组视觉层次
- 用户信息展示不够突出

**优化方案**：

```tsx
'use client'

import React from 'react'
import { Menu, Avatar, Dropdown, Typography, Space, Divider, theme } from 'antd'
import { useTranslations } from 'next-intl'
import { usePathname, useRouter } from 'next/navigation'
import {
  DashboardOutlined,
  UploadOutlined,
  AppstoreOutlined,
  PictureOutlined,
  InfoCircleOutlined,
  SettingOutlined,
  UserOutlined,
  CloudOutlined,
  KeyOutlined,
  TagsOutlined,
  LogoutOutlined,
} from '@ant-design/icons'

const { Text } = Typography

interface AdminAntSidebarProps {
  collapsed?: boolean
}

export default function AdminAntSidebar({ collapsed }: AdminAntSidebarProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname() || '/admin'
  const { token } = theme.useToken()

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
    {
      key: '/admin/about',
      icon: <InfoCircleOutlined />,
      label: t('Link.about'),
    },
  ]

  const settingsMenuItems = [
    {
      key: 'settings-group',
      type: 'group',
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

  const onClick: any = ({ key }: { key: string }) => {
    if (key !== 'settings-group') {
      router.push(key)
    }
  }

  const userMenuItems = [
    {
      key: 'home',
      icon: <DashboardOutlined />,
      label: t('Login.goHome'),
      onClick: () => router.push('/'),
    },
    {
      type: 'divider',
    },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: '退出登录',
      danger: true,
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
          PI
        </Avatar>
        {!collapsed && (
          <Text strong style={{ fontSize: 16 }}>
            PicImpact
          </Text>
        )}
      </div>

      <Divider style={{ margin: 0 }} />

      {/* 主菜单 */}
      <div style={{ flex: 1, overflow: 'auto' }}>
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
              <Space direction="vertical" size={0} style={{ marginLeft: token.marginXS }}>
                <Text strong style={{ fontSize: 13 }}>
                  Admin
                </Text>
                <Text type="secondary" style={{ fontSize: 12 }}>
                  admin@picimpact.com
                </Text>
              </Space>
            )}
          </div>
        </Dropdown>
      </div>
    </div>
  )
}
```

**改进点**：
- ✅ Logo 区域响应式适配折叠状态
- ✅ 使用 Menu Group 增加设置项层次
- ✅ 用户信息区域增加 hover 效果
- ✅ 添加邮箱显示
- ✅ 所有间距使用 Token
- ✅ 添加 Divider 分隔

---

#### 2.3 优化顶栏

**文件**：`components/admin/ant-topbar.tsx`

需要查看现有文件内容后进行优化。

---

### 第三阶段：前台界面优化（2-3天）

#### 3.1 优化前台导航栏

**文件**：`components/layout/unified-nav.tsx`

**当前问题**：
- 使用 Tailwind 类名过多
- Menu 样式自定义不够规范
- 响应式处理可以更优雅

**优化方案**：

```tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Menu, Space, Affix, theme } from 'antd'
import type { MenuProps } from 'antd'
import { HomeOutlined, AppstoreOutlined } from '@ant-design/icons'
import type { AlbumType } from '~/types'
import ThemeSelector from '~/components/layout/theme-selector'
import HeaderIconGroup from '~/components/layout/header-icon-group'

interface UnifiedNavProps {
  albums: AlbumType[]
  currentAlbum?: string
  currentTheme?: string
  siteTitle?: string
}

export default function UnifiedNav({
  albums,
  currentAlbum = '/',
  currentTheme = '0',
  siteTitle = 'PicImpact',
}: UnifiedNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [themeState, setThemeState] = useState(currentTheme)
  const router = useRouter()
  const pathname = usePathname()
  const { token } = theme.useToken()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    const userTheme = localStorage.getItem('preferredTheme')
    if (userTheme) {
      setThemeState(userTheme)
    }
  }, [])

  const menuItems: MenuProps['items'] = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '全部照片',
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
          onClick: () => router.push(album.album_value),
        })),
    },
  ]

  const selectedKeys = [currentAlbum === '/' ? '/' : currentAlbum]

  return (
    <Affix offsetTop={0}>
      <nav
        style={{
          background: isScrolled
            ? 'rgba(255, 255, 255, 0.95)'
            : 'rgba(255, 255, 255, 0.90)',
          backdropFilter: 'blur(12px)',
          boxShadow: isScrolled
            ? '0 2px 8px rgba(0,0,0,0.08)'
            : '0 1px 4px rgba(0,0,0,0.04)',
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: `0 ${token.paddingLG}px`,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            {/* Logo */}
            <Link
              href="/"
              style={{
                flexShrink: 0,
                padding: `${token.paddingSM}px ${token.paddingLG}px ${token.paddingSM}px 0`,
                textDecoration: 'none',
              }}
            >
              <span
                style={{
                  fontSize: 20,
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

            {/* 菜单 */}
            <div style={{ flex: 1 }}>
              <Menu
                mode="horizontal"
                selectedKeys={selectedKeys}
                items={menuItems}
                style={{
                  border: 'none',
                  background: 'transparent',
                  minWidth: 0,
                  flex: 'auto',
                }}
              />
            </div>

            {/* 右侧操作区 */}
            <Space size={token.marginSM} style={{ paddingLeft: token.paddingLG }}>
              <ThemeSelector currentTheme={themeState} />
              <HeaderIconGroup data={albums} />
            </Space>
          </div>
        </div>
      </nav>
    </Affix>
  )
}
```

**改进点**：
- ✅ 使用 `Affix` 组件实现吸顶
- ✅ 使用 Token 替代硬编码颜色和间距
- ✅ 优化毛玻璃效果
- ✅ 使用 Space 组件规范间距
- ✅ 移除 Tailwind 类名，统一使用 inline style + Token

---

#### 3.2 优化图片展示组件

**文件**：`components/gallery/waterfall/waterfall-image.tsx` 和 `components/gallery/simple/gallery-image.tsx`

**优化方向**：
- 使用 Ant Design Image 组件的预览功能
- 统一 Card hover 效果
- 添加 Skeleton 骨架屏
- 优化加载状态

---

### 第四阶段：组件库统一（1-2天）

#### 4.1 卡片组件

**优化目标**：
- 统一使用 Ant Design Card
- 规范圆角、阴影、间距
- 添加 hover 效果

**示例**：
```tsx
import { Card, theme } from 'antd'

const { token } = theme.useToken()

<Card
  bordered={false}
  style={{
    borderRadius: token.borderRadiusLG,
    boxShadow: '0 1px 2px rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)',
    transition: 'all 0.3s',
  }}
  onMouseEnter={(e) => {
    e.currentTarget.style.boxShadow = '0 4px 12px -1px rgba(0,0,0,0.08), 0 2px 8px -2px rgba(0,0,0,0.05)'
    e.currentTarget.style.transform = 'translateY(-2px)'
  }}
  onMouseLeave={(e) => {
    e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03), 0 1px 6px -1px rgba(0,0,0,0.02), 0 2px 4px rgba(0,0,0,0.02)'
    e.currentTarget.style.transform = 'translateY(0)'
  }}
>
  {children}
</Card>
```

#### 4.2 表单组件

**优化目标**：
- 统一使用 Ant Design Form
- 规范 label、help、error 样式
- 添加 validateStatus 反馈

#### 4.3 表格组件

**优化目标**：
- 使用 Ant Design Table
- 统一分页器样式
- 添加加载状态

---

### 第五阶段：暗色模式完善（1天）

#### 5.1 完善暗色主题配置

**文件**：`app/layout.tsx`

```tsx
import { ConfigProvider, theme } from 'antd'

const isDark = // 获取暗色模式状态

<ConfigProvider
  theme={{
    algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: {
      colorBgContainer: isDark ? '#141414' : '#ffffff',
      colorBgElevated: isDark ? '#1f1f1f' : '#ffffff',
      // ... 其他 Token
    },
  }}
>
  {children}
</ConfigProvider>
```

#### 5.2 优化暗色模式 CSS

**文件**：`app/globals-antd.css`

- 补充暗色模式下的 Menu、Card、Table 样式
- 统一暗色模式下的边框颜色
- 优化暗色模式下的阴影效果

---

### 第六阶段：响应式优化（1-2天）

#### 6.1 使用 Grid 栅格系统

**优化方向**：
- 使用 Ant Design Row、Col 组件
- 统一断点：xs、sm、md、lg、xl、xxl
- 优化移动端菜单

#### 6.2 移动端导航优化

**优化方向**：
- 添加 Drawer 抽屉菜单
- 优化触摸交互
- 简化移动端布局

---

## 🗓️ 实施时间表

| 阶段 | 内容 | 预估时间 | 优先级 |
|------|------|----------|--------|
| 第一阶段 | 主题与色彩系统统一 | 1-2天 | P0 |
| 第二阶段 | 后台布局优化 | 2-3天 | P0 |
| 第三阶段 | 前台界面优化 | 2-3天 | P1 |
| 第四阶段 | 组件库统一 | 1-2天 | P1 |
| 第五阶段 | 暗色模式完善 | 1天 | P2 |
| 第六阶段 | 响应式优化 | 1-2天 | P2 |

**总计**：8-13 个工作日

---

## ✅ 验收标准

### 设计规范
- [ ] 所有间距符合 8px 栅格系统
- [ ] 圆角统一使用 Ant Design Token
- [ ] 阴影使用 Ant Design 规范
- [ ] 颜色使用主题 Token

### 代码质量
- [ ] 移除所有硬编码的样式值
- [ ] 统一使用 `theme.useToken()`
- [ ] 减少 Tailwind 与 Ant Design 混用
- [ ] 优化 inline style

### 用户体验
- [ ] 暗色模式完全适配
- [ ] 移动端体验流畅
- [ ] 加载状态清晰
- [ ] 交互反馈及时

### 性能指标
- [ ] 首屏加载时间 < 2s
- [ ] Lighthouse 性能评分 > 90
- [ ] 无样式闪烁（FOUC）

---

## 📦 重点优化文件清单

### 后台管理
- [x] `components/admin/ant-layout.tsx` - 主布局
- [x] `components/admin/ant-sidebar.tsx` - 侧边栏
- [ ] `components/admin/ant-topbar.tsx` - 顶栏
- [ ] `components/admin/dashboard/card-list.tsx` - 仪表盘卡片
- [ ] `components/admin/dashboard/antd-dashboard.tsx` - 仪表盘

### 前台界面
- [x] `components/layout/unified-nav.tsx` - 导航栏
- [ ] `components/gallery/waterfall/waterfall-image.tsx` - 瀑布流图片
- [ ] `components/gallery/simple/gallery-image.tsx` - 简单布局图片
- [ ] `components/album/blur-image.tsx` - 模糊图片
- [ ] `components/album/preview-image.tsx` - 预览图片

### 样式文件
- [ ] `app/globals-antd.css` - Ant Design 全局样式
- [ ] `style/globals.css` - 全局样式
- [ ] `app/layout.tsx` - 根布局（添加 ConfigProvider）

### 表单组件
- [ ] `components/admin/upload/simple-file-upload.tsx` - 文件上传
- [ ] `components/admin/settings/*` - 设置表单

---

## 🎨 设计 Token 配置参考

```typescript
// 亮色主题
const lightTheme = {
  token: {
    // 品牌色
    colorPrimary: '#1677ff',
    colorSuccess: '#52c41a',
    colorWarning: '#faad14',
    colorError: '#ff4d4f',
    colorInfo: '#1677ff',
    
    // 背景色
    colorBgContainer: '#ffffff',
    colorBgElevated: '#ffffff',
    colorBgLayout: '#f5f5f5',
    
    // 文字颜色
    colorText: 'rgba(0, 0, 0, 0.88)',
    colorTextSecondary: 'rgba(0, 0, 0, 0.65)',
    colorTextTertiary: 'rgba(0, 0, 0, 0.45)',
    colorTextQuaternary: 'rgba(0, 0, 0, 0.25)',
    
    // 边框
    colorBorder: '#d9d9d9',
    colorBorderSecondary: '#f0f0f0',
    
    // 圆角
    borderRadius: 6,
    borderRadiusLG: 8,
    borderRadiusSM: 4,
    borderRadiusXS: 2,
    
    // 间距
    margin: 16,
    marginXS: 8,
    marginSM: 12,
    marginMD: 20,
    marginLG: 24,
    marginXL: 32,
    marginXXL: 48,
    
    // 内边距
    padding: 16,
    paddingXS: 8,
    paddingSM: 12,
    paddingMD: 20,
    paddingLG: 24,
    paddingXL: 32,
    
    // 阴影
    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.03), 0 1px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px 0 rgba(0, 0, 0, 0.02)',
    boxShadowSecondary: '0 6px 16px 0 rgba(0, 0, 0, 0.08), 0 3px 6px -4px rgba(0, 0, 0, 0.12), 0 9px 28px 8px rgba(0, 0, 0, 0.05)',
    
    // 字体
    fontSize: 14,
    fontSizeLG: 16,
    fontSizeSM: 12,
    fontSizeXL: 20,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  algorithm: theme.defaultAlgorithm,
}

// 暗色主题
const darkTheme = {
  ...lightTheme,
  algorithm: theme.darkAlgorithm,
}
```

---

## 🚀 快速开始

### 步骤 1：备份当前代码
```bash
git checkout -b feature/ant-design-ui-optimization
git add .
git commit -m "chore: backup before UI optimization"
```

### 步骤 2：安装依赖（如需要）
```bash
pnpm install
```

### 步骤 3：按阶段实施
从第一阶段开始，逐步优化每个文件。

### 步骤 4：测试验证
每完成一个阶段，进行功能测试和视觉验证。

---

## 📚 参考资料

- [Ant Design 官方文档](https://ant.design/)
- [Ant Design 设计规范](https://ant.design/docs/spec/introduce-cn)
- [Ant Design Token 系统](https://ant.design/docs/react/customize-theme-cn)
- [Ant Design Pro Components](https://procomponents.ant.design/)
- [Ant Design 暗色主题](https://ant.design/docs/react/customize-theme-cn#%E6%9A%97%E8%89%B2%E4%B8%BB%E9%A2%98)

---

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- GitHub Issues
- 项目讨论区

---

**文档版本**：v1.0  
**创建日期**：2025-11-26  
**最后更新**：2025-11-26  
**负责人**：GitHub Copilot
