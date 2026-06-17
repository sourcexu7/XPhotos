/**
 * 统一顶部栏组件
 * 遵循 21st.dev 设计规范
 */

'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { SettingOutlined, LogoutOutlined, MenuOutlined, MoonOutlined, SunOutlined, CameraOutlined, GlobalOutlined, UserOutlined } from '@ant-design/icons'
import { useTheme } from 'next-themes'
import { Avatar, message } from 'antd'
import { clearAllAuthData } from '~/lib/utils/auth-utils'
import { uploadFile } from '~/lib/utils/file'
import { compressImage } from '~/lib/utils/compress'

interface AdminHeaderProps {
  onMenuClick?: () => void
  showMenuButton?: boolean
}

export function AdminHeader({ onMenuClick, showMenuButton = false }: AdminHeaderProps) {
  const t = useTranslations()
  const router = useRouter()
  const { setTheme, resolvedTheme } = useTheme()
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [defaultStorage, setDefaultStorage] = useState('')
  const VALID_STORAGES = new Set(['s3', 'cos', 'alist'])
  
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
          const storageConfig = data.find((item: { config_key: string; config_value: string }) => item.config_key === 'default_storage')
          const raw = (storageConfig?.config_value || '').trim().toLowerCase()
          setDefaultStorage(VALID_STORAGES.has(raw) ? raw : '')
        }
      } catch (e) {
        console.error('加载头像失败:', e)
      }
    }
    fetchAvatarUrl()
  }, [])
  
  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    
    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      message.error('不支持的图片格式')
      return
    }
    
    setAvatarUploading(true)
    
    const processUpload = async () => {
      try {
        const compressedBlob = await compressImage(file, {
          quality: 0.85,
          maxWidth: 200,
          maxWidthEnabled: true,
          mimeType: 'image/webp',
        })
        const compressedFile = new File([compressedBlob], 'avatar.webp', { type: 'image/webp' })
        
        const resp = await uploadFile(compressedFile, '/about/avatar', defaultStorage, '')
        
        if (resp.code === 200 && resp.data?.url) {
          const newAvatarUrl = resp.data.url
          setAvatarUrl(newAvatarUrl)
          
          await fetch('/api/v1/settings/update-custom-info', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aboutAvatarUrl: newAvatarUrl }),
          })
          
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
              <MenuOutlined />
            </button>
          )}
        </div>
        
        {/* 右侧：仅保留主题切换与用户菜单，移除铃铛、搜索、头像文字 */}
        <div className="flex items-center gap-3">
          {/* 主题切换 */}
          <button
            onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-[var(--admin-radius-md)] hover:bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] hover:text-[var(--admin-primary)] transition-colors"
            title={resolvedTheme === 'dark' ? t('Button.light') : t('Button.dark')}
          >
            {resolvedTheme === 'dark' ? (
              <SunOutlined />
            ) : (
              <MoonOutlined />
            )}
          </button>

          {/* 用户菜单：圆形头像 */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 px-2 py-1.5 rounded-[var(--admin-radius-md)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
              aria-label="用户菜单"
            >
              <Avatar
                size={36}
                src={avatarUrl}
                icon={<UserOutlined />}
                style={{ backgroundColor: !avatarUrl ? 'var(--admin-primary)' : undefined }}
              />
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
                    <SettingOutlined />
                    <span>{t('Settings.title')}</span>
                  </button>
                  <button
                    onClick={() => {
                      document.getElementById('header-avatar-input')?.click()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
                  >
                    <CameraOutlined />
                    <span>{t('Admin.avatarManagement')}</span>
                  </button>
                  <button
                    onClick={() => {
                      const currentLang = document.documentElement.lang
                      const newLang = currentLang === 'zh' ? 'en' : 'zh'
                      document.cookie = `NEXT_LOCALE=${newLang};path=/;max-age=31536000`
                      window.location.reload()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
                  >
                    <GlobalOutlined />
                    <span>{t('Settings.language')}</span>
                  </button>
                  <button
                    onClick={() => {
                      handleLogout()
                      setShowUserMenu(false)
                    }}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--admin-error)] hover:bg-[var(--admin-error-light)] transition-colors"
                  >
                    <LogoutOutlined />
                    <span>{t('Button.logout')}</span>
                  </button>
                </div>
                <input
                  id="header-avatar-input"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                  style={{ display: 'none' }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}

