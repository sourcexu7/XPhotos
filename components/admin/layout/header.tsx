/**
 * 统一顶部栏组件
 * 遵循 21st.dev 设计规范
 */

'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Settings, LogOut, Menu, Moon, Sun } from 'lucide-react'
import { useTheme } from 'next-themes'
import { cn } from '~/lib/utils'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

interface AdminHeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AdminHeader({ onMenuClick, showMenuButton = false }: AdminHeaderProps) {
  const t = useTranslations()
  const router = useRouter()
  const { theme, setTheme, resolvedTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  
  const handleLogout = async () => {
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST' })
    } catch (e) {
      console.error('logout failed', e)
    } finally {
      clearAllAuthData()
      window.location.href = '/login'
    }
  }
  
  return (
    <header
      className="sticky top-0 z-[var(--admin-z-sticky)] h-[var(--admin-header-height)] bg-[var(--admin-bg)] border-b border-[var(--admin-border)]"
      style={{ boxShadow: 'var(--admin-shadow-sm)' }}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6 border-l-0">
        {/* 左侧：菜单按钮 */}
        <div className="flex items-center gap-4">
          {showMenuButton && (
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 rounded-[var(--admin-radius-md)] hover:bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)]"
            >
              <Menu className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* 右侧：仅保留主题切换与用户菜单，移除铃铛、搜索、头像文字 */}
        <div className="flex items-center gap-3">
          {/* 主题切换 */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-[var(--admin-radius-md)] hover:bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] hover:text-[var(--admin-primary)] transition-colors"
            title={resolvedTheme === 'dark' ? '切换至浅色' : '切换至深色'}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </button>

          {/* 精简用户菜单：仅圆形头像，无文字 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--admin-radius-md)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
              aria-label="用户菜单"
            >
              <div className="w-9 h-9 rounded-full bg-[var(--admin-primary)] flex items-center justify-center text-white text-xs font-medium">
                A
              </div>
            </button>
            
            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-[var(--admin-z-dropdown)]"
                  onClick={() => setShowUserMenu(false)}
                />
                <div
                  className="absolute right-0 mt-2 w-48 bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-[var(--admin-radius-md)] shadow-[var(--admin-shadow-md)] z-[var(--admin-z-dropdown)] overflow-hidden"
                >
                  <button
                    onClick={() => {
                      router.push('/admin/settings/preferences')
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
                  >
                    <Settings className="h-4 w-4" />
                    <span>{t('Link.preferences')}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--admin-error)] hover:bg-[var(--admin-error-light)] transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>{t('Button.logout') || '退出登录'}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

