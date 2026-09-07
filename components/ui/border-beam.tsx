'use client'

import * as React from 'react'
import { motion, useReducedMotion } from 'motion/react'

export interface BorderBeamStop {
  color: string
  percent: number
}

export interface BorderBeamProps {
  /** 展示模式：beam = 光带段沿路径运动（默认）；orbit = 彗星光弧沿椭圆/胶囊边框匀速环绕 */
  variant?: 'beam' | 'orbit'
  /** 流光段长度（px），beam 模式有效 */
  size?: number
  /** 一圈动画时长（秒） */
  duration?: number
  /** 起始延迟（秒），beam 模式有效 */
  delay?: number
  /** 颜色：纯色字符串或渐变色标数组 */
  color?: string | BorderBeamStop[]
  /** 光带/圆环宽度（px） */
  lineWidth?: number
  /** 是否反向运动，beam 模式有效 */
  reverse?: boolean
  /** orbit 模式下环形遮罩圆角（如胶囊按钮 '9999px'），默认跟随父容器 */
  borderRadius?: number | string
  /** 附加到包裹容器的类名（可用于 hover 显隐等） */
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
}

const buildGradient = (color: BorderBeamProps['color']) => {
  if (!color) return undefined
  if (typeof color === 'string') {
    return `linear-gradient(to left, transparent, ${color}, transparent)`
  }
  const stops = color.map((s) => `${s.color} ${s.percent}%`).join(', ')
  return `linear-gradient(to left, transparent, ${stops}, transparent)`
}

/**
 * orbit 模式：把色标映射为圆锥渐变彗星（占约 70% 圆周，两端透明柔和过渡），
 * 通过动画旋转 --border-beam-angle 让彗星沿椭圆边框匀速环绕。
 */
const buildConicGradient = (color: BorderBeamProps['color']) => {
  if (!color) return undefined
  if (typeof color === 'string') {
    return `conic-gradient(from var(--border-beam-angle), transparent 0%, ${color} 10%, ${color} 45%, transparent 60%, transparent 100%)`
  }
  const stops = color
    .map((s) => `${s.color} ${(5 + s.percent * 0.6).toFixed(1)}%`)
    .join(', ')
  return `conic-gradient(from var(--border-beam-angle), transparent 0%, ${stops}, transparent 75%, transparent 100%)`
}

/**
 * 边框流光（antd 无此组件，本地实现）：
 *  - beam（默认）：一段渐变光带沿容器边框循环运动
 *  - orbit：彗星光弧沿椭圆/胶囊边框匀速环绕（适合圆角按钮）
 * prefers-reduced-motion 下自动隐藏。
 */
export const BorderBeam = ({
  variant = 'beam',
  size = 140,
  duration = 12,
  delay = 0,
  color,
  lineWidth = 2,
  reverse = false,
  borderRadius,
  className,
  style,
  children,
}: BorderBeamProps) => {
  const reduce = useReducedMotion()
  const gradient = variant === 'beam' ? buildGradient(color) : undefined
  const conicGradient = variant === 'orbit' ? buildConicGradient(color) : undefined
  const offsetPath = reverse
    ? `rect(0 auto auto 0 round ${size}px)`
    : `rect(auto auto 0 0 round ${size}px)`

  return (
    <div className={className} style={{ position: 'relative', ...style }}>
      {children}
      {!reduce && gradient && (
        <motion.div
          aria-hidden
          className="ant-border-beam"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: size,
            height: lineWidth,
            background: gradient,
            offsetPath,
            pointerEvents: 'none',
          }}
          initial={{ offsetDistance: reverse ? '100%' : '0%' }}
          animate={{ offsetDistance: reverse ? ['100%', '0%'] : ['0%', '100%'] }}
          transition={{ repeat: Infinity, ease: 'linear', duration, delay: -delay }}
        />
      )}
      {!reduce && conicGradient && (
        <div
          aria-hidden
          className="ant-border-beam-orbit"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            padding: lineWidth,
            background: conicGradient,
            // 仅保留 lineWidth 厚度的圆环区域，其余透明
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            animation: `border-beam-orbit-spin ${duration}s linear infinite`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
