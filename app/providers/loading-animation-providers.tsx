'use client'

import { LoadingAnimation } from '~/components/ui/loading-animation'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function LoadingAnimationProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const prevPathnameRef = useRef<string | null>(null)
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 标记本次路由变化是否由浏览器返回/前进（popstate）触发，若是则跳过中间加载动效
  const isPopstateRef = useRef(false)

  // 客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 监听浏览器返回/前进，避免中间显示加载动效
  useEffect(() => {
    if (typeof window === 'undefined') return
    const handlePopstate = () => {
      isPopstateRef.current = true
    }
    window.addEventListener('popstate', handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
    }
  }, [])

  // 监听路由变化，显示加载动画（浏览器返回/前进时跳过）
  useEffect(() => {
    if (!mounted) return

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    const isRouteChange = prevPathnameRef.current !== null && prevPathnameRef.current !== pathname

    // 本次若是浏览器返回/前进触发的路由变化：不显示中间加载动效
    if (isRouteChange && isPopstateRef.current) {
      isPopstateRef.current = false
      setIsLoading(false)
    } else if (isRouteChange) {
      setIsLoading(true)
    }

    // 延迟隐藏加载动画，给页面内容时间加载
    const rafId = requestAnimationFrame(() => {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 300)
    })

    // 更新路径引用
    prevPathnameRef.current = pathname

    return () => {
      cancelAnimationFrame(rafId)
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [pathname, mounted])

  // 首次页面加载完成后隐藏动画
  useEffect(() => {
    if (!mounted) return

    const handleLoad = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 300)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => {
        window.removeEventListener('load', handleLoad)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }
  }, [mounted])

  return (
    <>
      {mounted && <LoadingAnimation visible={isLoading} />}
      {children}
    </>
  )
}

