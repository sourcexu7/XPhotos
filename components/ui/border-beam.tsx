'use client'

import * as React from 'react'
import { useReducedMotion } from 'motion/react'

export interface BorderBeamStop {
  color: string
  percent: number
}

export interface BorderBeamProps {
  /** 展示模式：beam = 光带沿边框循环（默认）；orbit = 彗星光弧沿椭圆/胶囊边框匀速环绕 */
  variant?: 'beam' | 'orbit'
  /** 流光段长度（px），beam 模式按实测周长换算为弧长占比，跨屏幕尺寸保持物理长度 */
  size?: number
  /** 一圈动画时长（秒） */
  duration?: number
  /** 起始延迟（秒），负向偏移即从中途开始 */
  delay?: number
  /** 颜色：纯色字符串或渐变色标数组 */
  color?: string | BorderBeamStop[]
  /** 光带/圆环宽度（px） */
  lineWidth?: number
  /** 是否反向运动 */
  reverse?: boolean
  /** 圆环遮罩圆角：需与容器实际圆角一致，彗星才能贴合边框（含圆角）平滑转弯 */
  borderRadius?: number | string
  /** 附加到包裹容器的类名（可用于 hover 显隐等） */
  className?: string
  style?: React.CSSProperties
  children?: React.ReactNode
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
 * beam 模式：与 orbit 同为圆锥渐变彗星，但彗星弧长按 size / 实测周长换算，
 * 色标均匀铺满彗星弧段，两端透明收尾。
 *
 * 为什么不再用 offset-path: rect()：矩形路径上光带是「平移的矩形条」，
 * 拐角处方向变化集中在极短的圆角弧长上，长光带会出现生硬的 90° 急转；
 * 圆锥渐变绕中心连续旋转，彗星扇区天然沿边框圆角平滑弯曲，无任何折角。
 */
const buildBeamGradient = (color: BorderBeamProps['color'], cometPercent: number) => {
  if (!color) return undefined
  // 彗星弧长占比收敛到 [4%, 60%]，避免过短不可见或过长盖满整圈
  const span = Math.min(Math.max(cometPercent, 4), 60)
  if (typeof color === 'string') {
    return `conic-gradient(from var(--border-beam-angle), transparent 0%, ${color} ${(span * 0.5).toFixed(2)}%, transparent ${span.toFixed(2)}%, transparent 100%)`
  }
  const fadeIn = span * 0.08
  const stops = color
    .map((s) => `${s.color} ${(fadeIn + (span - fadeIn) * (s.percent / 100)).toFixed(2)}%`)
    .join(', ')
  return `conic-gradient(from var(--border-beam-angle), transparent 0%, ${stops}, transparent ${span.toFixed(2)}%, transparent 100%)`
}

/**
 * 边框流光（antd 无此组件，本地实现）：
 *  - beam（默认）：彗星光弧沿容器边框循环，弧长由 size(px) 按实测周长换算
 *  - orbit：彗星光弧沿椭圆/胶囊边框匀速环绕（适合圆角按钮）
 *
 * 两种模式同为「圆锥渐变 + mask 圆环」机制：
 *  - 彗星随 --border-beam-angle（@property 注册，globals.css）连续旋转，
 *    沿整个边框（含圆角）平滑流动，拐角无生硬转折
 *  - 纯 CSS 动画，无逐帧 JS 开销；不支持 @property 的浏览器降级为不可见
 *  - prefers-reduced-motion 下自动隐藏
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
  const wrapperRef = React.useRef<HTMLDivElement>(null)
  const [perimeter, setPerimeter] = React.useState(0)

  // 实测容器周长，把 size(px) 换算为彗星弧长占比；随窗口/断点变化自动更新
  React.useEffect(() => {
    if (variant !== 'beam') return
    const el = wrapperRef.current
    if (!el) return
    const update = () => {
      const rect = el.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) setPerimeter(2 * (rect.width + rect.height))
    }
    update()
    const observer = new ResizeObserver(update)
    observer.observe(el)
    return () => observer.disconnect()
  }, [variant])

  const gradient =
    variant === 'orbit'
      ? buildConicGradient(color)
      : buildBeamGradient(color, perimeter > 0 ? (size / perimeter) * 100 : 10)

  return (
    <div ref={wrapperRef} className={className} style={{ position: 'relative', ...style }}>
      {children}
      {!reduce && gradient && (
        <div
          aria-hidden
          className={variant === 'orbit' ? 'ant-border-beam-orbit' : 'ant-border-beam'}
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius,
            padding: lineWidth,
            background: gradient,
            // 仅保留 lineWidth 厚度的圆环区域，其余透明
            WebkitMask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            WebkitMaskComposite: 'xor',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            animation: `border-beam-orbit-spin ${duration}s linear infinite`,
            animationDirection: reverse ? 'reverse' : 'normal',
            animationDelay: `${-delay}s`,
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  )
}
