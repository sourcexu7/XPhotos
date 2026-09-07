'use client'

import { useRouter } from 'next-nprogress-bar'
import { useCallback } from 'react'
import type { HTMLAttributes, KeyboardEvent } from 'react'
import { cn } from '~/lib/utils'
import { safePush } from '~/lib/router/safe-navigation'

type TagLinkA11yProps = Pick<HTMLAttributes<HTMLSpanElement>, 'className' | 'tabIndex' | 'onKeyDown' | 'role'>

export interface TagLinkProps extends TagLinkA11yProps {
  /** 标签名，同时作为 /tag/:tag 路由参数 */
  tag: string
}

/**
 * 白瓷配色可点击标签（方案 2 · 中性实底）：点击导航至 /tag/:tag
 *
 * - 色值全部来自白瓷 CSS 变量：bg-muted 实底 + text-foreground 前景字，
 *   hover/按下用 color-mix 向前景色方向加深一档，明暗主题随 .dark 自动适配，零彩色
 * - 尺寸沿用 antd Tag 规格：22px 高 / 12px 字号 / 行高 20px / 0 7px 内边距 / 4px 圆角
 * - tabIndex + role="link" + Enter/Space 键盘导航；焦点环保留蓝色 ring（唯一彩色保留项）
 */
export function TagLink({ tag, className, ...rest }: TagLinkProps) {
  const router = useRouter()
  const navigate = useCallback(() => safePush(router, `/tag/${tag}`), [router, tag])

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLSpanElement>) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        navigate()
      }
    },
    [navigate],
  )

  return (
    <span
      onClick={navigate}
      tabIndex={0}
      role="link"
      onKeyDown={handleKeyDown}
      className={cn(
        'inline-flex h-[22px] cursor-pointer select-none items-center whitespace-nowrap rounded border-0 bg-muted px-[7px] text-xs leading-[20px] text-foreground transition-colors',
        'hover:bg-[color-mix(in_srgb,var(--muted)_85%,var(--foreground))]',
        'active:bg-[color-mix(in_srgb,var(--muted)_72%,var(--foreground))]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60',
        className,
      )}
      {...rest}
    >
      {tag}
    </span>
  )
}
