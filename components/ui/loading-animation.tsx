'use client'

import { useEffect, useState } from 'react'
import type { CSSProperties, FC } from 'react'
import './loading-animation.css'

export interface LoadingAnimationProps {
  /**
   * 是否显示加载动效
   */
  visible?: boolean
  /**
   * 背景色（遮罩层颜色）
   * @default 'rgba(0, 0, 0, 0.5)'
   */
  backgroundColor?: string
  /**
   * 圆圈颜色
   * @default '#fff'
   */
  circleColor?: string
  /**
   * 阴影颜色
   * @default 'rgba(0, 0, 0, 0.9)'
   */
  shadowColor?: string
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 是否自动在页面加载完成后隐藏
   * @default true
   */
  autoHide?: boolean
  /**
   * 自动隐藏的延迟时间（毫秒）
   * @default 300
   */
  autoHideDelay?: number
}

/**
 * 加载动效组件
 * 基于 Uiverse.io by mobinkakei 的动效代码优化
 * 
 * @example
 * // 自动显示，页面加载完成后自动隐藏
 * <LoadingAnimation />
 * 
 * @example
 * // 手动控制显示
 * <LoadingAnimation visible={isLoading} />
 * 
 * @example
 * // 自定义颜色
 * <LoadingAnimation 
 *   backgroundColor="rgba(255, 255, 255, 0.8)"
 *   circleColor="#007bff"
 *   shadowColor="rgba(0, 123, 255, 0.5)"
 * />
 */
export const LoadingAnimation: FC<LoadingAnimationProps> = ({
  visible: controlledVisible,
  backgroundColor = 'rgba(0, 0, 0, 0.5)',
  circleColor = '#fff',
  shadowColor = 'rgba(0, 0, 0, 0.9)',
  className = '',
  autoHide = true,
  autoHideDelay = 300,
}) => {
  const [internalVisible, setInternalVisible] = useState(true)

  // 如果提供了 controlledVisible，使用受控模式
  const isVisible = controlledVisible !== undefined ? controlledVisible : internalVisible

  useEffect(() => {
    if (!autoHide || controlledVisible !== undefined) {
      return
    }

    // 页面加载完成后自动隐藏
    const handleLoad = () => {
      setTimeout(() => {
        setInternalVisible(false)
      }, autoHideDelay)
    }

    if (document.readyState === 'complete') {
      handleLoad()
    } else {
      window.addEventListener('load', handleLoad)
      return () => {
        window.removeEventListener('load', handleLoad)
      }
    }
  }, [autoHide, autoHideDelay, controlledVisible])

  if (!isVisible) {
    return null
  }

  const style = {
    '--loading-bg-color': backgroundColor,
    '--loading-circle-color': circleColor,
    '--loading-shadow-color': shadowColor,
  } as CSSProperties

  return (
    <div
      className={`loading-animation-overlay ${className}`}
      style={style}
      aria-label="加载中"
      role="status"
    >
      <div className="loading-animation-wrapper">
        <div className="loading-circle" />
        <div className="loading-circle" />
        <div className="loading-circle" />
        <div className="loading-shadow" />
        <div className="loading-shadow" />
        <div className="loading-shadow" />
      </div>
    </div>
  )
}

/**
 * 加载动效控制 Hook
 * 用于在异步操作中控制加载动效的显示和隐藏
 * 
 * @example
 * const { show, hide, isLoading } = useLoadingAnimation();
 * 
 * const fetchData = async () => {
 *   show();
 *   try {
 *     await fetch('/api/data');
 *   } finally {
 *     hide();
 *   }
 * };
 */
export const useLoadingAnimation = () => {
  const [isLoading, setIsLoading] = useState(false)

  const show = () => setIsLoading(true)
  const hide = () => setIsLoading(false)
  const toggle = () => setIsLoading((prev) => !prev)

  return {
    isLoading,
    show,
    hide,
    toggle,
  }
}

