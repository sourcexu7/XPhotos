'use client'

import React from 'react'
import { Layout, Button, Dropdown, Avatar } from 'antd'
import { MenuFoldOutlined, MenuUnfoldOutlined, UserOutlined } from '@ant-design/icons'
import { SidebarProvider } from '~/components/ui/sidebar'
import { AppSidebar } from '~/components/layout/admin/app-sidebar'

const { Header, Sider, Content } = Layout

export default function AntdAdminLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = React.useState(false)

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible collapsed={collapsed} onCollapse={(val) => setCollapsed(val)} theme="light">
        <SidebarProvider>
          <AppSidebar />
        </SidebarProvider>
      </Sider>
      <Layout>
        <Header style={{ padding: 0, background: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: 16, paddingRight: 16 }}>
          <div>
            <Button type="text" onClick={() => setCollapsed(!collapsed)} icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />} />
          </div>
          <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
            <Dropdown menu={{ items: [{ key: 'logout', label: 'Logout' }] }}>
              <a onClick={(e) => e.preventDefault()}>
                <Avatar icon={<UserOutlined />} />
              </a>
            </Dropdown>
          </div>
        </Header>
        <Content style={{ margin: 16 }}>
          <div style={{ padding: 24, minHeight: 360, background: '#fff', borderRadius: 6 }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  )
}
