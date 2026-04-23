'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Command from '~/components/layout/command'
import { authClient } from '~/lib/auth-client'
import { useTheme } from 'next-themes'
import { cn } from '~/lib/utils'
import type { AlbumType } from '~/types'
import { 
  SunIcon, 
  MoonIcon, 
  HamburgerMenuIcon,
  Cross1Icon
} from '@radix-ui/react-icons'

interface UnifiedNavProps {
  albums: AlbumType[]
  currentAlbum?: string
  currentTheme?: string
  siteTitle?: string
}

export default function UnifiedNav({
  albums,
  currentAlbum = '/',
  currentTheme = '2',
  siteTitle = 'XPhotos',
}: UnifiedNavProps) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const pathname = usePathname()
  const t = useTranslations()
  const { data: session } = authClient.useSession()
  const { resolvedTheme, setTheme } = useTheme()

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  const navLinks = [
    { name: '序章', href: '/' },
    { name: '城隅寻迹', href: '/covers' },
    { name: '景行集', href: '/albums' },
    { name: '攻略路书', href: '/guides' },
    { name: '数据一览', href: '/dashboard' },
    { name: '关于我', href: '/about' },
  ]

  const visibleAlbums = albums.filter((album) => album.album_value !== '/' && album.show === 0)

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  // 移除 isDashboardActive 函数，因为现在数据一览已经包含在 navLinks 中

  return (
    <>
      <nav
        className={cn(
          'w-full fixed top-0 left-0 z-50 transition-all duration-300 h-16',
          'backdrop-blur-[12px] bg-background/15 border-b border-transparent',
          isScrolled && 'border-b-[1px] border-white/10 shadow-lg'
        )}
        style={{
          borderBottomImage: isScrolled ? 'linear-gradient(to right, var(--primary), var(--secondary)) 1' : 'none'
        }}
      >
        <div className="max-w-[1200px] mx-auto h-full flex items-center justify-between px-5">
          {/* Logo */}
          <Link href="/" className="flex-shrink-0 group">
            <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[var(--primary)] to-[var(--secondary)] tracking-tight group-hover:opacity-80 transition-opacity">
              {siteTitle}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-7">
            {navLinks.map((link) => (
              <div key={link.href} className="h-[30px] min-w-[60px] px-4 flex justify-center items-center relative">
                <Link
                  href={link.href}
                  className={cn(
                    'transition-all duration-200',
                    isActive(link.href)
                      ? 'text-primary font-semibold relative flex flex-col justify-center items-center'
                      : 'font-normal text-muted-foreground hover:text-primary hover:font-semibold'
                  )}
                >
                  <span className="relative z-10">{link.name}</span>
                  {isActive(link.href) && (
                    <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary rounded-full transition-all duration-300" />
                  )}
                </Link>
              </div>
            ))}

            {/* Console / Login */}
            <div className="h-[30px] min-w-[60px] px-4 flex justify-center items-center">
              <Link
                href={session ? '/admin' : '/login'}
                className={cn(
                  'transition-all duration-200',
                  isActive('/admin') || isActive('/login')
                    ? 'text-primary font-semibold'
                    : 'font-normal text-muted-foreground hover:text-primary hover:font-semibold'
                )}
              >
                {session ? t('Link.dashboard') : t('Login.signIn')}
              </Link>
            </div>

            {/* Dark Mode Toggle */}
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-foreground/70" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-foreground/70" />
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-2">
            {mounted && (
              <button
                onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="w-5 h-5 text-foreground/70" />
                ) : (
                  <MoonIcon className="w-5 h-5 text-foreground/70" />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 hover:bg-muted rounded-md transition-colors touch-manipulation"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <Cross1Icon className="w-6 h-6 text-foreground" />
              ) : (
                <HamburgerMenuIcon className="w-6 h-6 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-background lg:hidden overflow-y-auto pt-16"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div className="flex flex-col px-6 pb-10" onClick={(e) => e.stopPropagation()}>
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'py-3 border-b border-border last:border-b-0',
                  'text-lg font-medium transition-colors',
                  isActive(link.href)
                    ? 'text-primary'
                    : 'text-foreground/60 hover:text-primary'
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.name}
              </Link>
            ))}

            {/* Albums Section */}
            {visibleAlbums.length > 0 && (
              <>
                <div className="pt-4 pb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground mt-2">
                  相册
                </div>
                <div className="grid grid-cols-2 gap-1">
                  {visibleAlbums.map((album) => (
                    <Link
                      key={album.id}
                      href={album.album_value}
                      className="py-2.5 px-3 text-sm text-foreground/60 hover:text-primary hover:bg-muted/50 rounded transition-colors"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {album.name}
                    </Link>
                  ))}
                </div>
              </>
            )}

            <div className="h-px bg-border my-5" />

            <Link
              href={session ? '/admin' : '/login'}
              className="py-3 text-lg font-medium text-foreground/80 hover:text-primary transition-colors"
              onClick={() => setMobileMenuOpen(false)}
            >
              {session ? t('Link.dashboard') : t('Login.signIn')}
            </Link>
          </div>
        </div>
      )}

      <Command data={albums} />
    </>
  )
}
