import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'

import { cn } from '~/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*=\'size-\'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        // 默认轻量按钮：card 背景 + border + 前景色，hover 时 muted 背景
        minimal:
          'bg-card text-card-foreground border border-border rounded-lg hover:bg-muted hover:text-foreground data-[active=true]:bg-primary/10 data-[active=true]:border-primary data-[active=true]:text-primary aria-pressed:bg-primary/10 aria-pressed:border-primary aria-pressed:text-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed',
        // 主色实心按钮
        default:
          'bg-primary text-primary-foreground border border-transparent shadow-sm hover:bg-primary/90 rounded-lg',
        // 危险操作按钮
        destructive:
          'bg-destructive text-white border border-transparent shadow-sm hover:bg-destructive/90 focus-visible:ring-destructive/30 dark:focus-visible:ring-destructive/40',
        // 描边按钮：白/深色背景 + border
        outline:
          'border border-border bg-background text-foreground shadow-none hover:bg-muted hover:text-foreground rounded-lg',
        // 次级实心按钮
        secondary:
          'bg-secondary text-secondary-foreground border border-transparent shadow-sm hover:bg-secondary/80',
        // 透明按钮，hover 时 accent 背景
        ghost:
          'border border-transparent hover:bg-accent hover:text-accent-foreground dark:hover:bg-accent/50',
        // 文字链接按钮
        link: 'border border-transparent text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 rounded-md gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 rounded-md px-6 has-[>svg]:px-4',
        icon: 'size-9',
      },
    },
    defaultVariants: {
      variant: 'minimal',
      size: 'default',
    },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
  }) {
  const Comp = asChild ? Slot : 'button'

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  )
}

export { Button, buttonVariants }

