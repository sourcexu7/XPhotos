/**
 * 统一按钮组件
 * 遵循 21st.dev 设计规范
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'

export interface AdminButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}

export function AdminButton({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}: AdminButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed'
  
  const variants = {
    primary: 'bg-[var(--admin-primary)] text-white hover:bg-[var(--admin-primary-hover)] active:bg-[var(--admin-primary-active)] focus:ring-[var(--admin-primary)]',
    secondary: 'bg-[var(--admin-bg-secondary)] text-[var(--admin-text-primary)] border border-[var(--admin-border)] hover:bg-[var(--admin-bg-tertiary)] focus:ring-[var(--admin-primary)]',
    ghost: 'bg-transparent text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] focus:ring-[var(--admin-primary)]',
    danger: 'bg-[var(--admin-error)] text-white hover:bg-[#c82333] active:bg-[#bd2130] focus:ring-[var(--admin-error)]',
    success: 'bg-[var(--admin-success)] text-white hover:bg-[#218838] active:bg-[#1e7e34] focus:ring-[var(--admin-success)]',
  }
  
  const sizes = {
    sm: 'h-8 px-3 text-xs rounded-[var(--admin-radius-md)]',
    md: 'h-10 px-4 text-sm rounded-[var(--admin-radius-md)]',
    lg: 'h-12 px-6 text-base rounded-[var(--admin-radius-md)]',
  }
  
  return (
    <button
      className={cn(
        baseStyles,
        variants[variant],
        sizes[size],
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg
          className="animate-spin -ml-1 mr-2 h-4 w-4"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {icon && !loading && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  )
}

