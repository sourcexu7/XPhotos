/**
 * 图片加载动效组件（内联版本）
 * 用于在图片加载时显示加载动效，不占用全屏
 */

'use client'

import type { CSSProperties, FC } from 'react'
import './loading-animation.css'

export interface ImageLoadingAnimationProps {
  /**
   * 是否显示加载动效
   */
  visible?: boolean
  /**
   * 加载器颜色（旋转圆点的颜色）
   * @default '#fff'
   */
  circleColor?: string
  /**
   * 阴影颜色（已废弃，新动画样式不再使用）
   * @deprecated 新动画样式不再使用阴影颜色
   */
  shadowColor?: string
  /**
   * 自定义类名
   */
  className?: string
  /**
   * 尺寸大小
   * @default 'medium'
   */
  size?: 'small' | 'medium' | 'large'
}

/**
 * 图片加载动效组件（内联版本）
 * 用于在图片加载时显示加载动效
 * 使用旋转圆点加载器动画（From Uiverse.io by david-mohseni）
 */
export const ImageLoadingAnimation: FC<ImageLoadingAnimationProps> = ({
  visible = true,
  circleColor = 'rgb(128, 128, 128)',
  shadowColor, // 保留参数以保持向后兼容，但不再使用
  className = '',
  size = 'medium',
}) => {
  if (!visible) {
    return null
  }

  const sizeClasses = {
    small: 'scale-50',
    medium: 'scale-75',
    large: 'scale-100',
  }

  const style = {
    '--image-loader-color': circleColor,
  } as CSSProperties

  return (
    <div
      className={`image-loading-animation-container ${sizeClasses[size]} ${className}`}
      style={style}
      aria-label="图片加载中"
      role="status"
    >
      <div className="image-loader">
        <div className="bar1" />
        <div className="bar2" />
        <div className="bar3" />
        <div className="bar4" />
        <div className="bar5" />
        <div className="bar6" />
        <div className="bar7" />
        <div className="bar8" />
        <div className="bar9" />
        <div className="bar10" />
        <div className="bar11" />
        <div className="bar12" />
      </div>
    </div>
  )
}

