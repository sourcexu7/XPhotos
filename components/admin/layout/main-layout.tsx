/**
 * 统一的后端控制台布局组件
 */

'use client'

import React, { useState, useEffect } from 'react'
import { AdminSidebar } from './sidebar'
import { AdminHeader } from './header'
import { cn } from '~/lib/utils'

interface AdminMainLayoutProps {
  children: React.ReactNode
}

export function AdminMainLayout({ children }: AdminMainLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setSidebarCollapsed(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  return (
    <div className="min-h-screen bg-[var(--admin-bg-secondary)] flex">
      {/* 侧边栏 */}
      <AdminSidebar
        collapsed={sidebarCollapsed}
        onCollapse={setSidebarCollapsed}
      />
      
      {/* 主内容区 */}
      <div
        className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out"
        style={{
          marginLeft: !isMobile
            ? sidebarCollapsed
              ? 'var(--admin-sidebar-collapsed-width)'
              : 'var(--admin-sidebar-width)'
            : '0',
        }}
      >
        {/* 顶部栏 */}
        <AdminHeader
          onMenuClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          showMenuButton={isMobile}
        />
        
        {/* 内容区 */}
        <main className="flex-1 overflow-y-auto bg-[var(--admin-bg)]">
          <div className="w-full max-w-none py-4 px-2 lg:px-3">{children}</div>
        </main>
      </div>
    </div>
  )
}

