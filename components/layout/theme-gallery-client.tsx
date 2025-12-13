'use client'

import { useState, useEffect } from 'react'
import type { ImageHandleProps } from '~/types/props'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import DefaultGallery from '~/components/layout/theme/default/main/default-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'
import { Button } from '~/components/ui/button'
import { LayoutGrid, Rows } from 'lucide-react'

interface ThemeGalleryClientProps extends ImageHandleProps {
  systemStyle: string
}

export default function ThemeGalleryClient({ systemStyle, ...props }: ThemeGalleryClientProps) {
  // 始终使用 systemStyle 作为初始值，避免 hydration 不匹配
  const [currentStyle, setCurrentStyle] = useState(systemStyle)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    // 从 localStorage 读取用户偏好主题
    const userTheme = localStorage.getItem('preferredTheme')
    if (userTheme) {
      setCurrentStyle(userTheme)
    }
  }, [])

  const toggleTheme = () => {
    // 如果当前是单列(1)，切换到瀑布流(2)
    // 如果当前是瀑布流(2)或默认(0)，切换到单列(1)
    const newStyle = currentStyle === '1' ? '2' : '1'
    setCurrentStyle(newStyle)
    localStorage.setItem('preferredTheme', newStyle)
  }

  const activeStyle = mounted ? currentStyle : systemStyle

  const getGalleryComponent = () => {
    if (activeStyle === '2') {
      return <WaterfallGallery {...props} />
    } else if (activeStyle === '1') {
      return <SimpleGallery {...props} />
    } else {
      return <DefaultGallery {...props} />
    }
  }

  return (
    <>
      {getGalleryComponent()}
      
      {/* Theme Toggle Button */}
      <div className="fixed bottom-8 right-8 z-50">
        <Button
          variant="outline"
          size="icon"
          className="h-12 w-12 rounded-full bg-background/80 backdrop-blur-sm shadow-lg border-border hover:bg-accent"
          onClick={toggleTheme}
          title={activeStyle === '1' ? "切换到瀑布流视图" : "切换到单列视图"}
        >
          {activeStyle === '1' ? <LayoutGrid className="h-5 w-5" /> : <Rows className="h-5 w-5" />}
        </Button>
      </div>
    </>
  )
}
