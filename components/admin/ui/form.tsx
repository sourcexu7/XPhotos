/**
 * 统一表单组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'

export interface AdminFormItemProps {
  label?: string
  required?: boolean
  error?: string
  helperText?: string
  children: React.ReactNode
  className?: string
  labelAlign?: 'left' | 'top'
}

export function AdminFormItem({
  label,
  required,
  error,
  helperText,
  children,
  className,
  labelAlign = 'top',
}: AdminFormItemProps) {
  return (
    <div className={cn(
      labelAlign === 'left' ? 'flex items-start gap-4' : 'flex flex-col',
      className
    )}>
      {label && (
        <label className={cn(
          'text-sm font-medium text-[var(--admin-text-primary)]',
          labelAlign === 'left' && 'w-32 flex-shrink-0 pt-2',
          required && "after:content-['*'] after:ml-1 after:text-[var(--admin-error)]"
        )}>
          {label}
        </label>
      )}
      <div className={labelAlign === 'left' ? 'flex-1' : 'w-full'}>
        {children}
        {error && (
          <p className="mt-1 text-xs text-[var(--admin-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">{helperText}</p>
        )}
      </div>
    </div>
  )
}

export interface AdminFormProps extends React.FormHTMLAttributes<HTMLFormElement> {
  layout?: 'vertical' | 'horizontal'
  children: React.ReactNode
}

export function AdminForm({
  layout = 'vertical',
  children,
  className,
  ...props
}: AdminFormProps) {
  return (
    <form
      className={cn(
        'space-y-6',
        layout === 'horizontal' && 'space-y-0 space-x-0',
        className
      )}
      {...props}
    >
      {children}
    </form>
  )
}

