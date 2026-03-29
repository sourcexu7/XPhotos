'use client'

import { forwardRef } from 'react'
import type React from 'react'
import { Button } from 'antd'
import type { ButtonProps } from 'antd'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '~/components/ui/tooltip'
import { cn } from '~/lib/utils'

export type TooltipIconButtonProps = ButtonProps & {
    tooltip: string
    side?: 'top' | 'bottom' | 'left' | 'right'
    asChild?: boolean
  }

export const TooltipIconButton = forwardRef<
  HTMLElement,
  TooltipIconButtonProps
>(({ children, tooltip, side = "bottom", className, type, size, ...rest }, ref) => {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type={type || 'default'}
          size={size}
          {...rest}
          className={cn(className)}
          ref={ref as any}
        >
          {children}
          <span className="sr-only">{tooltip}</span>
        </Button>
      </TooltipTrigger>
      <TooltipContent side={side}>{tooltip}</TooltipContent>
    </Tooltip>
  )
})

TooltipIconButton.displayName = 'TooltipIconButton'

