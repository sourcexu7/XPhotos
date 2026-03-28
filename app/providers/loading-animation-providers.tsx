'use client'

import { LoadingAnimation } from '~/components/ui/loading-animation'
import { useState, useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'

export function LoadingAnimationProviders({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const pathname = usePathname()
  const prevPathnameRef = useRef<string | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  // 客户端挂载
  useEffect(() => {
    setMounted(true)
  }, [])

  // 监听路由变化，显示加载动画
  useEffect(() => {
    if (!mounted) return

    // 清除之前的定时器
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // 路由变化时显示加载动画
    const isRouteChange = prevPathnameRef.current !== null && prevPathnameRef.current !== pathname
    
    if (isRouteChange) {
      setIsLoading(true)
    }

    // 延迟隐藏加载动画，给页面内容时间加载
    // 使用 requestAnimationFrame 确保在 DOM 更新后执行
    const rafId = requestAnimationFrame(() => {
      timeoutRef.current = setTimeout(() => {
        setIsLoading(false)
      }, 300) // 300ms 延迟，确保页面内容已开始渲染
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

