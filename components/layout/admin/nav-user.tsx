'use client'

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from '~/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu'
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '~/components/ui/sidebar'
import { authClient } from '~/lib/auth-client'
import { useTheme } from 'next-themes'
import * as React from 'react'
import { useState } from 'react'
import { setUserLocale } from '~/lib/utils/locale'
import { useTranslations } from 'next-intl'
import { SunMoonIcon } from '~/components/icons/sun-moon'
import { SunMediumIcon } from '~/components/icons/sun-medium'
import { LanguagesIcon } from '~/components/icons/languages'
import { LogoutIcon } from '~/components/icons/logout'
import { ChevronsDownUpIcon } from '~/components/icons/chevrons-up-down'
import { CameraIcon } from '~/components/icons/camera'

export function NavUser() {
  const { isMobile } = useSidebar()
  const { resolvedTheme, setTheme } = useTheme()
  const { data: session } = authClient.useSession()
  const t = useTranslations()
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [defaultStorage, setDefaultStorage] = useState('')
  const VALID_STORAGES = new Set(['s3', 'cos', 'alist'])

  React.useEffect(() => {
    const load = async () => {
      try {
        const resp = await fetch('/api/v1/settings/get-custom-info')
        const data = await resp.json()
        if (Array.isArray(data)) {
          const storageConfig = data.find(
            (item: { config_key: string; config_value: string }) => item.config_key === 'default_storage'
          )
          const raw = (storageConfig?.config_value || '').trim().toLowerCase()
          setDefaultStorage(VALID_STORAGES.has(raw) ? raw : '')
        }
      } catch (e) {
        console.error('load default storage failed', e)
      }
    }
    load()
  }, [])

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp']
    if (!validTypes.includes(file.type)) {
      return
    }

    setAvatarUploading(true)

    try {
      const { compressImage } = await import('~/lib/utils/compress')
      const compressedFile = await compressImage(file, {
        quality: 0.85,
        maxWidth: 200,
        maxWidthEnabled: true,
        mimeType: 'image/webp',
      })

      if (!compressedFile) {
        return
      }

      const { uploadFile } = await import('~/lib/utils/file')
      const resp = await uploadFile(new File([compressedFile], 'avatar.webp', { type: 'image/webp' }), '/about/avatar', defaultStorage, '')
      
      if (resp.code === 200) {
        const saveResp = await fetch('/api/v1/settings/update-custom-info', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            aboutAvatarUrl: resp.data.url,
          }),
        })
        const saveData = await saveResp.json()
        if (saveData.code === 200) {
          await fetch('/api/v1/settings/cache/clear')
        }
      }
    } catch (e) {
      console.error('avatar upload failed', e)
    } finally {
      setAvatarUploading(false)
    }
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="space-x-2 data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground cursor-pointer"
            >
              <Avatar className="h-8 w-8 rounded-lg select-none">
                <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
                <AvatarFallback className="rounded-lg">CN</AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight select-none">
                <span className="truncate font-semibold">{session?.user?.name}</span>
                <span className="truncate text-xs">{session?.user?.email}</span>
              </div>
              <ChevronsDownUpIcon size={18} />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg"
            side={isMobile ? 'bottom' : 'right'}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={session?.user?.image ?? ''} alt={session?.user?.name ?? ''} />
                  <AvatarFallback className="rounded-lg">CN</AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold">{session?.user?.name}</span>
                  <span className="truncate text-xs">{session?.user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={() => {
              window.location.href = '/admin/settings/preferences'
            }}>
              <CameraIcon size={18} />
              <span>{t('Settings.title')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => {
              document.getElementById('sidebar-avatar-input')?.click()
            }}>
              <CameraIcon size={18} />
              <span>{t('Admin.avatarManagement')}</span>
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer" onClick={() => setTheme(resolvedTheme === 'light' ? 'dark' : 'light')}>
              {resolvedTheme === 'light' ? <SunMoonIcon size={18} /> : <SunMediumIcon size={18} />}
              <span>{ resolvedTheme === 'light' ? t('Button.dark') : t('Button.light') }</span>
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger className="cursor-pointer"><LanguagesIcon size={18} />{t('Button.language')}</DropdownMenuSubTrigger>
              <DropdownMenuPortal>
                <DropdownMenuSubContent>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('zh')}>简体中文</DropdownMenuItem>
                  <DropdownMenuItem className="cursor-pointer" onClick={() => setUserLocale('en')}>English</DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuPortal>
            </DropdownMenuSub>
            <input
              id="sidebar-avatar-input"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarUpload}
              disabled={avatarUploading}
              style={{ display: 'none' }}
            />
            <DropdownMenuItem className="cursor-pointer" onClick={async () => {
              try {
                await authClient.signOut({
                  fetchOptions: {
                    onSuccess: () => {
                      location.replace('/login')
                    },
                  },
                })
              } catch {
                 
                console.error('logout failed')
              }
            }}>
              <LogoutIcon size={18} />
              {t('Login.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
