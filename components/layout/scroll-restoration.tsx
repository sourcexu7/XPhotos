'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

export default function ScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    if (typeof window === 'undefined') return

    const key = `scroll:${pathname}`

    const saved = sessionStorage.getItem(key)
    if (saved) {
      const y = Number(saved)
      if (!Number.isNaN(y)) {
        requestAnimationFrame(() => {
          window.scrollTo(0, y)
        })
      }
    }

    const onScroll = () => {
      sessionStorage.setItem(key, String(window.scrollY))
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      sessionStorage.setItem(key, String(window.scrollY))
    }
  }, [pathname])

  return null
}

