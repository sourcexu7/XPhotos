/**
 * 统一表格组件
 */

'use client'

import React from 'react'
import { cn } from '~/lib/utils'

export interface AdminTableColumn<T = any> {
  key: string
  title: string
  dataIndex?: string
  width?: string | number
  align?: 'left' | 'center' | 'right'
  render?: (value: any, record: T, index: number) => React.ReactNode
}

export interface AdminTableProps<T = any> {
  columns: AdminTableColumn<T>[]
  dataSource: T[]
  loading?: boolean
  rowKey?: string | ((record: T) => string)
  onRow?: (record: T) => React.HTMLAttributes<HTMLTableRowElement>
  className?: string
  emptyText?: string
}

export function AdminTable<T = any>({
  columns,
  dataSource,
  loading = false,
  rowKey = 'id',
  onRow,
  className,
  emptyText = '暂无数据',
}: AdminTableProps<T>) {
  const getRowKey = (record: T, index: number): string => {
    if (typeof rowKey === 'function') {
      return rowKey(record)
    }
    return (record as any)[rowKey] || String(index)
  }
  
  return (
    <div className={cn('w-full overflow-x-auto', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-[var(--admin-bg-secondary)] border-b border-[var(--admin-border)]">
            {columns.map((column) => (
              <th
                key={column.key}
                className={cn(
                  'px-4 py-3 text-left text-xs font-semibold text-[var(--admin-text-secondary)] uppercase tracking-wider',
                  column.align === 'center' && 'text-center',
                  column.align === 'right' && 'text-right'
                )}
                style={{ width: column.width }}
              >
                {column.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-[var(--admin-bg)] divide-y divide-[var(--admin-border-light)]">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[var(--admin-text-secondary)]">
                <div className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
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
                  加载中...
                </div>
              </td>
            </tr>
          ) : dataSource.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-sm text-[var(--admin-text-secondary)]">
                {emptyText}
              </td>
            </tr>
          ) : (
            dataSource.map((record, index) => {
              const rowProps = onRow ? onRow(record) : {}
              return (
                <tr
                  key={getRowKey(record, index)}
                  className="hover:bg-[var(--admin-bg-secondary)] transition-colors duration-150"
                  {...rowProps}
                >
                  {columns.map((column) => {
                    const value = column.dataIndex
                      ? (record as any)[column.dataIndex]
                      : undefined
                    const content = column.render
                      ? column.render(value, record, index)
                      : value
                    
                    return (
                      <td
                        key={column.key}
                        className={cn(
                          'px-4 py-3 text-sm text-[var(--admin-text-primary)]',
                          column.align === 'center' && 'text-center',
                          column.align === 'right' && 'text-right'
                        )}
                      >
                        {content}
                      </td>
                    )
                  })}
                </tr>
              )
            })
          )}
        </tbody>
      </table>
    </div>
  )
}

