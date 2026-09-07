import * as React from 'react'

import { cn } from '~/lib/utils'

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 白瓷极简输入框：语义令牌，暗色模式自动适配
        'h-10 w-full min-w-0 rounded-[4px] px-3 text-sm text-foreground bg-background border border-input cursor-text',
        // hover
        'hover:border-foreground/20 hover:cursor-text',
        // focus：蓝色焦点环（--ring），与全站焦点语言一致
        'focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/20 focus-visible:outline-none',
        // disabled
        'disabled:bg-muted/50 disabled:cursor-not-allowed disabled:text-muted-foreground',
        // accessibility / invalid
        'aria-invalid:ring-destructive/20 aria-invalid:border-destructive',
        className
      )}
      {...props}
    />
  )
}

export { Input }
