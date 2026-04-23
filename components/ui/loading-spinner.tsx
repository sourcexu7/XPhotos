'use client'

import { cn } from '~/lib/utils'
import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  text?: string
}

const sizeMap = {
  sm: {
    container: 'h-6 w-6',
    icon: 'h-4 w-4',
    border: 'border-2',
  },
  md: {
    container: 'h-10 w-10',
    icon: 'h-6 w-6',
    border: 'border-[3px]',
  },
  lg: {
    container: 'h-12 w-12',
    icon: 'h-8 w-8',
    border: 'border-4',
  },
}

export function LoadingSpinner({ 
  size = 'md', 
  className,
  text 
}: LoadingSpinnerProps) {
  const config = sizeMap[size]

  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <div
        className={cn(
          'animate-spin rounded-full border-muted border-t-primary',
          config.container,
          config.border
        )}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  )
}

interface LoadingOverlayProps {
  visible: boolean
  text?: string
  className?: string
}

export function LoadingOverlay({ 
  visible, 
  text = '加载中...', 
  className 
}: LoadingOverlayProps) {
  if (!visible) return null

  return (
    <div 
      className={cn(
        'absolute inset-0 z-50 flex items-center justify-center bg-background/60 backdrop-blur-sm rounded-inherit transition-opacity duration-200',
        className
      )}
      role="status"
      aria-label={text}
    >
      <LoadingSpinner size="md" text={text} />
    </div>
  )
}
