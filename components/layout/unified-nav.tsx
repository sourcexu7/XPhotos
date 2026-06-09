'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import Command from '~/components/layout/command'
import { authClient } from '~/lib/auth-client'
import { useTheme } from 'next-themes'
import { useUserThemeToggle } from '~/lib/theme/use-user-theme-toggle'
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
  hideThemeToggle?: boolean
}

export default function UnifiedNav({
  albums,
  siteTitle = 'XPhotos',
  hideThemeToggle = false,
}: UnifiedNavProps & {
  albums: any[]
  siteTitle?: string
  hideThemeToggle?: boolean
}) {
  const [isScrolled, setIsScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)
  const pathname = usePathname()
  const t = useTranslations()
  const { data: session } = authClient.useSession()
  const { resolvedTheme } = useTheme()
  const { toggle } = useUserThemeToggle()
  const navRef = useRef<HTMLElement>(null)
  // 首页也允许切换主题（默认仍会是 dark，但用户可以主动切 light）
  const shouldHideThemeToggle = hideThemeToggle

  const handleToggle = useCallback(() => {
    toggle()
  }, [toggle])

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
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
    { name: '关于我', href: '/about' },
  ]

  const visibleAlbums = albums.filter((album) => album.album_value !== '/' && album.show === 0)

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <>
      <nav
        ref={navRef}
        className={cn(
          'w-full fixed top-0 left-0 z-50 transition-all duration-500 ease-out h-14',
          isScrolled
            ? 'bg-background/80 backdrop-blur-2xl border-b border-border/30 shadow-[0_1px_0_0_rgba(0,0,0,0.03)] dark:shadow-[0_1px_0_0_rgba(255,255,255,0.03)]'
            : 'bg-transparent border-b border-transparent'
        )}
      >
        <div className="max-w-[1400px] mx-auto h-full flex items-center justify-between px-8">
          {/* Logo — serif for editorial character */}
          <Link href="/" className="flex-shrink-0 group relative">
            <span className="text-[22px] font-serif font-medium text-foreground tracking-[-0.02em] group-hover:opacity-60 transition-opacity duration-300">
              {siteTitle}
            </span>
          </Link>

          {/* Desktop Navigation — spacious, refined */}
          <div className="hidden lg:flex items-center">
            {navLinks.map((link, index) => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onMouseEnter={() => setHoveredIndex(index)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={cn(
                    'relative px-4 py-1.5 text-[15px] tracking-[0.02em] transition-all duration-300 ease-out',
                    active
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground font-normal hover:text-foreground'
                  )}
                >
                  <span className="relative z-10">{link.name}</span>
                  {/* Active indicator — elegant dot */}
                  {active && (
                    <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-[3px] h-[3px] rounded-full bg-primary transition-all duration-500" />
                  )}
                  {/* Hover background — subtle pill */}
                  {!active && hoveredIndex === index && (
                    <span className="absolute inset-0 rounded-full bg-muted/60 transition-all duration-300" />
                  )}
                </Link>
              )
            })}

            {/* Separator */}
            <span className="mx-3 h-3 w-px bg-border/60" />

            {/* Console / Login */}
            <Link
              href={session ? '/admin' : '/login'}
              className={cn(
                'px-4 py-1.5 text-[15px] tracking-[0.02em] transition-all duration-300',
                isActive('/admin') || isActive('/login')
                  ? 'text-foreground font-medium'
                  : 'text-muted-foreground font-normal hover:text-foreground'
              )}
            >
              {session ? t('Link.dashboard') : t('Login.signIn')}
            </Link>

            {/* Dark Mode Toggle — minimal icon */}
            {mounted && !shouldHideThemeToggle && (
              <button
                onClick={handleToggle}
                className="ml-2 inline-flex items-center justify-center w-9 h-9 rounded-full hover:bg-muted/60 transition-all duration-300"
                style={{ touchAction: 'manipulation' }}
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                type="button"
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="w-4 h-4 text-foreground" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-foreground" />
                )}
              </button>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center gap-1">
            {mounted && !shouldHideThemeToggle && (
              <button
                onClick={handleToggle}
                className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted/60 transition-all duration-300"
                style={{ touchAction: 'manipulation' }}
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
                type="button"
              >
                {resolvedTheme === 'dark' ? (
                  <SunIcon className="w-4 h-4 text-foreground" />
                ) : (
                  <MoonIcon className="w-4 h-4 text-foreground" />
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full hover:bg-muted/60 transition-all duration-300"
              aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileMenuOpen ? (
                <Cross1Icon className="w-4 h-4 text-foreground" />
              ) : (
                <HamburgerMenuIcon className="w-4 h-4 text-foreground" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu — editorial slide-down */}
      <div
        className={cn(
          'fixed inset-0 z-40 lg:hidden overflow-y-auto pt-14 transition-all duration-500 ease-out',
          mobileMenuOpen
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        )}
        onClick={() => setMobileMenuOpen(false)}
      >
        <div
          className={cn(
            'min-h-full bg-background/95 backdrop-blur-2xl transition-transform duration-500 ease-out',
            mobileMenuOpen ? 'translate-y-0' : '-translate-y-4'
          )}
        >
          <div className="flex flex-col px-8 pt-8 pb-12 max-w-md mx-auto" onClick={(e) => e.stopPropagation()}>
            {/* Nav links — editorial typography */}
            <div className="space-y-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'block py-3 text-[22px] font-serif tracking-[-0.01em] transition-all duration-300',
                    isActive(link.href)
                      ? 'text-foreground font-medium'
                      : 'text-muted-foreground hover:text-foreground hover:pl-2'
                  )}
                  style={{ transitionDelay: mobileMenuOpen ? `${i * 40}ms` : '0ms' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-baseline gap-3">
                    {isActive(link.href) && (
                      <span className="inline-block w-[5px] h-[5px] rounded-full bg-primary flex-shrink-0 relative top-[-2px]" />
                    )}
                    {link.name}
                  </span>
                </Link>
              ))}
            </div>

            {/* Albums Section */}
            {visibleAlbums.length > 0 && (
              <div className="mt-8 pt-6 border-t border-border/40">
                <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-muted-foreground/60">
                  相册
                </span>
                <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1">
                  {visibleAlbums.map((album) => (
                    <Link
                      key={album.id}
                      href={album.album_value}
                      className="py-2 text-[13px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {album.name}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Login / Console */}
            <div className="mt-8 pt-6 border-t border-border/40">
              <Link
                href={session ? '/admin' : '/login'}
                className="text-[15px] text-muted-foreground hover:text-foreground transition-colors duration-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {session ? t('Link.dashboard') : t('Login.signIn')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Command data={albums} />
    </>
  )
}
