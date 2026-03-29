/**
 * 统一卡片组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'

export interface AdminCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title?: string
  subtitle?: string
  headerAction?: React.ReactNode
  footer?: React.ReactNode
  padding?: 'none' | 'sm' | 'md' | 'lg'
}

export function AdminCard({
  title,
  subtitle,
  headerAction,
  footer,
  padding = 'md',
  className,
  children,
  ...props
}: AdminCardProps) {
  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
  
  return (
    <div
      className={cn(
        'bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-[var(--admin-radius-md)]',
        'shadow-[var(--admin-shadow-sm)]',
        className
      )}
      {...props}
    >
      {(title || subtitle || headerAction) && (
        <div className="flex items-start justify-between p-6 pb-4 border-b border-[var(--admin-border-light)]">
          <div className="flex-1">
            {title && (
              <h3 className="text-base font-semibold text-[var(--admin-text-primary)] mb-1">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-[var(--admin-text-secondary)]">
                {subtitle}
              </p>
            )}
          </div>
          {headerAction && <div className="ml-4">{headerAction}</div>}
        </div>
      )}
      <div className={cn(paddingClasses[padding], !title && !subtitle && !headerAction && paddingClasses[padding])}>
        {children}
      </div>
      {footer && (
        <div className="px-6 py-4 border-t border-[var(--admin-border-light)]">
          {footer}
        </div>
      )}
    </div>
  )
}

