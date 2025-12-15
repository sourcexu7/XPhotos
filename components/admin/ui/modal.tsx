/**
 * 统一弹窗组件
 */

'use client'

import React, { useEffect } from 'react'
import { cn } from '~/lib/utils'
import { AdminButton } from './button'
import { X } from 'lucide-react'

export interface AdminModalProps {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  width?: string | number
  closable?: boolean
  maskClosable?: boolean
  className?: string
}

export function AdminModal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 520,
  closable = true,
  maskClosable = true,
  className,
}: AdminModalProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])
  
  if (!open) return null
  
  return (
    <div
      className="fixed inset-0 z-[var(--admin-z-modal)] flex items-center justify-center"
      onClick={maskClosable ? onClose : undefined}
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      
      {/* 弹窗内容 */}
      <div
        className={cn(
          'relative bg-[var(--admin-bg)] rounded-[var(--admin-radius-lg)] shadow-[var(--admin-shadow-lg)]',
          'max-h-[90vh] flex flex-col',
          className
        )}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 头部 */}
        {(title || subtitle || closable) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--admin-border-light)]">
            <div className="flex-1">
              {title && (
                <h3 className="text-lg font-semibold text-[var(--admin-text-primary)] mb-1">
                  {title}
                </h3>
              )}
              {subtitle && (
                <p className="text-sm text-[var(--admin-text-secondary)]">
                  {subtitle}
                </p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="ml-4 p-1 rounded-[var(--admin-radius-sm)] text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
        
        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          {children}
        </div>
        
        {/* 底部 */}
        {footer && (
          <div className="px-6 py-4 border-t border-[var(--admin-border-light)] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}

