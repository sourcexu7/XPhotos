/**
 * 统一输入框组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'

export interface AdminInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const AdminInput = React.forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, helperText, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-[var(--admin-text-primary)] mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-tertiary)]">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              'w-full h-10 px-4 text-sm',
              'bg-[var(--admin-bg)] border border-[var(--admin-border)] rounded-[var(--admin-radius-md)]',
              'text-[var(--admin-text-primary)] placeholder:text-[var(--admin-text-tertiary)]',
              'transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)] focus:border-[var(--admin-primary)]',
              'disabled:bg-[var(--admin-bg-secondary)] disabled:cursor-not-allowed',
              error && 'border-[var(--admin-error)] focus:ring-[var(--admin-error)]',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--admin-text-tertiary)]">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-xs text-[var(--admin-error)]">{error}</p>
        )}
        {helperText && !error && (
          <p className="mt-1 text-xs text-[var(--admin-text-secondary)]">{helperText}</p>
        )}
      </div>
    )
  }
)

AdminInput.displayName = 'AdminInput'

