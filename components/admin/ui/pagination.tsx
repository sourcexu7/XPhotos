/**
 * 统一分页组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'
import { ChevronLeft, ChevronRight, ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from 'lucide-react'
import { Button } from '~/components/ui/button'

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
  pageSizeOptions = ['8', '16', '32', '64'],
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
    <div className={cn('flex flex-col sm:flex-row items-center justify-between gap-4 py-6', className)}>
      <div className="flex items-center gap-4 w-full sm:w-auto">
        {showTotal && (
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {showTotal(total, [start, end])}
          </span>
        )}
        {showSizeChanger && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">每页</span>
            <select
              value={pageSize}
              onChange={handleSizeChange}
              className="h-10 px-3 text-sm border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 transition-all duration-200"
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="icon"
          variant="ghost"
          disabled={current === 1}
          onClick={() => handlePageChange(1)}
          className="h-10 w-10 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="First page"
        >
          <ChevronLeftIcon className="h-4 w-4" />
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          disabled={current === 1}
          onClick={() => handlePageChange(current - 1)}
          className="h-10 w-10 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        {getPageNumbers().map((page, index) => {
          if (page === 'ellipsis') {
            return (
              <span
                key={`ellipsis-${index}`}
                className="h-10 w-10 flex items-center justify-center text-muted-foreground"
              >
                ...
              </span>
            )
          }
          
          const pageNum = page as number
          const isActive = pageNum === current
          
          return (
            <Button
              key={pageNum}
              size="sm"
              variant={isActive ? "default" : "ghost"}
              onClick={() => handlePageChange(pageNum)}
              className={cn(
                'h-10 min-w-[40px] px-3 flex items-center justify-center rounded-lg text-sm font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary text-white shadow-sm hover:bg-primary/90'
                  : 'border border-border bg-background text-foreground hover:bg-muted'
              )}
              aria-label={`Go to page ${pageNum}`}
            >
              {pageNum}
            </Button>
          )
        })}
        
        <Button
          size="icon"
          variant="ghost"
          disabled={current === totalPages}
          onClick={() => handlePageChange(current + 1)}
          className="h-10 w-10 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Next page"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          disabled={current === totalPages}
          onClick={() => handlePageChange(totalPages)}
          className="h-10 w-10 rounded-lg border border-border bg-background text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          aria-label="Last page"
        >
          <ChevronRightIcon className="h-4 w-4" />
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

