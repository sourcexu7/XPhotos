'use client'

import React from 'react'
import { cn } from '~/lib/utils'

interface TagProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode
  variant?: 'default' | 'active'
  icon?: React.ReactNode
}

export function Tag({ 
  children, 
  variant = 'default',
  icon,
  className, 
  onClick,
  disabled,
  ...props 
}: TagProps) {
  const baseClass = cn(
    'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-normal',
    'transition-all duration-200 ease-out',
    'select-none cursor-pointer',
    'focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background focus:ring-ring',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    variant === 'active'
      ? 'bg-foreground text-background border border-foreground shadow-sm'
      : 'bg-background/80 text-foreground border border-border/60 backdrop-blur-sm hover:bg-foreground/10 hover:border-foreground/30 active:scale-95'
  )

  if (onClick) {
    return (
      <button 
        onClick={onClick}
        disabled={disabled}
        className={cn(baseClass, className)}
        {...props}
      >
        {icon && <span className="opacity-60">{icon}</span>}
        {children}
      </button>
    )
  }

  return (
    <span className={cn(baseClass, className)} {...props}>
      {icon && <span className="opacity-60">{icon}</span>}
      {children}
    </span>
  )
}

export default Tag