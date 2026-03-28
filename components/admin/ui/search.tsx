'use client'

import React from 'react'
import { Input, Button } from 'antd'
import { Search } from 'lucide-react'
import { MagnifyingGlassIcon } from '@radix-ui/react-icons'
import { cn } from '~/lib/utils'
import { useButtonStore } from '~/app/providers/button-store-providers'
import { usePathname } from 'next/navigation'

const { Search: AntSearch } = Input

type SearchType = 'icon' | 'border' | 'button' | 'input'

interface SearchProps {
  type?: SearchType
  placeholder?: string
  onSearch?: (value: string) => void
  className?: string
  size?: 'small' | 'default' | 'large'
}

export default function SearchComponent({
  type = 'icon',
  placeholder = '搜索',
  onSearch,
  className = '',
  size = 'default',
}: SearchProps) {
  const pathname = usePathname()
  const { setSearchOpen } = useButtonStore((state) => state)

  const handleSearchClick = () => {
    setSearchOpen(true)
  }

  switch (type) {
    case 'icon':
      return (
        <>
          {pathname.startsWith('/admin') && (
            <Search
              onClick={handleSearchClick}
              size={size === 'small' ? 16 : size === 'large' ? 24 : 20}
              className={cn('cursor-pointer', className)}
            />
          )}
        </>
      )

    case 'border':
      return (
        <Button
          className={cn(
            'w-[240px] justify-start text-left font-normal',
            'text-muted-foreground',
            className
          )}
          onClick={handleSearchClick}
          size={size}
        >
          <MagnifyingGlassIcon className="mr-2 h-4 w-4 inline-block align-middle" />
          <span className="align-middle">{placeholder}</span>
        </Button>
      )

    case 'button':
      return (
        <AntSearch
          placeholder={placeholder}
          onSearch={onSearch}
          enterButton
          size={size}
          className={className}
        />
      )

    case 'input':
      return (
        <Input
          placeholder={placeholder}
          size={size}
          style={{ borderRadius: 8 }}
          className={className}
        />
      )

    default:
      return null
  }
}
