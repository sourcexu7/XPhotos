'use client'

import React, { useState, useEffect } from 'react'
import { Avatar, Dropdown, Space, Tooltip, Button, Menu, message } from 'antd'
import { UserOutlined, LogoutOutlined, SettingOutlined, BulbOutlined, GlobalOutlined, CameraOutlined } from '@ant-design/icons'
import { useTranslations } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useTheme } from 'next-themes'
import { useUserThemeToggle } from '~/lib/theme/use-user-theme-toggle'
import { clearAllAuthData } from '~/lib/utils/auth-utils'
import { setUserLocale } from '~/lib/utils/locale'
import { uploadFile } from '~/lib/utils/file'
import { compressImage } from '~/lib/utils/compress'

const AVATAR_INPUT_ID = 'admin-topbar-avatar-input'
const VALID_STORAGES = new Set(['s3', 'cos', 'alist'])

export default function AdminAntTopbar() {
  const t = useTranslations()
  const router = useRouter()
  const { resolvedTheme } = useTheme()
  const { toggle } = useUserThemeToggle()
  const [mounted, setMounted] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [defaultStorage, setDefaultStorage] = useState('')
  const [storageReady, setStorageReady] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const loadInfo = async () => {
      try {
        const resp = await fetch('/api/v1/settings/get-custom-info')
        const data = await resp.json()
        if (Array.isArray(data)) {
          const avatarConfig = data.find(
            (item: { config_key: string; config_value: string }) => item.config_key === 'about_avatar_url'
          )
          if (avatarConfig?.config_value) {
            setAvatarUrl(avatarConfig.config_value)
          }
          const storageConfig = data.find(
            (item: { config_key: string; config_value: string }) => item.config_key === 'default_storage'
          )
          const raw = (storageConfig?.config_value || '').trim().toLowerCase()
          const resolved = VALID_STORAGES.has(raw) ? raw : ''
          setDefaultStorage(resolved)
          setStorageReady(true)
        }
      } catch (e) {
        console.error('加载头像/存储配置失败:', e)
        setStorageReady(true)
      }
    }
    loadInfo()
  }, [])

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!['image/jpeg', 'image/png', 'image/jpg', 'image/webp'].includes(file.type)) {
      message.error('不支持的图片格式')
      return
    }

    if (!storageReady) {
      message.error('存储配置加载中，请稍后再试')
      return
    }
    if (!defaultStorage) {
      message.error('请先在「偏好设置」选择默认存储类型（S3 / COS / AList）')
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

          const updateResp = await fetch('/api/v1/settings/update-custom-info', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ aboutAvatarUrl: newAvatarUrl }),
          })
          const updateJson = await updateResp.json().catch(() => ({}))
          if (updateJson?.code !== 200) {
            throw new Error('保存头像 URL 失败')
          }

          await fetch('/api/v1/settings/cache/clear', { method: 'POST' })
          message.success('头像上传成功')
        } else {
          message.error('头像上传失败')
        }
      } catch (e) {
        console.error('头像上传失败:', e)
        message.error(e instanceof Error ? e.message : '头像上传失败')
      } finally {
        setAvatarUploading(false)
        event.target.value = ''
      }
    }

    processUpload()
  }

  const localeSubMenu: Menu['items'] = [
    { key: 'zh', label: t('Language.chinese'), onClick: async () => { await setUserLocale('zh'); window.location.reload() } },
    { key: 'en', label: t('Language.english'), onClick: async () => { await setUserLocale('en'); window.location.reload() } },
  ]

  const menuItems = [
    { key: 'settings', icon: <SettingOutlined />, label: t('Link.preferences'), onClick: () => router.push('/admin/settings/preferences') },
    { key: 'avatar', icon: <CameraOutlined />, label: t('Admin.avatarManagement'), onClick: () => {
      document.getElementById(AVATAR_INPUT_ID)?.click()
    } },
    { type: 'divider' as const },
    { key: 'language', icon: <GlobalOutlined />, label: t('Button.language'), children: localeSubMenu },
    { key: 'logout', icon: <LogoutOutlined />, label: t('Button.logout'), onClick: async () => {
      try {
        await fetch('/api/v1/auth/logout', { method: 'POST' })
      } catch (e) {
        console.error('logout failed', e)
      } finally {
        clearAllAuthData()
        window.location.href = '/login'
      }
    } },
  ]

  const isDark = resolvedTheme === 'dark'

  return (
    <Space size="large" align="center">
      {mounted ? (
        <Tooltip title={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}>
          <Button
            type="text"
            shape="circle"
            icon={<BulbOutlined />}
            onClick={toggle}
            aria-label={isDark ? t('Theme.lightMode') : t('Theme.darkMode')}
          />
        </Tooltip>
      ) : (
        <Button type="text" shape="circle" disabled style={{ opacity: 0, cursor: 'default' }} aria-label={t('ImageComponent.loading')}>
          <BulbOutlined />
        </Button>
      )}

      <Dropdown menu={{ items: menuItems }} placement="bottomRight">
        <Avatar
          src={avatarUrl || undefined}
          icon={<UserOutlined />}
          style={{ cursor: 'pointer' }}
        />
      </Dropdown>

      <input
        id={AVATAR_INPUT_ID}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleAvatarUpload}
        disabled={avatarUploading}
        style={{ display: 'none' }}
      />
    </Space>
  )
}
