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
  DashboardOutlined,
  UploadOutlined,
  UnorderedListOutlined,
  AppstoreOutlined,
  SettingOutlined,
  UserOutlined,
  CloudOutlined,
  TagsOutlined,
  HomeOutlined,
  LogoutOutlined,
  MenuOutlined,
  CloseOutlined,
  LeftOutlined,
  RightOutlined,
  SearchOutlined,
  BookOutlined,
  CameraOutlined,
  GlobalOutlined,
} from '@ant-design/icons'
import { Avatar, message } from 'antd'
import { authClient } from '~/lib/auth-client'
import { clearAllAuthData } from '~/lib/utils/auth-utils'
import { uploadFile } from '~/lib/utils/file'
import { compressImage } from '~/lib/utils/compress'

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
  const [avatarUrl, setAvatarUrl] = useState<string>('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [showProfileMenu, setShowProfileMenu] = useState(false)
  
  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (!target.closest('.profile-section')) {
        setShowProfileMenu(false)
      }
    }
    
    if (showProfileMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showProfileMenu])
  
  // 处理头像上传
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    // 检查文件类型
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      message.error('不支持的图片格式，请上传 JPG、PNG 或 WebP 格式')
      return
    }
    
    setAvatarUploading(true)
    
    const processUpload = async () => {
      try {
        // 压缩头像图片（使用较小的尺寸）
        const compressedBlob = await compressImage(file, {
          quality: 0.85,
          maxWidth: 200,
          maxWidthEnabled: true,
          mimeType: 'image/webp',
        })
        const compressedFile = new File([compressedBlob], file.name.replace(/\.\w+$/, '.webp'), { type: 'image/webp' })
        
        // 上传到 /about/avatar 目录，使用 S3 存储
        const resp = await uploadFile(compressedFile, '/about/avatar', 's3', '')
        
        if (resp.code === 200 && resp.data?.url) {
          const newAvatarUrl = resp.data.url
          setAvatarUrl(newAvatarUrl)
          
          // 保存头像到数据库
          await fetch('/api/v1/settings/update-custom-info', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aboutAvatarUrl: newAvatarUrl }),
          })
          
          // 清除缓存
          await fetch('/api/v1/settings/cache/clear')
          message.success('头像上传成功')
        } else {
          message.error('头像上传失败')
        }
      } catch (e) {
        console.error('头像上传失败:', e)
        message.error('头像上传失败')
      } finally {
        setAvatarUploading(false)
        event.target.value = ''
      }
    }
    
    processUpload()
  }
  
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
  
  // 加载已保存的头像 URL
  useEffect(() => {
    const fetchAvatarUrl = async () => {
      try {
        const resp = await fetch('/api/v1/settings/get-custom-info')
        const data = await resp.json()
        if (Array.isArray(data)) {
          const avatarConfig = data.find((item: { config_key: string; config_value: string }) => item.config_key === 'about_avatar_url')
          if (avatarConfig?.config_value) {
            setAvatarUrl(avatarConfig.config_value)
          }
        }
      } catch (e) {
        console.error('加载头像失败:', e)
      }
    }
    fetchAvatarUrl()
  }, [])
  
  const mainItems: SidebarItem[] = [
    { key: '/admin', label: t('Link.dashboard'), icon: DashboardOutlined },
    { key: '/admin/upload', label: t('Link.upload'), icon: UploadOutlined },
    { key: '/admin/list', label: t('Link.list'), icon: UnorderedListOutlined },
    { key: '/admin/album', label: t('Link.album'), icon: AppstoreOutlined },
    { key: '/admin/guides', label: '攻略管理', icon: BookOutlined },
  ]
  
  const settingsItems: SidebarItem[] = [
    { key: '/admin/settings/preferences', label: t('Link.preferences'), icon: SettingOutlined },
    { key: '/admin/settings/account', label: t('Link.account'), icon: UserOutlined },
    { key: '/admin/settings/tag', label: t('Link.tags'), icon: TagsOutlined },
    { key: '/admin/settings/storages', label: t('Link.storages'), icon: CloudOutlined },
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
            <CloseOutlined />
          ) : (
            <MenuOutlined />
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
              <LeftOutlined />
            </button>
          )}

          {collapsed && (
            <button
              onClick={toggleCollapse}
              className="hidden md:flex absolute right-2 p-1.5 rounded-md hover:bg-slate-100 transition-all duration-200"
              aria-label="Expand sidebar"
            >
              <RightOutlined />
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
              <CloseOutlined />
            </button>
          )}
        </div>

        {/* Search Bar */}
        {!collapsed && (
          <div className="px-4 py-3">
            <div className="relative">
              <SearchOutlined className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
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
                <HomeOutlined className="flex-shrink-0 text-slate-600 group-hover:text-slate-700" />
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

          {/* Profile Section - Dropdown */}
          <div className={cn('border-b border-slate-200 bg-slate-50/30 relative', collapsed ? 'py-3 px-2' : 'p-3')}>
            {!collapsed ? (
              <div className="profile-section">
                <div 
                  className="flex items-center px-3 py-2 rounded-md bg-white hover:bg-slate-50 transition-colors duration-200 cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <Avatar
                    size={32}
                    src={avatarUrl}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: !avatarUrl ? 'var(--admin-primary)' : undefined }}
                  />
                  <div className="flex-1 min-w-0 ml-2.5">
                    <p className="text-sm font-medium text-slate-800 truncate">{t('Admin.fallbackName')}</p>
                    <p className="text-xs text-slate-600 truncate">{t('Admin.fallbackEmail')}</p>
                  </div>
                  <div className="w-2 h-2 bg-green-500 rounded-full ml-2" title="Online" />
                </div>
                
                {showProfileMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button
                      onClick={() => {
                        router.push('/admin/settings/preferences')
                        setShowProfileMenu(false)
                        if (isMobile) setIsOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <SettingOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Settings.title')}</span>
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('sidebar-avatar-input')?.click()
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <CameraOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Admin.avatarManagement')}</span>
                    </button>
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={() => {
                        const currentLang = document.documentElement.lang
                        const newLang = currentLang === 'zh' ? 'en' : 'zh'
                        document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`
                        window.location.reload()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <GlobalOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Settings.language')}</span>
                    </button>
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogoutOutlined className="text-red-500" />
                      <span className="text-sm">{t('Login.logout')}</span>
                    </button>
                  </div>
                )}
                <input
                  id="sidebar-avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  style={{ display: 'none' }}
                />
              </div>
            ) : (
              <div className="profile-section">
                <div 
                  className="relative cursor-pointer"
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                >
                  <Avatar
                    size={36}
                    src={avatarUrl}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: !avatarUrl ? 'var(--admin-primary)' : undefined }}
                  />
                  <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                </div>
                
                {showProfileMenu && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50">
                    <button
                      onClick={() => {
                        router.push('/admin/settings/preferences')
                        setShowProfileMenu(false)
                        if (isMobile) setIsOpen(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <SettingOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Settings.title')}</span>
                    </button>
                    <button
                      onClick={() => {
                        document.getElementById('sidebar-avatar-input-collapsed')?.click()
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <CameraOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Admin.avatarManagement')}</span>
                    </button>
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={() => {
                        const currentLang = document.documentElement.lang
                        const newLang = currentLang === 'zh' ? 'en' : 'zh'
                        document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`
                        window.location.reload()
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-slate-50 transition-colors"
                    >
                      <GlobalOutlined className="text-slate-500" />
                      <span className="text-sm">{t('Settings.language')}</span>
                    </button>
                    <div className="border-t border-slate-200 my-1" />
                    <button
                      onClick={() => {
                        handleLogout()
                        setShowProfileMenu(false)
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors"
                    >
                      <LogoutOutlined className="text-red-500" />
                      <span className="text-sm">{t('Login.logout')}</span>
                    </button>
                  </div>
                )}
                <input
                  id="sidebar-avatar-input-collapsed"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  )
}

