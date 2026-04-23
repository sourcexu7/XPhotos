/**
 * 统一弹窗组件
 * 支持：焦点陷阱、键盘导航、ARIA属性
 */

'use client'

import React, { useEffect, useRef, useCallback } from 'react'
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
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  
  // 处理Escape键关闭
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === 'Escape' && closable) {
      onClose()
    }
    
    // Tab键焦点陷阱
    if (e.key === 'Tab' && modalRef.current) {
      const focusableElements = modalRef.current.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
      const firstElement = focusableElements[0] as HTMLElement
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement
      
      if (e.shiftKey && document.activeElement === firstElement) {
        e.preventDefault()
        lastElement?.focus()
      } else if (!e.shiftKey && document.activeElement === lastElement) {
        e.preventDefault()
        firstElement?.focus()
      }
    }
  }, [closable, onClose])
  
  useEffect(() => {
    if (open) {
      // 保存当前焦点元素
      previousActiveElement.current = document.activeElement as HTMLElement
      
      // 禁止背景滚动
      document.body.style.overflow = 'hidden'
      
      // 添加键盘事件监听
      document.addEventListener('keydown', handleKeyDown)
      
      // 自动聚焦第一个可交互元素
      setTimeout(() => {
        if (modalRef.current) {
          const focusableElements = modalRef.current.querySelectorAll(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          )
          const firstElement = focusableElements[0] as HTMLElement
          firstElement?.focus()
        }
      }, 100)
    } else {
      // 恢复背景滚动
      document.body.style.overflow = ''
      
      // 移除键盘事件监听
      document.removeEventListener('keydown', handleKeyDown)
      
      // 恢复之前的焦点
      previousActiveElement.current?.focus()
    }
    
    return () => {
      document.body.style.overflow = ''
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [open, handleKeyDown])
  
  if (!open) return null
  
  return (
    <div
      className="fixed inset-0 z-[var(--admin-z-modal)] flex items-center justify-center"
      onClick={maskClosable ? onClose : undefined}
      role="presentation"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" aria-hidden="true" />
      
      {/* 弹窗内容 */}
      <div
        ref={modalRef}
        className={cn(
          'relative bg-[var(--admin-bg)] rounded-[var(--admin-radius-lg)] shadow-[var(--admin-shadow-lg)]',
          'max-h-[90vh] flex flex-col',
          className
        )}
        style={{ width: typeof width === 'number' ? `${width}px` : width }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'modal-title' : undefined}
        aria-describedby={subtitle ? 'modal-description' : undefined}
      >
        {/* 头部 */}
        {(title || subtitle || closable) && (
          <div className="flex items-start justify-between px-6 py-4 border-b border-[var(--admin-border-light)]">
            <div className="flex-1">
              {title && (
                <h3 
                  id="modal-title"
                  className="text-lg font-semibold text-[var(--admin-text-primary)] mb-1"
                >
                  {title}
                </h3>
              )}
              {subtitle && (
                <p 
                  id="modal-description"
                  className="text-sm text-[var(--admin-text-secondary)]"
                >
                  {subtitle}
                </p>
              )}
            </div>
            {closable && (
              <button
                onClick={onClose}
                className="ml-4 p-1 rounded-[var(--admin-radius-sm)] text-[var(--admin-text-tertiary)] hover:text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] transition-colors"
                aria-label="关闭弹窗"
                type="button"
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

