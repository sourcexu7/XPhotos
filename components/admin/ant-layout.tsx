'use client'

import React from 'react'
import { Layout, theme, Grid, Drawer } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined } from '@ant-design/icons'
import AdminAntSidebar from './ant-sidebar'
import AdminAntTopbar from './ant-topbar'
import { usePathname } from 'next/navigation'

const { Header, Sider, Content } = Layout
const { useBreakpoint } = Grid

export default function AdminAntLayout({ children }: { children: React.ReactNode }) {
  const screens = useBreakpoint()
  const { token } = theme.useToken()
  // 为避免 SSR 与客户端断点不一致导致的水合差异，初始固定为未折叠
  const [collapsed, setCollapsed] = React.useState<boolean>(false)
  const [drawerOpen, setDrawerOpen] = React.useState(false)
  const isMobile = !screens.md
  const pathname = usePathname()

  React.useEffect(() => {
    // 挂载后根据实际断点更新，避免首屏 SSR 与客户端不一致
    setCollapsed(!screens.lg)
  }, [screens.lg])

  React.useEffect(() => {
    // 移动端切路由后自动关闭抽屉导航，避免停留在遮罩层
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
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
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
            boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: isMobile ? 56 : 64,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: token.margin }}>
            <button
              type="button"
              onClick={() => {
                if (isMobile) setDrawerOpen(true)
                else setCollapsed(!collapsed)
              }}
              style={{
                cursor: 'pointer',
                fontSize: isMobile ? 16 : 18,
                transition: 'color 0.3s',
                border: 'none',
                background: 'transparent',
                padding: 0,
              }}
              aria-label={isMobile ? '打开侧边栏导航' : (collapsed ? '展开侧边栏' : '折叠侧边栏')}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = token.colorPrimary
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = 'inherit'
              }}
            >
              {isMobile ? <MenuFoldOutlined /> : (collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />)}
            </button>
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

      {isMobile && (
        <Drawer
          title={false}
          placement="left"
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size={260}
          styles={{ body: { padding: 0 } }}
        >
          <AdminAntSidebar collapsed={false} />
        </Drawer>
      )}
    </Layout>
  )
}
