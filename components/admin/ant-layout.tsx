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
  // 为避免 SSR 与客户端断点不一致导致的水合差异，初始固定为未折叠
  const [collapsed, setCollapsed] = React.useState<boolean>(false)
  const isMobile = !screens.md

  React.useEffect(() => {
    // 挂载后根据实际断点更新，避免首屏 SSR 与客户端不一致
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
        collapsedWidth={isMobile ? 0 : 80}
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
            padding: isMobile ? `0 ${token.padding}px` : `0 ${token.paddingLG}px`,
            background: token.colorBgContainer,
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isMobile ? 56 : 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: token.margin }}>
            <div
              onClick={() => setCollapsed(!collapsed)}
              style={{
                cursor: 'pointer',
                fontSize: isMobile ? 16 : 18,
                transition: 'color 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = token.colorPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'inherit'
              }}
            >
              {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            </div>
          </div>
          <AdminAntTopbar />
        </Header>

        <Content style={{ margin: isMobile ? token.margin : token.marginLG }}>
          <div
            style={{
              padding: isMobile ? token.padding : token.paddingLG,
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
