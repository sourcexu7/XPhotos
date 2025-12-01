'use client'

import { useState, useEffect } from 'react'
import type { ImageHandleProps } from '~/types/props'
import SimpleGallery from '~/components/layout/theme/simple/main/simple-gallery'
import DefaultGallery from '~/components/layout/theme/default/main/default-gallery'
import WaterfallGallery from '~/components/layout/theme/waterfall/main/waterfall-gallery'

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

  // 在挂载前使用服务端的主题，避免 hydration 错误
  if (!mounted) {
    if (systemStyle === '2') {
      return <WaterfallGallery {...props} />
    } else if (systemStyle === '1') {
      return <SimpleGallery {...props} />
    } else {
      return <DefaultGallery {...props} />
    }
  }

  // 挂载后使用用户选择的主题
  if (currentStyle === '2') {
    return <WaterfallGallery {...props} />
  } else if (currentStyle === '1') {
    return <SimpleGallery {...props} />
  } else {
    return <DefaultGallery {...props} />
  }
}
