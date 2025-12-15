/**
 * 统一标签页组件
 */

'use client'

import React, { useState } from 'react'
import { cn } from '~/lib/utils'

export interface AdminTabItem {
  key: string
  label: string
  children: React.ReactNode
  disabled?: boolean
}

export interface AdminTabsProps {
  items: AdminTabItem[]
  defaultActiveKey?: string
  activeKey?: string
  onChange?: (key: string) => void
  className?: string
}

export function AdminTabs({
  items,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  className,
}: AdminTabsProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(defaultActiveKey || items[0]?.key || '')
  const activeKey = controlledActiveKey !== undefined ? controlledActiveKey : internalActiveKey
  
  const handleChange = (key: string) => {
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key)
    }
    onChange?.(key)
  }
  
  const activeItem = items.find(item => item.key === activeKey)
  
  return (
    <div className={cn('flex flex-col h-full', className)}>
      {/* 标签栏 */}
      <div className="flex border-b border-[var(--admin-border-light)]">
        {items.map((item) => {
          const isActive = item.key === activeKey
          return (
            <button
              key={item.key}
              onClick={() => !item.disabled && handleChange(item.key)}
              disabled={item.disabled}
              className={cn(
                'px-4 py-3 text-sm font-medium transition-colors relative',
                'border-b-2 border-transparent',
                isActive
                  ? 'text-[var(--admin-primary)] border-[var(--admin-primary)]'
                  : 'text-[var(--admin-text-secondary)] hover:text-[var(--admin-text-primary)]',
                item.disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {item.label}
            </button>
          )
        })}
      </div>
      
      {/* 内容区 */}
      <div className="flex-1 overflow-y-auto">
        {activeItem?.children}
      </div>
    </div>
  )
}

