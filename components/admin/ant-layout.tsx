'use client'

import React from 'react'
import { Layout, theme, Grid, Drawer, Button } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import AdminAntSidebar from './ant-sidebar'
import AdminAntTopbar from './ant-topbar'
import { usePathname } from 'next/navigation'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

export default function AdminAntLayout({ children }: { children: React.ReactNode }) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  const [collapsed, setCollapsed] = React.useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const isMobile = !screens.md
  const pathname = usePathname()

  React.useEffect(() => {
    setCollapsed(!screens.lg)
  }, [screens.lg])

  React.useEffect(() => {
    if (isMobile) setDrawerOpen(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          width={260}
          breakpoint="lg"
          collapsedWidth={80}
          style={{
            background: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
          }}
        >
          <AdminAntSidebar collapsed={collapsed} />
        </Sider>
      )}

      <Layout>
        <Header
          style={{
            padding: isMobile ? `0 ${token.padding}px` : `0 ${token.paddingLG}px`,
            background: token.colorBgContainer,
            boxShadow: token.boxShadowTertiary,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isMobile ? 56 : 64,
          }}
        >
          <Button
            type="text"
            shape="circle"
            size="large"
            icon={isMobile ? <MenuFoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            onClick={() => {
              if (isMobile) setDrawerOpen(true)
              else setCollapsed(!collapsed)
            }}
            aria-label={isMobile ? '打开侧边栏导航' : (collapsed ? '展开侧边栏' : '折叠侧边栏')}
          />
          <AdminAntTopbar />
        </Header>

        <Content
          style={{
            margin: isMobile ? token.margin : token.marginLG,
            padding: isMobile ? token.padding : token.paddingLG,
            minHeight: 360,
            background: token.colorBgContainer,
            borderRadius: token.borderRadiusLG,
          }}
        >
          {children}
        </Content>
      </Layout>

      {isMobile && (
        <Drawer
          title={false}
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          styles={{ wrapper: { width: 260 }, body: { padding: 0 } }}
        >
          <AdminAntSidebar collapsed={false} />
        </Drawer>
      )}
    </Layout>
  )
}
