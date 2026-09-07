'use client'

import { Tag } from 'antd'
import { useRouter } from 'next-nprogress-bar'
import { useCallback } from 'react'
import type {
  ComponentProps,
  ForwardRefExoticComponent,
  HTMLAttributes,
  KeyboardEvent,
  RefAttributes,
} from 'react'
import { safePush } from '~/lib/router/safe-navigation'

type AntdCheckableTagProps = ComponentProps<typeof Tag.CheckableTag>

/** antd 类型未声明、但运行时经 restProps 透传到 span 的可访问性属性 */
type CheckableTagA11yProps = Pick<HTMLAttributes<HTMLSpanElement>, 'tabIndex' | 'onKeyDown' | 'role'>

const CheckableTag = Tag.CheckableTag as ForwardRefExoticComponent<
  AntdCheckableTagProps & CheckableTagA11yProps & RefAttributes<HTMLSpanElement>
>

export interface TagLinkProps extends CheckableTagA11yProps {
  /** 标签名，同时作为 /tag/:tag 路由参数 */
  tag: string
}

/**
 * antd 风格可点击标签：点击导航至 /tag/:tag
 *
 * 基于 Tag.CheckableTag 的完全受控 filled 态（checked 恒为 true）实现：
 * - 底色/悬停/按下/字号/间距/圆角全部来自 antd 设计令牌
 *   （colorPrimary → colorPrimaryHover → colorPrimaryActive，暗色主题自动适配）
 * - 自带 antd 规范的 cursor: pointer
 * - 补充 tabIndex + Enter/Space 键盘导航（antd 默认 span 不可聚焦），保持站点可访问性规范
 */
export function TagLink({ tag, ...rest }: TagLinkProps) {
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
    <CheckableTag
      checked
      onClick={navigate}
      tabIndex={0}
      role="link"
      onKeyDown={handleKeyDown}
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      {...rest}
    >
      {tag}
    </CheckableTag>
  )
}
