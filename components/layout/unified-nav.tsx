'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter, usePathname } from 'next/navigation'
import { Affix } from 'antd'
import { useTranslations } from 'next-intl'
import Command from '~/components/layout/command'
import { authClient } from '~/lib/auth-client'
import { useTheme } from 'next-themes'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '~/lib/utils'
import type { AlbumType } from '~/types'
import { 
  HomeIcon, 
  ImageIcon,
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
  const router = useRouter()
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

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [pathname])

  // Bug修复：导航顺序要求「相册分类」之后再放「关于我」，且倒数第二
  const navLinks = [
    { name: '首页', href: '/', icon: <HomeIcon className="w-4 h-4" /> },
    { name: '作品画廊', href: '/albums', icon: <ImageIcon className="w-4 h-4" /> },
  ]

  // Filter albums for the dropdown/list
  const visibleAlbums = albums.filter((album) => album.album_value !== '/' && album.show === 0)

  const isActive = (path: string) => {
    if (path === '/') return pathname === '/'
    return pathname.startsWith(path)
  }

  return (
    <>
      <Affix offsetTop={0}>
        <nav
          className={cn(
            'w-full h-[60px] fixed top-0 left-0 z-50 transition-all duration-300',
            'backdrop-blur-[12px] bg-[#1a1a1a]/15 border-b border-transparent',
            isScrolled && 'border-b-[1px] border-white/10 shadow-lg'
          )}
          style={{
            borderBottomImage: isScrolled ? 'linear-gradient(to right, #9d4edd, #ff9505) 1' : 'none'
          }}
        >
          <div className="max-w-[1400px] mx-auto px-4 h-full flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex-shrink-0 group">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505] tracking-tight group-hover:opacity-80 transition-opacity">
                {siteTitle}
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="relative group py-2"
                >
                  <span 
                    className={cn(
                      'text-[16px] transition-all duration-300 block',
                      isActive(link.href) 
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505] font-medium'
                        : 'text-[#e0e0e0] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9d4edd] group-hover:to-[#ff9505] group-hover:translate-x-[5px]'
                    )}
                  >
                    {link.name}
                  </span>
                  {isActive(link.href) && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9d4edd] to-[#ff9505]"
                    />
                  )}
                </Link>
              ))}

              {/* Albums Button (click to covers) */}
              <Link
                href="/covers"
                className="relative group py-2"
              >
                <span
                  className={cn(
                    'text-[16px] transition-all duration-300 block select-none',
                    isActive('/covers')
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505] font-medium'
                      : 'text-[#e0e0e0] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9d4edd] group-hover:to-[#ff9505] group-hover:translate-x-[5px]',
                  )}
                >
                  相册分类
                </span>
                {isActive('/covers') && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9d4edd] to-[#ff9505]"
                  />
                )}
              </Link>

              {/* 关于我：放在相册分类之后、倒数第二 */}
              <Link
                href="/about"
                className="relative group py-2"
              >
                <span
                  className={cn(
                    'text-[16px] transition-all duration-300 block select-none',
                    isActive('/about')
                      ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505] font-medium'
                      : 'text-[#e0e0e0] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9d4edd] group-hover:to-[#ff9505] group-hover:translate-x-[5px]',
                  )}
                >
                  关于我
                </span>
                {isActive('/about') && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 w-full h-[2px] bg-gradient-to-r from-[#9d4edd] to-[#ff9505]"
                  />
                )}
              </Link>

              {/* Console / Login */}
              <Link
                href={session ? '/admin' : '/login'}
                className="relative group py-2"
              >
                 <span className={cn(
                      'text-[16px] transition-all duration-300 block',
                      isActive('/admin') || isActive('/login')
                        ? 'bg-clip-text text-transparent bg-gradient-to-r from-[#9d4edd] to-[#ff9505] font-medium'
                        : 'text-[#e0e0e0] group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#9d4edd] group-hover:to-[#ff9505] group-hover:translate-x-[5px]'
                    )}>
                    {session ? t('Link.dashboard') : t('Login.signIn')}
                 </span>
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-[#e0e0e0] hover:text-white transition-colors"
              >
                {mobileMenuOpen ? <Cross1Icon className="w-6 h-6" /> : <HamburgerMenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </nav>
      </Affix>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-[#0f172a]/95 backdrop-blur-xl pt-[80px] px-6 md:hidden overflow-y-auto"
          >
              <div className="flex flex-col space-y-6 pb-10">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-2xl font-medium text-gray-200 hover:text-white"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
              <Link
                href="/covers"
                className="text-2xl font-medium text-gray-200 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                相册分类
              </Link>
              <Link
                href="/about"
                className="text-2xl font-medium text-gray-200 hover:text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                关于我
              </Link>
              
              <div className="text-sm text-gray-500 uppercase tracking-wider mt-4">相册</div>
              <div className="grid grid-cols-2 gap-4">
                {visibleAlbums.map(album => (
                  <Link
                    key={album.id}
                    href={album.album_value}
                    className="text-lg text-gray-300 hover:text-white"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {album.name}
                  </Link>
                ))}
              </div>

              <div className="h-[1px] bg-white/10 my-4" />

              <Link
                href={session ? '/admin' : '/login'}
                className="text-xl text-gray-200"
                onClick={() => setMobileMenuOpen(false)}
              >
                {session ? t('Link.dashboard') : t('Login.signIn')}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <Command data={albums} />
    </>
  )
}
