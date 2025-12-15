/**
 * 统一侧边栏组件
 * 遵循 21st.dev 设计规范，采用现代化样式
 */

'use client'

import React, { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { cn } from '~/lib/utils'
import {
  LayoutDashboard,
  Upload,
  List,
  Images,
  Settings,
  User,
  Cloud,
  Key,
  Tag,
  Home,
  LogOut,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Search,
} from 'lucide-react'
import { authClient } from '~/lib/auth-client'
import { clearAllAuthData } from '~/lib/utils/auth-utils'

interface SidebarItem {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  children?: SidebarItem[]
  badge?: string
}

interface AdminSidebarProps {
  collapsed?: boolean
  onCollapse?: (collapsed: boolean) => void
}

export function AdminSidebar({ collapsed: controlledCollapsed, onCollapse }: AdminSidebarProps) {
  const t = useTranslations()
  const router = useRouter()
  const pathname = usePathname() || '/admin'
  const [internalCollapsed, setInternalCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [searchValue, setSearchValue] = useState('')
  
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed
  
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 1024
      setIsMobile(mobile)
      if (mobile) {
        setIsOpen(false)
        setInternalCollapsed(true)
      } else {
        setIsOpen(true)
      }
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])
  
  const mainItems: SidebarItem[] = [
    { key: '/admin', label: t('Link.dashboard'), icon: LayoutDashboard },
    { key: '/admin/upload', label: t('Link.upload'), icon: Upload },
    { key: '/admin/list', label: t('Link.list'), icon: List },
    { key: '/admin/album', label: t('Link.album'), icon: Images },
  ]
  
  const settingsItems: SidebarItem[] = [
    { key: '/admin/settings/preferences', label: t('Link.preferences'), icon: Settings },
    { key: '/admin/settings/account', label: t('Link.account'), icon: User },
    { key: '/admin/settings/storages', label: t('Link.storages'), icon: Cloud },
    { key: '/admin/settings/authenticator', label: t('Link.authenticator'), icon: Key },
    { key: '/admin/settings/passkey', label: t('Link.passkey'), icon: Key },
    { key: '/admin/settings/tag', label: t('Link.tags') || '标签管理', icon: Tag },
  ]
  
  const handleItemClick = (key: string) => {
    router.push(key)
    if (isMobile) {
      setIsOpen(false)
      setInternalCollapsed(true)
      onCollapse?.(true)
    }
  }
  
  const handleLogout = async () => {
    try {
      await authClient.signOut({ fetchOptions: { onSuccess: () => {} } })
    } catch (e) {
      console.error('logout failed', e)
    } finally {
      clearAllAuthData()
      window.location.href = '/login'
    }
  }
  
  const toggleSidebar = () => {
    setIsOpen(!isOpen)
  }
  
  const toggleCollapse = () => {
    const newCollapsed = !collapsed
    setInternalCollapsed(newCollapsed)
    onCollapse?.(newCollapsed)
  }
  
  const handleSearch = (value: string) => {
    if (!value.trim()) return
    router.push(`/admin/list?search=${encodeURIComponent(value)}`)
  }
  
  const renderItem = (item: SidebarItem) => {
    const isActive = pathname === item.key || pathname.startsWith(item.key + '/')
    const Icon = item.icon
    
    return (
      <li key={item.key}>
        <button
          onClick={() => handleItemClick(item.key)}
          className={cn(
            'w-full flex items-center rounded-md text-left transition-all duration-200 group relative',
            isActive
              ? collapsed
                ? 'bg-[var(--admin-primary)]'
                : 'bg-[var(--admin-primary-light)]'
              : 'hover:bg-slate-100',
            collapsed ? 'justify-center px-2 py-2.5' : 'px-3 py-2.5 gap-2.5'
          )}
          title={collapsed ? item.label : undefined}
        >
          <div className="flex items-center justify-center flex-shrink-0">
            <Icon
              className={cn(
                'flex-shrink-0',
                collapsed ? 'h-5 w-5' : 'h-4 w-4',
                isActive
                  ? collapsed
                    ? 'text-white'
                    : 'text-[var(--admin-primary)]'
                  : 'text-slate-700 group-hover:text-slate-900'
              )}
            />
          </div>
          
          {!collapsed && (
            <div className="flex items-center justify-between w-full min-w-0">
              <span className={cn(
                'text-sm truncate',
                isActive 
                  ? 'font-semibold text-[var(--admin-primary)]' 
                  : 'font-medium text-slate-700 group-hover:text-slate-900'
              )}>
                {item.label}
              </span>
              {item.badge && (
                <span
                  className={cn(
                    'px-1.5 py-0.5 text-xs font-medium rounded-full flex-shrink-0 ml-2',
                    isActive
                      ? 'bg-[var(--admin-primary)] text-white'
                      : 'bg-slate-200 text-slate-700'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </div>
          )}
          
          {/* Badge for collapsed state */}
          {collapsed && item.badge && (
            <div className="absolute top-1 right-1 w-4 h-4 flex items-center justify-center rounded-full bg-white border border-white">
              <span className="text-[10px] font-medium text-[var(--admin-primary)]">
                {parseInt(item.badge) > 9 ? '9+' : item.badge}
              </span>
            </div>
          )}
          
          {/* Tooltip for collapsed state */}
          {collapsed && (
            <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
              {item.label}
              {item.badge && (
                <span className="ml-1.5 px-1 py-0.5 bg-slate-700 rounded-full text-[10px]">
                  {item.badge}
                </span>
              )}
              <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
            </div>
          )}
        </button>
      </li>
    )
  }
  
  return (
    <>
      {/* Mobile hamburger button */}
      {isMobile && (
        <button
          onClick={toggleSidebar}
          className="fixed top-6 left-6 z-50 p-3 rounded-lg bg-white shadow-md border border-slate-100 md:hidden hover:bg-slate-50 transition-all duration-200"
          aria-label="Toggle sidebar"
        >
          {isOpen ? (
            <X className="h-5 w-5 text-slate-600" />
          ) : (
            <Menu className="h-5 w-5 text-slate-600" />
          )}
        </button>
      )}

      {/* Mobile overlay */}
      {isMobile && isOpen && (
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-30 md:hidden transition-opacity duration-300"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 h-full bg-white border-r border-slate-200 z-40 transition-all duration-300 ease-in-out flex flex-col',
          isMobile
            ? isOpen
              ? 'translate-x-0'
              : '-translate-x-full'
            : 'md:translate-x-0 md:static md:z-auto'
        )}
        style={{
          boxShadow: 'var(--admin-shadow-sm)',
          width: collapsed ? 'var(--admin-sidebar-collapsed-width)' : 'var(--admin-sidebar-width)',
        }}
      >
        {/* Header with logo and collapse button */}
        <div className={cn(
          'relative flex items-center border-b border-slate-200 bg-slate-50/60',
          collapsed ? 'justify-center p-4' : 'justify-between p-5'
        )}>
          {!collapsed && (
            <div className="flex items-center space-x-2.5 flex-1">
              <div className="w-9 h-9 bg-[var(--admin-primary)] rounded-lg flex items-center justify-center shadow-sm">
                <span className="text-white font-bold text-base">XP</span>
              </div>
              <div className="flex flex-col">
                <span className="font-semibold text-slate-900 text-base">XPhotos</span>
                <span className="text-xs text-slate-700">管理控制台</span>
              </div>
            </div>
          )}

          {collapsed && (
            <div className="w-9 h-9 bg-[var(--admin-primary)] rounded-lg flex items-center justify-center shadow-sm">
              <span className="text-white font-bold text-base">XP</span>
            </div>
          )}

          {/* Desktop collapse button */}
          {!collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex p-1.5 rounded-md hover:bg-slate-100 transition-all duration-200"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-4 w-4 text-slate-500" />
            </button>
          )}

          {collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex absolute right-2 p-1.5 rounded-md hover:bg-slate-100 transition-all duration-200"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-4 w-4 text-slate-500" />
            </button>
          )}

          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={toggleSidebar}
              className={cn(
                'md:hidden p-1.5 rounded-md hover:bg-slate-100 transition-all duration-200',
                collapsed ? 'absolute right-2' : 'ml-2'
              )}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4 text-slate-500" />
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder={t('Search.placeholder') || '搜索...'}
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch(searchValue)
                  }
                }}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-md text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)] focus:border-transparent transition-all duration-200"
              />
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-3 py-2 overflow-y-auto">
          <ul className="space-y-0.5">
            {mainItems.map(renderItem)}
          </ul>
          
          {!collapsed && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <div className="px-3 mb-3">
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">
                  {t('Link.settings')}
                </span>
              </div>
              <ul className="space-y-0.5">
                {settingsItems.map(renderItem)}
              </ul>
            </div>
          )}
          
          {collapsed && (
            <div className="mt-6 pt-4 border-t border-slate-200">
              <ul className="space-y-0.5">
                {settingsItems.map(renderItem)}
              </ul>
            </div>
          )}
        </nav>

        {/* Bottom section with profile and actions */}
        <div className="mt-auto border-t border-slate-200">
          {/* Home Button */}
          <div className="p-3 border-b border-slate-200">
            <button
              onClick={() => {
                router.push('/')
                if (isMobile) {
                  setIsOpen(false)
                }
              }}
              className={cn(
                'w-full flex items-center rounded-md text-left transition-all duration-200 group',
                'text-slate-600 hover:bg-slate-50 hover:text-slate-900',
                collapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2.5'
              )}
              title={collapsed ? t('Login.goHome') : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <Home className="h-4.5 w-4.5 flex-shrink-0 text-slate-500 group-hover:text-slate-700" />
              </div>
              
              {!collapsed && <span className="text-sm">{t('Login.goHome')}</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  {t('Login.goHome')}
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                </div>
              )}
            </button>
          </div>

          {/* Profile Section */}
          <div className={cn('border-b border-slate-200 bg-slate-50/30', collapsed ? 'py-3 px-2' : 'p-3')}>
            {!collapsed ? (
              <div className="flex items-center px-3 py-2 rounded-md bg-white hover:bg-slate-50 transition-colors duration-200">
                <div className="w-8 h-8 bg-[var(--admin-primary)] rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">A</span>
                </div>
                <div className="flex-1 min-w-0 ml-2.5">
                  <p className="text-sm font-medium text-slate-800 truncate">Admin</p>
                  <p className="text-xs text-slate-500 truncate">管理员</p>
                </div>
                <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Online" />
              </div>
            ) : (
              <div className="flex justify-center">
                <div className="relative">
                  <div className="w-9 h-9 bg-[var(--admin-primary)] rounded-full flex items-center justify-center">
                    <span className="text-white font-medium text-sm">A</span>
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
              </div>
            )}
          </div>

          {/* Logout Button */}
          <div className="p-3">
            <button
              onClick={handleLogout}
              className={cn(
                'w-full flex items-center rounded-md text-left transition-all duration-200 group',
                'text-red-600 hover:bg-red-50 hover:text-red-700',
                collapsed ? 'justify-center p-2.5' : 'space-x-2.5 px-3 py-2.5'
              )}
              title={collapsed ? '退出登录' : undefined}
            >
              <div className="flex items-center justify-center min-w-[24px]">
                <LogOut className="h-4.5 w-4.5 flex-shrink-0 text-red-500 group-hover:text-red-600" />
              </div>
              
              {!collapsed && <span className="text-sm">退出登录</span>}
              
              {/* Tooltip for collapsed state */}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-slate-800 text-white text-xs rounded opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 whitespace-nowrap z-50">
                  退出登录
                  <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-1.5 h-1.5 bg-slate-800 rotate-45" />
                </div>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  )
}

