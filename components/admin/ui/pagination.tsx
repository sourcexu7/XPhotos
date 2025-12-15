/**
 * 统一分页组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export interface AdminPaginationProps {
  current: number
  total: number
  pageSize: number
  onChange: (page: number, pageSize: number) => void
  showSizeChanger?: boolean
  pageSizeOptions?: string[]
  showTotal?: (total: number, range: [number, number]) => React.ReactNode
  className?: string
}

export function AdminPagination({
  current,
  total,
  pageSize,
  onChange,
  showSizeChanger = false,
  pageSizeOptions = ['10', '20', '50', '100'],
  showTotal,
  className,
}: AdminPaginationProps) {
  const totalPages = Math.ceil(total / pageSize)
  const start = (current - 1) * pageSize + 1
  const end = Math.min(current * pageSize, total)
  
  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onChange(page, pageSize)
    }
  }
  
  const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(1, Number(e.target.value))
  }
  
  const getPageNumbers = () => {
    const pages: (number | string)[] = []
    const maxVisible = 7
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i)
      }
    } else {
      if (current <= 3) {
        for (let i = 1; i <= 5; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      } else if (current >= totalPages - 2) {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i)
      } else {
        pages.push(1)
        pages.push('ellipsis')
        for (let i = current - 1; i <= current + 1; i++) pages.push(i)
        pages.push('ellipsis')
        pages.push(totalPages)
      }
    }
    
    return pages
  }
  
  return (
    <div className={cn('flex items-center gap-4', className)}>
      {showTotal && (
        <span className="text-sm text-[var(--admin-text-secondary)] whitespace-nowrap">
          {showTotal(total, [start, end])}
        </span>
      )}
      {showSizeChanger && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-[var(--admin-text-secondary)]">每页</span>
          <select
            value={pageSize}
            onChange={handleSizeChange}
            className="h-8 px-2 text-sm border border-[var(--admin-border)] rounded-[var(--admin-radius-md)] bg-[var(--admin-bg)] text-[var(--admin-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--admin-primary)]"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
        </div>
      )}
      
      <div className="flex items-center gap-1.5 ml-auto">
        <button
          onClick={() => handlePageChange(current - 1)}
          disabled={current === 1}
          className="h-8 w-8 flex items-center justify-center rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="h-8 w-8 flex items-center justify-center text-[var(--admin-text-tertiary)]"
              >
                ...
              </span>
            )
          }
          
          const pageNum = page as number
          const isActive = pageNum === current
          
          return (
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              className={cn(
                'h-8 min-w-[32px] px-2 flex items-center justify-center rounded-[var(--admin-radius-md)] text-sm font-medium transition-colors',
                isActive
                  ? 'bg-[var(--admin-primary)] text-white'
                  : 'border border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)]'
              )}
            >
              {pageNum}
            </button>
          )
        })}
        
        <button
          onClick={() => handlePageChange(current + 1)}
          disabled={current === totalPages}
          className="h-8 w-8 flex items-center justify-center rounded-[var(--admin-radius-md)] border border-[var(--admin-border)] bg-[var(--admin-bg)] text-[var(--admin-text-primary)] hover:bg-[var(--admin-bg-secondary)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

